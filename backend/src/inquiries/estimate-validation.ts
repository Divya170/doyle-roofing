/** Estimate rules — the design's validate() verbatim, plus server-side option checks. Pure, unit-tested. */
import { EMAIL_RE, line, phoneOk, tidy } from '../common/forms';

export const PROJECT_TYPES = ['roofing', 'remodeling'] as const;
export const MAX_PHOTOS = 5;

export interface OptionLists {
  property: string[];
  timeline: string[];
  budget: string[];
  roofIssue: string[];
  roofAge: string[];
  remodelArea: string[];
}

export type EstimateInput = Partial<
  Record<'type' | 'property' | 'location' | 'timeline' | 'budget' | 'desc' | 'name' | 'phone' | 'email' | 'roofIssues' | 'roofAge' | 'areas' | 'photos' | 'website', unknown>
>;

const pickMany = (v: unknown, allowed: string[]) => {
  const arr = Array.isArray(v) ? v.map((x) => line(x)) : [];
  return allowed.filter((a) => arr.includes(a));
};

/** Field → wizard step (0-based), so the form can jump to the first problem. */
export const STEP_OF: Record<string, number> = { type: 0, property: 1, location: 1, timeline: 1, budget: 1, desc: 2, photos: 2, name: 3, phone: 3, email: 3 };

export function validateEstimate(input: EstimateInput, lists: OptionLists) {
  const e: Record<string, string> = {};
  const type = (PROJECT_TYPES as readonly string[]).includes(tidy(input.type)) ? tidy(input.type) : '';
  const property = line(input.property);
  const location = line(input.location);
  const timeline = line(input.timeline);
  const budget = line(input.budget);
  const desc = tidy(input.desc, true);
  const name = line(input.name);
  const phone = tidy(input.phone);
  const email = tidy(input.email).toLowerCase();

  if (!type) e.type = 'Choose Roofing or Remodeling.';
  if (!property || !lists.property.includes(property)) e.property = 'Select a property type.';
  if (!location) e.location = 'Enter the property address, or city and ZIP code.';
  else if (location.length > 200) e.location = 'Keep the location under 200 characters.';
  if (!timeline || !lists.timeline.includes(timeline)) e.timeline = 'Choose a preferred timeline.';
  if (!budget || !lists.budget.includes(budget)) e.budget = 'Choose a budget range, or “Not sure yet”.';
  if (desc.length < 20) e.desc = desc ? 'Add a little more detail — at least 20 characters.' : 'Describe the project in a sentence or two.';
  else if (desc.length > 2000) e.desc = 'Keep the description under 2,000 characters.';
  if (!name) e.name = 'Enter your full name.';
  else if (name.length > 120) e.name = 'Use 120 characters or fewer.';
  if (!phone) e.phone = 'Enter a phone number so we can reach you.';
  else if (!phoneOk(phone) || phone.length > 30) e.phone = 'Enter a valid phone number with area code, e.g. (713) 555-0142.';
  if (!email) e.email = 'Enter your email address.';
  else if (email.length > 160 || !EMAIL_RE.test(email)) e.email = 'Enter an email address in the format name@example.com.';

  const photos = Array.isArray(input.photos) ? Array.from(new Set(input.photos.map((x) => tidy(x)).filter((x) => /^[a-f0-9]{32}$/.test(x)))) : [];
  if (photos.length > MAX_PHOTOS) e.photos = 'Only 5 photos can be attached.';

  const roofAge = line(input.roofAge);
  return {
    value: {
      type,
      property,
      location,
      timeline,
      budget,
      description: desc,
      name,
      phone,
      email,
      // Conditional prompts are kept only for the chosen project type (design: switching keeps other entries).
      roofIssues: type === 'roofing' ? pickMany(input.roofIssues, lists.roofIssue) : [],
      roofAge: type === 'roofing' && lists.roofAge.includes(roofAge) ? roofAge : '',
      areas: type === 'remodeling' ? pickMany(input.areas, lists.remodelArea) : [],
      photos,
    },
    errors: e,
  };
}

/** Magic-byte check for estimate photos: JPG, PNG, WEBP, HEIC/HEIF (design accept list). */
export function sniffPhoto(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: '.jpg' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: 'image/png', ext: '.png' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: '.webp' };
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand)) return { mime: 'image/heic', ext: '.heic' };
    if (['mif1', 'msf1', 'heif'].includes(brand)) return { mime: 'image/heif', ext: '.heif' };
  }
  return null;
}

/** Display-only file name: no path parts or control characters, max 120 chars. */
export const safeName = (n: string) =>
  String(n || 'photo')
    .replace(/^.*[\\/]/, '')
    .replace(/[\u0000-\u001F\u007F<>:"|?*]/g, '')
    .trim()
    .slice(0, 120) || 'photo';
