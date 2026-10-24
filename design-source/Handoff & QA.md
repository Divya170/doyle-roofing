# Doyle Roofing & Remodeling — Prototype handoff

File: `Doyle Website.dc.html` — six hash-routed pages: `#/`, `#/roofing`, `#/remodeling`, `#/projects`, `#/about`, `#/estimate` (also `?type=roofing|remodeling` and `?cat=roofing|remodeling`).

## Design tokens
- Slate `#222D37` / `#34414D`, body `#4A5560`, muted `#68737D`, off-white `#F7F7F5`, light grey `#E7EAED`, soft orange `#F5E9DF`.
- Muted orange `#C87943` for rules and highlights only. Buttons use a deeper step, `#A95F2D` (hover `#8F4F25`), so white button text meets 4.5:1. `#C87943` with white text only reaches about 3.1:1.
- Error color: `#9E2F1E`. Errors also show an icon and text, so they never rely on color alone.
- Type: Manrope for headings and interface text, Source Serif 4 for body text (from the Broadsheet system).
- Layout follows Broadsheet: whitespace between sections, flush-left headings, and a thick/thin rule only as furniture. Broadsheet's tokens are remapped to the client palette.

## What is simulated (not connected)
- **Estimate submission:** a 1.6 s mock request. Nothing is sent or stored. The "Submit outcome" tweak forces a failure to test the error and retry states.
- **Photo attach:** progress is simulated and files never leave the browser. A file whose name contains "fail" fails once so you can test the retry.
- **Reference code:** randomly generated (`DRR-xxxxx`).
- **Gallery:** six "Sample entry" placeholders. The "Gallery dataset" tweak shows the empty state.
- **Before/after slider:** not built, because no genuine matching image pairs were supplied (per brief).
- **Images:** every photo is a labelled drop-in placeholder. Drop approved images to replace them.

## Client content still required
- Confirmation of which roofing services are offered (repair, replacement, inspection, maintenance are only candidates).
- Confirmation of which remodeling categories are offered (kitchen, bathroom, interior, exterior are only candidates).
- Approved project titles, descriptions and photographs, plus any genuine before/after image pairs.
- Approval of the FAQ answers and the "working approach" steps (both are drafts).
- Budget ranges, service area, and whether commercial properties are accepted.
- Logo (a text wordmark is used for now).
- Any licensing, insurance or warranty statements. None are shown; add them only once verified.

## Backend / CMS still to build
- **`POST /api/estimates`:**
  - Validate and sanitise on the server.
  - Store the lead with status and timestamps.
  - Add rate limiting and spam protection (honeypot or captcha).
  - Return clear success and error responses.
- **Uploads:**
  - Use signed upload URLs to private storage.
  - Check MIME type and magic bytes on the server, enforce a 10 MB / 5-file limit, and rename files safely.
  - Define a retention and deletion policy.
- **Project CMS:**
  - Create, edit, publish/unpublish, delete and reorder projects.
  - Fields: category, title, description, alt text, optional before/after pair.
  - Only published, approved items are public.
- **Admin lead management:**
  - Authenticated access with role-based permissions.
  - View, search and filter leads; status tracking; internal notes; view attachments.
- **Notifications:** email on a new lead, once a provider is configured.
- **CRM / scheduling:** optional later integrations. No fake controls are shown for them.

## QA status
Verified in the prototype:
- Routing, active navigation states, mobile menu (Esc closes it)
- Gallery filters and the empty state
- Lightbox: prev/next, arrow keys, Esc, focus trap, focus returns to the trigger
- FAQ accordions with `aria-expanded`
- Form validation: inline errors after blur, an error summary on submit, and links that jump to each field
- Conditional roofing/remodeling prompts, with other entries kept when switching
- File type, size and count limits; remove and retry
- Duplicate-submit guard; success and failure screens
- `prefers-reduced-motion` is respected

Not yet tested:
- Real devices and screen readers (VoiceOver, NVDA)
- Lighthouse performance score, which depends on real optimised images
- Anything server-side
