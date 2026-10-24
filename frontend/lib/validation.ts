/**
 * Client mirror of the design's validate() and the backend's estimate-validation.ts.
 * The API re-validates everything (and checks options against the published lists).
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export type Errors = Record<string, string>;

export const EMPTY = { type: '', property: '', location: '', timeline: '', budget: '', desc: '', name: '', phone: '', email: '', roofIssues: [] as string[], roofAge: '', areas: [] as string[], website: '' };
export type EstimateForm = typeof EMPTY;
export type FieldKey = 'type' | 'property' | 'location' | 'timeline' | 'budget' | 'desc' | 'name' | 'phone' | 'email';

/** Design W_STEPS */
export const W_STEPS: { label: string; title: string; intro: string; fields: FieldKey[] }[] = [
  { label: 'Project', title: 'What kind of project is it?', intro: 'Choose one — you can add detail on the next steps.', fields: ['type'] },
  { label: 'Property & timing', title: 'Where, when and roughly how much?', intro: 'Tell us about the property and your plans.', fields: ['property', 'location', 'timeline', 'budget'] },
  { label: 'Details & photos', title: 'Describe the work.', intro: 'A few sentences is plenty. Photos are optional but helpful.', fields: ['desc'] },
  { label: 'Your details', title: 'How can we reach you?', intro: 'Used only to respond to this enquiry.', fields: ['name', 'phone', 'email'] },
  { label: 'Review & send', title: 'Review your request.', intro: 'Check everything looks right, then send.', fields: [] },
];
export const ORDER: FieldKey[] = ['type', 'property', 'location', 'timeline', 'budget', 'desc', 'name', 'phone', 'email'];
export const STEP_OF: Record<string, number> = { type: 0, property: 1, location: 1, timeline: 1, budget: 1, desc: 2, photos: 2, name: 3, phone: 3, email: 3 };
/** Element to focus for each field (design FOCUS map) */
export const FOCUS: Record<string, string> = { type: 'f-type-roofing', property: 'f-prop-0', location: 'f-location', timeline: 'f-time-0', budget: 'f-budget-0', desc: 'f-desc', photos: 'f-files', name: 'f-name', phone: 'f-phone', email: 'f-email' };

export function validate(f: EstimateForm): Errors {
  const e: Errors = {};
  if (!f.type) e.type = 'Choose Roofing or Remodeling.';
  if (!f.property) e.property = 'Select a property type.';
  if (!f.location.trim()) e.location = 'Enter the property address, or city and ZIP code.';
  if (!f.timeline) e.timeline = 'Choose a preferred timeline.';
  if (!f.budget) e.budget = 'Choose a budget range, or “Not sure yet”.';
  if (f.desc.trim().length < 20) e.desc = f.desc.trim() ? 'Add a little more detail — at least 20 characters.' : 'Describe the project in a sentence or two.';
  if (!f.name.trim()) e.name = 'Enter your full name.';
  const digits = f.phone.replace(/\D/g, '');
  if (!f.phone.trim()) e.phone = 'Enter a phone number so we can reach you.';
  else if (/[^\d\s()+.\-]/.test(f.phone) || digits.length < 10 || digits.length > 11) e.phone = 'Enter a valid phone number with area code, e.g. (713) 555-0142.';
  if (!f.email.trim()) e.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter an email address in the format name@example.com.';
  return e;
}

/** Photo rules (design OK_EXT / OK_TYPES / MAX_BYTES / MAX_FILES) — the server checks the bytes again. */
export const OK_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
export const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;

export const newIdemKey = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
};
