// Σχήμα βάσης (κοινό για την εφαρμογή και το scripts/seed.mjs)
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT, phone TEXT, phone2 TEXT, email TEXT, afm TEXT,
  address TEXT, city TEXT, tags TEXT, notes TEXT,
  phone_norm TEXT, phone2_norm TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, type TEXT,
  address TEXT, city TEXT, lat REAL, lng REAL, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  installation_id INTEGER REFERENCES installations(id) ON DELETE SET NULL,
  name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  description TEXT, start_date TEXT, end_date TEXT, budget REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS crews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, color TEXT DEFAULT '#2f7ae5', notes TEXT
);

CREATE TABLE IF NOT EXISTS technicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, phone TEXT, email TEXT, specialty TEXT,
  color TEXT DEFAULT '#16a34a',
  crew_id INTEGER REFERENCES crews(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  installation_id INTEGER REFERENCES installations(id) ON DELETE SET NULL,
  title TEXT NOT NULL, description TEXT,
  interval_months INTEGER NOT NULL DEFAULT 12,
  next_date TEXT NOT NULL, visit_time TEXT DEFAULT '09:00',
  duration_min INTEGER DEFAULT 60,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  crew_id INTEGER REFERENCES crews(id) ON DELETE SET NULL,
  price REAL DEFAULT 0, annual_fee REAL DEFAULT 0,
  start_date TEXT, end_date TEXT,
  active INTEGER NOT NULL DEFAULT 1, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  installation_id INTEGER REFERENCES installations(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  quote_id INTEGER,
  title TEXT NOT NULL, description TEXT, type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  scheduled_at TEXT, duration_min INTEGER DEFAULT 60,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  crew_id INTEGER REFERENCES crews(id) ON DELETE SET NULL,
  work_notes TEXT, tech_notes TEXT,
  labor_price REAL DEFAULT 0,
  signature TEXT, signed_by TEXT, signed_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS jobs_sched ON jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS jobs_customer ON jobs(customer_id);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, brand TEXT, model TEXT, serial TEXT,
  installed_at TEXT, warranty_until TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, code TEXT, unit TEXT DEFAULT 'τεμ',
  unit_cost REAL DEFAULT 0, unit_price REAL DEFAULT 0,
  stock REAL DEFAULT 0, notes TEXT
);

CREATE TABLE IF NOT EXISTS job_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
  name TEXT NOT NULL, unit TEXT, qty REAL NOT NULL DEFAULT 1,
  unit_cost REAL DEFAULT 0, unit_price REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  installation_id INTEGER REFERENCES installations(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  filename TEXT NOT NULL, stored_name TEXT NOT NULL,
  mime TEXT, size INTEGER NOT NULL DEFAULT 0, caption TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  amount REAL NOT NULL, method TEXT DEFAULT 'μετρητά',
  date TEXT NOT NULL, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT, description TEXT NOT NULL, amount REAL NOT NULL,
  date TEXT NOT NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  installation_id INTEGER REFERENCES installations(id) ON DELETE SET NULL,
  title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
  issue_date TEXT, valid_until TEXT, vat_rate REAL DEFAULT 24,
  discount REAL DEFAULT 0, notes TEXT, terms TEXT,
  signature TEXT, signed_by TEXT, signed_at TEXT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL, qty REAL NOT NULL DEFAULT 1,
  unit TEXT, unit_price REAL NOT NULL DEFAULT 0, position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL, due_date TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  done INTEGER NOT NULL DEFAULT 0, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`;
