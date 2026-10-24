/**
 * First-boot content, copied verbatim from the design comp (Doyle Website v2.dc.html).
 * Pure data — no framework imports — so the rules tests can load it.
 */

export const SETTINGS_SEED = {
  businessName: 'Doyle Roofing & Remodeling',
  contactName: 'Paxton Doyle',
  phone: '+1 (410) 776-6528',
  email: 'paxton.doyle@yahoo.com',
  addressLine1: '1100 Congress St',
  addressLine2: 'Houston, TX 77002',
  locationLabel: 'Houston, TX',
  statement:
    'Doyle Roofing & Remodeling works on roofing and home remodeling projects for homeowners and property owners — led by Paxton Doyle from 1100 Congress St, Houston.',
  privacyPolicy: '',
  showReviewFlags: true,
  estimatesOpen: true,
  photoUploadsOpen: true,
};

const SAMPLE =
  'Sample entry showing how an approved project will be presented: photographs, a short verified description and the project category. Replace with real client-approved content before launch.';

/** Design PROJECTS — placeholders, flagged sample = true. The first four appear in the home rail. */
export const PROJECTS_SEED = [
  { category: 'roofing', title: 'Roof replacement' },
  { category: 'remodeling', title: 'Kitchen remodel' },
  { category: 'roofing', title: 'Roof repair' },
  { category: 'remodeling', title: 'Bathroom renovation' },
  { category: 'roofing', title: 'Roofline and exterior detail' },
  { category: 'remodeling', title: 'Exterior update' },
].map((p, i) => ({ ...p, description: SAMPLE, featured: i < 4, sample: true, published: true }));

type Seed = { fields: Record<string, unknown>; published?: boolean }[];
const f = (fields: Record<string, unknown>) => ({ fields });
const opts = (list: string, labels: string[], icons: string[] = []) => labels.map((label, i) => f({ list, label, icon: icons[i] || '' }));

export const CONTENT_SEED: Record<string, Seed> = {
  service: [
    f({ category: 'roofing', name: 'Roof repair', need: 'For leaks, missing or damaged shingles and other problems that need attention before they spread.' }),
    f({ category: 'roofing', name: 'Roof replacement', need: 'For roofs that are worn, ageing or no longer worth repairing piece by piece.' }),
    f({ category: 'roofing', name: 'Roof inspection', need: 'For a clear picture of a roof’s condition — before buying, selling or planning other work.' }),
    f({ category: 'roofing', name: 'Roof maintenance', need: 'For keeping an existing roof in good working order over time.' }),
    f({ category: 'remodeling', name: 'Kitchen remodeling', need: 'Layout, storage, surfaces and fixtures — for kitchens that no longer work the way you need them to.' }),
    f({ category: 'remodeling', name: 'Bathroom renovation', need: 'From updated fixtures and finishes to a full reconfiguration of the room.' }),
    f({ category: 'remodeling', name: 'Interior improvements', need: 'Living spaces, flooring, walls and finishes reworked for comfort and everyday function.' }),
    f({ category: 'remodeling', name: 'Exterior remodeling', need: 'Updates to the outside of the home, below the roofline.' }),
  ],
  step: [
    f({ title: 'Enquiry', body: 'You share the details of your project through the form, by phone or by email.' }),
    f({ title: 'Conversation', body: 'Your request is reviewed and followed up to clarify scope, timing and priorities.' }),
    f({ title: 'Assessment', body: 'Where needed, the property is looked at in person to understand the work properly.' }),
    f({ title: 'Estimate', body: 'You receive an estimate to review before deciding how to proceed.' }),
  ],
  faq: [
    f({ group: 'roofing', q: 'How do I know whether my roof needs repair or replacement?', a: 'It depends on the roof’s age, condition and the extent of any damage, and usually needs someone to look at it in person. Describe what you are seeing in the estimate form — photos help — and the next step can be discussed from there.' }),
    f({ group: 'roofing', q: 'What information helps with a roofing estimate?', a: 'The property address, roughly how old the roof is (if you know), what you have noticed and when, and a few photos of any problem areas taken safely from the ground or from inside.' }),
    f({ group: 'roofing', q: 'Can I request an estimate if I am not sure what the problem is?', a: 'Yes. Choose “Not sure” where it applies and describe what you have noticed — a stain on a ceiling, a missing shingle, a recent storm.' }),
    f({ group: 'remodeling', q: 'What should I include in a remodeling enquiry?', a: 'Which rooms or areas you are thinking about, what is not working today, what you would like to change and any inspiration images you have collected.' }),
    f({ group: 'remodeling', q: 'Do I need finished plans before I get in touch?', a: 'No. Choose “Flexible / still planning” as your timeline and describe your ideas as they stand.' }),
    f({ group: 'remodeling', q: 'Can I send inspiration photos?', a: 'Yes — the estimate form accepts up to five photos, including inspiration images as well as photos of the current space.' }),
    f({ group: 'general', q: 'How do I request an estimate?', a: 'Use the Request an Estimate form, call {phone} or email {email}.' }),
    f({ group: 'general', q: 'What kinds of projects do you take on?', a: 'Doyle Roofing & Remodeling works on roofing and home remodeling projects. The specific services offered are being confirmed — describe your project and you will hear whether it is a fit.' }),
    f({ group: 'general', q: 'Do I need to know my budget?', a: 'No. Choose “Not sure yet / prefer to discuss.” Budget ranges only help prepare for the conversation; they are not a quote.' }),
    f({ group: 'general', q: 'Which areas do you serve?', a: 'The service area is still to be confirmed. The business is based at {address} — include your property location in the form.' }),
    f({ group: 'general', q: 'What happens after I send a request?', a: 'The details you share are reviewed and you will be contacted using the phone number or email you provide to discuss next steps.' }),
  ],
  'form-option': [
    ...opts('property', ['Single-family home', 'Townhouse', 'Multi-family property', 'Other'], ['house-line', 'buildings', 'building-apartment', 'dots-three-circle']),
    ...opts('timeline', ['As soon as possible', 'Within 1 month', 'Within 1–3 months', 'Within 3–6 months', 'Flexible / still planning']),
    ...opts('budget', ['Under $10,000', '$10,000 – $25,000', '$25,000 – $50,000', '$50,000 +', 'Not sure yet / prefer to discuss']),
    ...opts('roof-issue', ['Active leak', 'Storm or wind damage', 'Worn or ageing roof', 'Planning ahead', 'Not sure']),
    ...opts('roof-age', ['Under 5 years', '5–15 years', 'More than 15 years', 'Not sure']),
    ...opts('remodel-area', ['Kitchen', 'Bathroom', 'Interior living spaces', 'Exterior', 'Other']),
  ],
};
