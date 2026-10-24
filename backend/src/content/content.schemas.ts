/**
 * Registry of the generic content types on the Doyle Roofing & Remodeling site. The backend
 * validates against these and serves them to the admin UI, which builds its
 * forms from them.
 */

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** characters (text) or items (list) */
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  /** only one published row per value of this field (page photos: one per slot) */
  uniqueBy?: string;
}

export const IMAGE_SLOTS = [
  { value: 'home-hero-roof', label: 'Home hero (Roofing mode) — residential exterior / roofline' },
  { value: 'home-hero-remodel', label: 'Home hero (Remodeling mode) — renovated interior' },
  { value: 'roof-tile', label: 'Home “01 — Roofing” tile — roofing photograph' },
  { value: 'rem-tile', label: 'Home “02 — Remodeling” tile — remodeling photograph' },
  { value: 'roof-hero', label: 'Roofing page hero — wide roofing photograph' },
  { value: 'roof-material-1', label: 'Roofing “Materials & process” — material close-up (large)' },
  { value: 'roof-material-2', label: 'Roofing “Materials & process” — process detail' },
  { value: 'roof-material-3', label: 'Roofing “Materials & process” — finished edge' },
  { value: 'rem-hero', label: 'Remodeling page hero — renovated interior (large)' },
  { value: 'rem-hero-2', label: 'Remodeling page hero — detail (small)' },
];

export const CATEGORIES = [
  { value: 'roofing', label: 'Roofing' },
  { value: 'remodeling', label: 'Remodeling' },
];

export const FAQ_GROUPS = [
  { value: 'roofing', label: 'Roofing page' },
  { value: 'remodeling', label: 'Remodeling page' },
  { value: 'general', label: 'About & FAQs page' },
];

/** Option lists used by the estimate wizard. The API only accepts published labels. */
export const OPTION_LISTS = [
  { value: 'property', label: 'Property type (step 2)' },
  { value: 'timeline', label: 'Preferred timeline (step 2)' },
  { value: 'budget', label: 'Estimated budget (step 2)' },
  { value: 'roof-issue', label: 'Roofing — what is prompting the project (step 1)' },
  { value: 'roof-age', label: 'Roofing — approximate roof age (step 1)' },
  { value: 'remodel-area', label: 'Remodeling — areas (step 1)' },
];

export const OPTION_ICONS = [
  { value: '', label: 'None' },
  { value: 'house-line', label: 'House' },
  { value: 'buildings', label: 'Townhouse / buildings' },
  { value: 'building-apartment', label: 'Apartment building' },
  { value: 'dots-three-circle', label: 'Other (dots)' },
];

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    type: 'service', label: 'Services', page: 'Home tiles, Roofing panels, Remodeling tabs', titleField: 'name',
    description: 'Roofing services (expanding panels) and remodeling categories (tabs). Also shown as chips on the home tiles.',
    fields: [
      { key: 'category', label: 'Category', kind: 'select', required: true, options: CATEGORIES },
      { key: 'name', label: 'Name', kind: 'text', required: true, max: 60 },
      { key: 'need', label: 'Who it is for', kind: 'textarea', required: true, max: 300 },
      { key: 'image', label: 'Photo', kind: 'image' },
      { key: 'alt', label: 'Photo alt text', kind: 'text', max: 200 },
    ],
  },
  {
    type: 'step', label: 'Working approach', page: 'Home “How it works”, About', titleField: 'title',
    description: 'The steps from first message to estimate.',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, max: 60 },
      { key: 'body', label: 'Text', kind: 'textarea', required: true, max: 300 },
    ],
  },
  {
    type: 'faq', label: 'FAQs', page: 'Roofing, Remodeling, About', titleField: 'q',
    description: 'Questions and answers. Use {phone}, {email} or {address} in an answer to insert the current business details.',
    fields: [
      { key: 'group', label: 'Shown on', kind: 'select', required: true, options: FAQ_GROUPS },
      { key: 'q', label: 'Question', kind: 'text', required: true, max: 160 },
      { key: 'a', label: 'Answer', kind: 'textarea', required: true, max: 1200 },
    ],
  },
  {
    type: 'form-option', label: 'Estimate form options', page: 'Request an estimate', titleField: 'label',
    description: 'Choices offered in the estimate wizard. Unpublishing an option removes it from the form; existing requests keep their answer.',
    fields: [
      { key: 'list', label: 'List', kind: 'select', required: true, options: OPTION_LISTS },
      { key: 'label', label: 'Label', kind: 'text', required: true, max: 60 },
      { key: 'icon', label: 'Icon (property types only)', kind: 'select', options: OPTION_ICONS },
    ],
  },
  {
    type: 'site-image', label: 'Page photos', page: 'Home, Roofing, Remodeling', titleField: 'slot', uniqueBy: 'slot',
    description: 'Approved photographs that replace the labelled placeholders. One published photo per slot.',
    fields: [
      { key: 'slot', label: 'Slot', kind: 'select', required: true, options: IMAGE_SLOTS },
      { key: 'image', label: 'Photo', kind: 'image', required: true },
      { key: 'alt', label: 'Alt text (describe the photo)', kind: 'text', required: true, max: 200 },
    ],
  },
];

export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map((t) => [t.type, t]));
