# Doyle Roofing & Remodeling — website

Full-stack build of the `Doyle Website v2` design (the version with the 5-step estimate wizard), including the backend and CMS items from the design's Handoff notes.

| Part | Stack | Folder |
|---|---|---|
| Public site + admin | Next.js 14 (App Router, TypeScript, plain CSS) | `frontend/` |
| API, validation, business logic | NestJS 10, TypeORM, class-validator | `backend/` |
| Data | SQLite 3 (`database/app.sqlite`, created on first start) | `database/` |

`DATA-MODEL.md` maps the design to the data model. `design-source/` holds the original files.

## Run it locally

You need Node.js 18.18 or newer.

```bash
npm install            # installs `concurrently`
npm run install:all    # backend + frontend dependencies
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run dev            # API on :4000, site on :3000
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin — on first start an admin is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` (defaults `admin@doyleroofing.local` / `DoyleAdmin#2026`). **Change the password in Admin → Account before sharing the site.**
- Tests: `npm test`

Production: `npm run build`, then `npm start`. Set a long random `SESSION_SECRET`, `NODE_ENV=production` (cookies become Secure), and put both apps behind HTTPS on one domain (the frontend proxies `/api/*` to the API).

## What's built

**Public site** — Home, Roofing, Remodeling, Projects (category filters, gallery, project pop-up with a before/after slider), About & FAQs, Privacy, Get an Estimate, 404, loading and error states. All text, services, steps, FAQs, form options, photos and projects come from the API.

**Estimate wizard** (`/estimate`, `?type=roofing|remodeling` preselects)
- 5 steps: project type (with roofing issues and roof age, or remodeling areas) → property, location, timeline, budget → description and photos → your details → review and send. The step list on the left only unlocks steps you have reached.
- Per-step validation with an error summary linking to each field; the same rules and messages run again on the server.
- Photos: up to 5 JPG, PNG, WEBP or HEIC files, 10 MB each, with real upload progress, remove and retry. Files are checked by their contents and stored privately. Sending waits for uploads to finish; photos that failed are not sent.
- Sending uses an idempotency key, so a retry or double click cannot create two requests. Field errors from the server jump back to the right step. Failures keep the answers and offer "Retry sending".
- Success card with the reference (e.g. `DRR-1001`), a summary, "Start another request" and "Browse projects". When Settings → "Accept estimate requests online" is off, a "paused" card with phone and email is shown instead; "Allow photo uploads" hides the photo step.
- Spam protection: hidden honeypot field and a per-IP rate limit.

**Admin** (`/admin`, one login)
- **Estimates:** status tabs with counts, search, project-type filter, sort, paging and CSV export. The detail page shows every answer, the customer's photos (opened through the signed-in session only; HEIC files are offered as downloads), status changes with history, internal notes, email delivery state with retry, and delete (which also deletes the photo files).
- **Projects:** search and category/status filters, reorder, publish/hide, featured and sample flags, and an editor with a main photo, alt text and an optional genuine before/after pair.
- **Content & photos:** services, working-approach steps, FAQs, estimate form options and page photos — add, edit, hide, reorder, delete, upload.
- **Business & settings:** contact details, location label, About statement, privacy policy text and the switches for review markers, accepting estimates and photo uploads.
- **Account:** change password. A new-request badge shows in the menu.

**API** — see `backend/src/*/…controller.ts`. Public: `GET /api/site`, `GET /api/projects`, `GET /api/estimates/options`, `POST /api/estimates`, `POST /api/estimates/photos`. Everything under `/api/admin/*` needs the admin session cookie and a CSRF token on changes.

## Email alerts (optional)

Set `SMTP_HOST` and the related values in `backend/.env`. Each new request then emails the owner (`NOTIFY_TO`, or the business email in Settings) and sends the customer an acknowledgement. Email is sent after the request is saved; a failure is recorded on the request (with a retry button) and never loses it.

## Before launch

1. Change the admin password. Set `SESSION_SECRET`.
2. Turn off **Show review markers** in Settings and replace or delete the sample projects.
3. Add the privacy policy text in Settings (the page shows a placeholder until then).
4. Confirm the phone number, email and address with the client.
5. Set up SMTP so new requests are emailed.

## Missing / not implemented

**Needed from the client**
- Which roofing services and remodeling categories they actually offer (the current lists are candidates).
- Real project photos and descriptions, and any genuine before/after pairs. No photos were supplied; every image shows a labelled placeholder.
- Approval of the FAQ answers and the "working approach" steps (drafts).
- Budget ranges, service area, and whether commercial properties are accepted.
- A logo (a text wordmark is used) and any licence, insurance or warranty statements (none are shown).
- The privacy policy text and the production domain.
- Email (SMTP) settings for new-request alerts.

**Not built**
- No user roles or multiple admin accounts — one shared login.
- No scheduling or calendar, no customer portal, no CRM connection (requests can be exported as CSV).
- Uploaded project photos are not resized or cropped, and deleted ones stay on disk in `backend/uploads`.
- Rate limiting is in memory and resets when the API restarts.
- Tables are created and updated automatically (`synchronize: true`). Use migrations before a live database needs schema changes.
- No end-to-end tests, sitemap or `robots.txt`.

**Never run end to end here.** This was built where packages couldn't be installed. The code was type-checked against stand-in types for React and Next and the backend's 8 rule checks pass, but expect a few small fixes the first time you run `npm run install:all && npm run dev`.
