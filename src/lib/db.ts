import 'server-only'

import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const databasePath = resolve(process.env.NEXORA_DATABASE_PATH ?? '.data/nexora.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })

const globalDatabase = globalThis as typeof globalThis & {
  __nexoraDatabase?: InstanceType<typeof Database>
}

export const db = globalDatabase.__nexoraDatabase ?? new Database(databasePath)
globalDatabase.__nexoraDatabase = db

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT,
    google_subject TEXT UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS workspace_pin_attempts (
    ip_hash TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    manager TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'closed')),
    created_at TEXT NOT NULL,
    UNIQUE(organization_id, code)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
    unit_price REAL NOT NULL DEFAULT 0 CHECK(unit_price >= 0),
    updated_at TEXT NOT NULL,
    UNIQUE(organization_id, branch_id, sku)
  );
  CREATE INDEX IF NOT EXISTS inventory_org_branch_idx ON inventory(organization_id, branch_id);

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS customers_org_idx ON customers(organization_id, created_at);

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL DEFAULT '',
    product_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    total REAL NOT NULL CHECK(total >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sales_org_date_idx ON sales(organization_id, created_at);

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL DEFAULT '',
    line_items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    vat_rate REAL NOT NULL,
    vat_amount REAL NOT NULL,
    total REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    UNIQUE(organization_id, invoice_number)
  );
  CREATE INDEX IF NOT EXISTS invoices_org_date_idx ON invoices(organization_id, created_at);

  CREATE TABLE IF NOT EXISTS copilot_messages (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'ai')),
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)