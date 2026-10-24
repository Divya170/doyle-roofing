# Doyle Roofing & Remodeling — data model extracted from the design comp

Sources:

- `design-source/Doyle Website v2.dc.html` — the latest version, with the 5-step estimate wizard, built as the reference.
- `Handoff & QA.md` — the backend/CMS list, implemented.

`Doyle Website.dc.html` (v1) is the earlier single-form draft and is kept for reference only.

## Identity

- **Business:** Doyle Roofing & Remodeling.
  - Principal: Paxton Doyle.
  - Phone: +1 (410) 776-6528.
  - Email: paxton.doyle@yahoo.com.
  - Address: 1100 Congress St, Houston, TX 77002.
  - Logo: a text wordmark "DOYLE / Roofing & Remodeling" with an orange roof chevron.
- **Fonts:**
  - Manrope 500–800 for headings and interface text.
  - Source Serif 4 for body text.
  - Phosphor duotone icons.
- **Colours:**
  - Slate `#222D37` / `#34414D`; body text `#4A5560`; muted `#68737D`.
  - Off-white page `#F7F7F5`; light grey `#E7EAED`; soft orange `#F5E9DF`; sand `#EADBCD`.
  - Orange `#C87943` for rules and highlights only. Buttons use `#A95F2D` (hover `#8F4F25`) for 4.5:1 contrast.
  - Peach accent `#E9B48C` on dark backgrounds.
  - Error `#9E2F1E` on `#FBEDEA` (border `#E7B9AF`); success green `#2F6B3F`.
- **Shapes:** pills (999px), cards with 20–28px radius, 1320px max width.
- **Motion:**
  - Headings rise in; blocks reveal on scroll; hero images clip-reveal.
  - Hero roofing/remodeling cross-fade; marquee; spinning "Get an estimate" badge.
  - Tile hover zoom; process steps highlighted on scroll; About statement revealed word by word.
  - Scroll progress bar.
  - All of it is off under `prefers-reduced-motion`.
  - The build never hides content that is already in view.
- **Breakpoints:**
  - Desktop nav at ≥1000px; below that a full-screen menu (Esc closes it, focus is trapped).
  - Two-column splits at ≥860px.
  - Header CTA at ≥520px; sticky "Get an Estimate" bar below 640px, except on the estimate page.

## Routes

| Comp | App | Sections |
|---|---|---|
| `#/` | `/` | Hero ("Built to Protect. / Designed to Improve.", "I'm planning" toggle) · marquee · "Two crafts. One clear process." (roofing and remodeling tiles with service chips, plus 3 small cards) · Featured projects rail · "How it works" sticky process (4 steps) · final CTA with spinning badge |
| `#/roofing` | `/roofing` | Dark hero + wide photo · "What are you dealing with?" expanding panels (4 services) · materials & process (3 photos) · roofing projects · roofing FAQ · CTA |
| `#/remodeling` | `/remodeling` | Sand hero + 2 photos · "Which space are you planning?" tabs (4) · remodeling projects · remodeling FAQ · CTA |
| `#/projects?cat=` | `/projects?cat=roofing\|remodeling` | Bento gallery · filters (All/Roofing/Remodeling with counts) · empty state · lightbox (prev/next, arrow keys, Esc, focus trap) |
| `#/about` | `/about` | Statement (word reveal) · Business facts (6) · Working approach (same 4 steps) · General FAQ (5) · CTA |
| `#/estimate?type=` | `/estimate?type=roofing\|remodeling` | 5-step wizard + dark aside (stepper, phone/email) · success summary |
| other | 404 | — |

## Content (seeded verbatim)

- **Projects** (dedicated table: filtered and has uploads) — 6 sample entries:
  - Roofing: Roof replacement, Roof repair, Roofline and exterior detail.
  - Remodeling: Kitchen remodel, Bathroom renovation, Exterior update.
  - Each has the SAMPLE description and `sample = true` (shows the "Sample entry" badge). The first four are featured.
- **Services** (content `service`):
  - Roofing: Roof repair, Roof replacement, Roof inspection, Roof maintenance.
  - Remodeling: Kitchen remodeling, Bathroom renovation, Interior improvements, Exterior remodeling.
  - Each has its "need" text.
- **FAQ** (content `faq`): roofing 3, remodeling 3, general 5. Answers can use `{phone}`, `{email}` and `{address}`, which are filled from Settings.
- **Steps** (content `step`): Enquiry, Conversation, Assessment, Estimate.
- **Form options** (content `form-option`, list = …):

  | List | Values |
  |---|---|
  | property | Single-family home, Townhouse, Multi-family property, Other — each with an icon |
  | timeline | As soon as possible, Within 1 month, Within 1–3 months, Within 3–6 months, Flexible / still planning |
  | budget | Under $10,000, $10,000 – $25,000, $25,000 – $50,000, $50,000 +, Not sure yet / prefer to discuss |
  | roof-issue | Active leak, Storm or wind damage, Worn or ageing roof, Planning ahead, Not sure |
  | roof-age | Under 5 years, 5–15 years, More than 15 years, Not sure |
  | remodel-area | Kitchen, Bathroom, Interior living spaces, Exterior, Other |

- **Page photos** (content `site-image` slots):
  - Home: home-hero-roof, home-hero-remodel, roof-tile, rem-tile.
  - Roofing: roof-hero, roof-material-1/2/3.
  - Remodeling: rem-hero, rem-hero-2.
- **Settings:** business details, principal, location label "Houston, TX", About statement, privacy policy, and the flags below.

## Estimate (`POST /api/estimates`) — exact rules

| Field | Rule → message |
|---|---|
| type | roofing \| remodeling → "Choose Roofing or Remodeling." |
| property | from the property list → "Select a property type." |
| location | required → "Enter the property address, or city and ZIP code." |
| timeline | from the list → "Choose a preferred timeline." |
| budget | from the list → "Choose a budget range, or “Not sure yet”." |
| desc | ≥ 20 characters → "Describe the project in a sentence or two." (when empty) / "Add a little more detail — at least 20 characters."; max 2,000 |
| name | required → "Enter your full name." |
| phone | required → "Enter a phone number so we can reach you."; only digits, spaces and `()+.-`, with 10–11 digits → "Enter a valid phone number with area code, e.g. (713) 555-0142." |
| email | required → "Enter your email address."; format → "Enter an email address in the format name@example.com." |
| roofIssues / roofAge | optional; kept only when type = roofing |
| areas | optional; kept only when type = remodeling |
| photos | optional; up to 5 uploaded photo ids |
| website | honeypot |

### Wizard steps

| # | Step | Fields |
|---|---|---|
| 1 | Project | type |
| 2 | Property & timing | property, location, timeline, budget |
| 3 | Details & photos | desc (+ photos) |
| 4 | Your details | name, phone, email |
| 5 | Review & send | — |

### Form behaviour

- **Errors:** an error summary per step ("There is 1 thing to fix before continuing", with links to each field). Inline errors appear after blur.
- **Stepper:** locked until a step has been reached.
- **Review:** Edit buttons jump back to each group.
- **Failure:** the alert reads "Your request was not sent." and the button becomes "Retry sending".
- **Success:** "Thanks, {first} — your request is in." with Reference, a summary, **Start another request** and **Browse projects**.

### Photos

- JPG, PNG, WEBP or HEIC, up to 10 MB each and 5 photos.
- Each file shows progress, with remove and retry.
- The form waits for uploads to finish before sending.

## Flags (comp `data-props` → Settings)

| Prop | Default | Implementation |
|---|---|---|
| `showReviewFlags` | true | Setting: the dashed "Draft / Candidate / Sample entry" notes. |
| `galleryDataset` | Sample entries | Not reproduced. Real published projects drive the gallery; the empty state shows when none are published. |
| `submitOutcome` | Succeeds | Not reproduced. Real API errors drive the failure state. |

## Simulated in the comp → real here

- **Submit:** the 1.6 s mock request → the real API (stored with a status and history).
- **Photo upload:** simulated progress → a real upload with real progress. Files go to private storage and are checked by magic bytes.
- **Reference:** a random `DRR-xxxxx` → `DRR-1001…` from the database.
- **Before/after:** not built in the comp → shown only when a project has both a before image and an after image.
