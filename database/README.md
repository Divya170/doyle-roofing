# database/

The SQLite file `app.sqlite` is created here automatically the first time the API starts (path set by `DATABASE_PATH` in `backend/.env`). On first start the API also seeds:

- the admin account (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`),
- business settings (name, location label, About statement, switches),
- page content from the design: 8 services, 4 working-approach steps, 11 FAQs and 28 estimate-form options,
- 6 sample projects (marked "sample" — replace or delete them before launch).

`schema.sql` documents the tables for reference: `settings`, `content_blocks`, `projects`, `estimates`, `estimate_photos`, `status_events` and `admin_users`. TypeORM keeps the real schema in sync with the entities (`synchronize: true`); use migrations before a live database needs schema changes.

To start over, stop the API and delete `app.sqlite`.

Back up by copying `app.sqlite`, `backend/uploads/` (site photos) and `backend/private-uploads/` (customers' estimate photos) while the API is stopped. The private folder holds customers' files — keep it out of public storage and version control.
