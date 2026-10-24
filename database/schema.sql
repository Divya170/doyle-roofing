-- Doyle Roofing & Remodeling — SQLite schema (reference).
-- TypeORM creates and updates the real tables from the entities in backend/src (synchronize).
-- Column names below follow the entities; JSON lists are stored as TEXT.

-- Singleton (id = 1): business details, page copy, switches.
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  businessName VARCHAR NOT NULL DEFAULT 'Doyle Roofing & Remodeling',
  contactName VARCHAR NOT NULL DEFAULT '',
  phone VARCHAR, email VARCHAR, addressLine1 VARCHAR, addressLine2 VARCHAR,
  locationLabel VARCHAR NOT NULL DEFAULT '',
  statement TEXT NOT NULL DEFAULT '',
  privacyPolicy TEXT NOT NULL DEFAULT '',
  showReviewFlags BOOLEAN NOT NULL DEFAULT 1,
  estimatesOpen BOOLEAN NOT NULL DEFAULT 1,
  photoUploadsOpen BOOLEAN NOT NULL DEFAULT 1,
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Simple CMS collections: service, step, faq, form-option, site-image.
CREATE TABLE IF NOT EXISTS content_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type VARCHAR NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  fields TEXT NOT NULL,                       -- JSON, validated against content.schemas.ts
  published BOOLEAN NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_type_order ON content_blocks (type, sortOrder);

-- Project gallery. Only published rows are public.
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category VARCHAR NOT NULL,                  -- roofing | remodeling
  title VARCHAR NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image VARCHAR, imageAlt VARCHAR NOT NULL DEFAULT '',
  beforeImage VARCHAR, afterImage VARCHAR,    -- both or neither
  featured BOOLEAN NOT NULL DEFAULT 0,
  sample BOOLEAN NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_pub_order ON projects (published, sortOrder);

-- Estimate requests from the 5-step wizard.
CREATE TABLE IF NOT EXISTS estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_ref VARCHAR UNIQUE,                  -- DRR-1001
  project_type VARCHAR NOT NULL,              -- roofing | remodeling
  roof_issues TEXT NOT NULL,                  -- JSON list (roofing only)
  roof_age VARCHAR NOT NULL DEFAULT '',
  remodel_areas TEXT NOT NULL,                -- JSON list (remodeling only)
  property_type VARCHAR NOT NULL,
  location VARCHAR(200) NOT NULL,
  timeline VARCHAR NOT NULL,
  budget VARCHAR NOT NULL,
  description TEXT NOT NULL,
  name VARCHAR(120) NOT NULL, phone VARCHAR(30) NOT NULL, email VARCHAR(160) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'new',      -- new | contacted | assessment | estimate_sent | won | closed
  notes TEXT NOT NULL DEFAULT '',
  idempotency_key VARCHAR UNIQUE,
  notification_state VARCHAR NOT NULL DEFAULT 'disabled',    -- disabled | pending | sent | failed
  acknowledgement_state VARCHAR NOT NULL DEFAULT 'disabled',
  ip_hash VARCHAR NOT NULL DEFAULT '',        -- hashed, never the raw address
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates (status);
CREATE INDEX IF NOT EXISTS idx_estimates_created ON estimates (created_at);
CREATE INDEX IF NOT EXISTS idx_estimates_email ON estimates (email);

-- Customer photos: uploaded in step 3, stored privately (backend/private-uploads), linked when the request is sent.
-- Photos never linked to a request are deleted after 24 hours.
CREATE TABLE IF NOT EXISTS estimate_photos (
  id VARCHAR PRIMARY KEY,                     -- random, not guessable
  estimate_id INTEGER,
  original_name VARCHAR NOT NULL,             -- display only
  stored_name VARCHAR NOT NULL,
  mime VARCHAR NOT NULL,                      -- detected from the file's bytes
  size INTEGER NOT NULL,
  ip_hash VARCHAR NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_photos_estimate ON estimate_photos (estimate_id);

-- Status history of estimate requests.
CREATE TABLE IF NOT EXISTS status_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_type VARCHAR NOT NULL,               -- estimate
  record_id INTEGER NOT NULL,
  status VARCHAR NOT NULL,
  changed_by VARCHAR NOT NULL,                -- admin email, or "website" for the first event
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_status_record ON status_events (record_type, record_id);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  passwordHash VARCHAR NOT NULL,
  lastLoginAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
