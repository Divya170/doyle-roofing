/**
 * Business-rule checks that run without a database or Nest:
 *   npm test   (or: npx tsx src/rules.spec.ts)
 * Covers the estimate rules (the design's exact messages), photo checks, references,
 * idempotency keys, CSV safety, cookie/CSRF helpers, project/content validation and seed data.
 */
import { strict as assert } from 'assert';
import { cleanIdemKey, csvSafe, isHoneypot, phoneOk, publicRef } from './common/forms';
import { OptionLists, safeName, sniffPhoto, validateEstimate } from './inquiries/estimate-validation';
import { validateProject } from './projects/project-validation';
import { validateContentFields } from './content/content.validation';
import { CONTENT_TYPE_MAP } from './content/content.schemas';
import { CONTENT_SEED, PROJECTS_SEED } from './database/seed-data';
import { parseCookies, sameToken } from './common/cookies';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

const list = (name: string) => CONTENT_SEED['form-option'].filter((r) => r.fields.list === name).map((r) => String(r.fields.label));
const LISTS: OptionLists = {
  property: list('property'),
  timeline: list('timeline'),
  budget: list('budget'),
  roofIssue: list('roof-issue'),
  roofAge: list('roof-age'),
  remodelArea: list('remodel-area'),
};
const good = {
  type: 'roofing', property: 'Single-family home', location: '2201 Main St, Houston, TX 77002', timeline: 'Within 1 month',
  budget: 'Not sure yet / prefer to discuss', desc: 'Water stain on the bedroom ceiling after the last storm.',
  name: 'Maria Lopez', phone: '(713) 555-0142', email: 'Maria@Example.com', roofIssues: ['Active leak', 'Hacked'], roofAge: '5–15 years',
  areas: ['Kitchen'], photos: [], website: '',
};
const es = (p: object) => validateEstimate({ ...good, ...p }, LISTS).errors;

test('a complete estimate passes and is normalised', () => {
  const { errors, value } = validateEstimate(good, LISTS);
  assert.deepEqual(errors, {});
  assert.equal(value.email, 'maria@example.com');
  assert.deepEqual(value.roofIssues, ['Active leak'], 'unknown chips dropped');
  assert.equal(value.roofAge, '5–15 years');
  assert.deepEqual(value.areas, [], 'remodel areas dropped for a roofing request');
});

test('empty estimate returns the design’s messages', () => {
  const { errors } = validateEstimate({}, LISTS);
  assert.equal(errors.type, 'Choose Roofing or Remodeling.');
  assert.equal(errors.property, 'Select a property type.');
  assert.equal(errors.location, 'Enter the property address, or city and ZIP code.');
  assert.equal(errors.timeline, 'Choose a preferred timeline.');
  assert.equal(errors.budget, 'Choose a budget range, or “Not sure yet”.');
  assert.equal(errors.desc, 'Describe the project in a sentence or two.');
  assert.equal(errors.name, 'Enter your full name.');
  assert.equal(errors.phone, 'Enter a phone number so we can reach you.');
  assert.equal(errors.email, 'Enter your email address.');
});

test('description, phone, email and option rules', () => {
  assert.equal(es({ desc: 'Leaky roof' }).desc, 'Add a little more detail — at least 20 characters.');
  assert.equal(es({ desc: 'x'.repeat(2001) }).desc, 'Keep the description under 2,000 characters.');
  assert.equal(es({ phone: '555-0142' }).phone, 'Enter a valid phone number with area code, e.g. (713) 555-0142.');
  assert.equal(es({ phone: '713 555 0142 ext 2' }).phone, 'Enter a valid phone number with area code, e.g. (713) 555-0142.', 'letters rejected');
  assert.equal(es({ phone: '+1 713.555.0142' }).phone, undefined);
  assert.equal(es({ phone: '+44 20 7946 09581' }).phone, 'Enter a valid phone number with area code, e.g. (713) 555-0142.', 'max 11 digits');
  assert.equal(es({ email: 'a@b' }).email, 'Enter an email address in the format name@example.com.');
  assert.equal(es({ budget: '$1 million' }).budget, 'Choose a budget range, or “Not sure yet”.', 'only published options');
  assert.equal(es({ type: 'plumbing' }).type, 'Choose Roofing or Remodeling.');
  assert.equal(es({ photos: ['a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32), 'd'.repeat(32), 'e'.repeat(32), 'f'.repeat(32)] }).photos, 'Only 5 photos can be attached.');
  const rem = validateEstimate({ ...good, type: 'remodeling', areas: ['Kitchen', 'Garage'] }, LISTS).value;
  assert.deepEqual(rem.areas, ['Kitchen']);
  assert.deepEqual(rem.roofIssues, []);
  assert.equal(rem.roofAge, '');
});

test('photo checks use the file bytes, not the name', () => {
  const pad = (b: number[]) => Buffer.from([...b, ...new Array(16).fill(0)]);
  assert.equal(sniffPhoto(pad([0xff, 0xd8, 0xff, 0xe0]))?.mime, 'image/jpeg');
  assert.equal(sniffPhoto(pad([0x89, 0x50, 0x4e, 0x47]))?.mime, 'image/png');
  assert.equal(sniffPhoto(Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP'), Buffer.alloc(8)]))?.mime, 'image/webp');
  assert.equal(sniffPhoto(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(8)]))?.mime, 'image/heic');
  assert.equal(sniffPhoto(Buffer.from('<?php echo 1; ?>          ')), null);
  assert.equal(safeName('../../etc/pass<wd>.jpg'), 'passwd.jpg');
});

test('references, honeypot, idempotency keys and CSV safety', () => {
  assert.equal(isHoneypot(''), false);
  assert.equal(isHoneypot('http://spam'), true);
  assert.equal(phoneOk('(713) 555-0142'), true);
  assert.equal(publicRef(1), 'DRR-1001');
  assert.equal(cleanIdemKey('3f2a9c1e-7b8d-4e5f-9a0b-1c2d3e4f5a6b'), '3f2a9c1e-7b8d-4e5f-9a0b-1c2d3e4f5a6b');
  assert.equal(cleanIdemKey('short'), null);
  assert.equal(csvSafe('=HYPERLINK()'), `"'=HYPERLINK()"`);
});

test('session helpers: cookie parsing and constant-time CSRF compare', () => {
  assert.deepEqual(parseCookies('dr_session=abc.def; dr_csrf=xyz%3D'), { dr_session: 'abc.def', dr_csrf: 'xyz=' });
  assert.equal(sameToken('abc', 'abc'), true);
  assert.equal(sameToken('abc', 'abd'), false);
});

test('project and content validation', () => {
  assert.equal(validateProject({ title: 'Roof' }).errors.category, 'Choose Roofing or Remodeling.');
  assert.equal(validateProject({ category: 'roofing', title: 'Roof', published: true }).errors.description, 'Add a description (at least 20 characters) before publishing.');
  assert.equal(validateProject({ category: 'roofing', title: 'Roof', published: false, beforeImage: '/uploads/a.jpg' }).errors.afterImage, 'Add both a before and an after photo, or neither.');
  assert.equal(validateProject({ category: 'roofing', title: 'Roof', published: false, image: '/uploads/a.jpg' }).errors.imageAlt, 'Describe the photo for screen-reader users.');
  const o = CONTENT_TYPE_MAP.get('form-option')!;
  assert.equal(validateContentFields(o, { list: 'colours', label: 'Red' }).errors.list, 'Choose a valid list.');
});

test('every seeded row passes its own validation and matches the design counts', () => {
  for (const p of PROJECTS_SEED) assert.deepEqual(validateProject(p).errors, {}, p.title);
  for (const [type, rows] of Object.entries(CONTENT_SEED)) {
    const def = CONTENT_TYPE_MAP.get(type)!;
    assert.ok(def, type);
    for (const r of rows) assert.deepEqual(validateContentFields(def, r.fields).errors, {}, `${type}: ${JSON.stringify(r.fields).slice(0, 40)}`);
  }
  const n = Object.fromEntries(Object.entries(CONTENT_SEED).map(([k, v]) => [k, v.length]));
  assert.deepEqual(n, { service: 8, step: 4, faq: 11, 'form-option': 28 });
  assert.equal(PROJECTS_SEED.length, 6);
  assert.equal(PROJECTS_SEED.filter((p) => p.featured).length, 4);
  assert.deepEqual([LISTS.property.length, LISTS.timeline.length, LISTS.budget.length, LISTS.roofIssue.length, LISTS.roofAge.length, LISTS.remodelArea.length], [4, 5, 5, 5, 4, 5]);
});

console.log(`\n${passed} checks passed`);
