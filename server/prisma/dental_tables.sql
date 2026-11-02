-- Dental Care tables (safe to run many times; never drops or alters existing tables).
-- Run:  npx prisma db execute --file prisma/dental_tables.sql --schema prisma/schema.prisma

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS token_number TEXT;

CREATE TABLE IF NOT EXISTS tooth_records (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  patient_id     TEXT NOT NULL,
  tooth_no       INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'HEALTHY',
  surfaces       JSONB NOT NULL DEFAULT '[]',
  notes          TEXT,
  probing_depths JSONB,
  updated_by     TEXT,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP(3) NOT NULL,
  CONSTRAINT tooth_records_tenant_id_fkey  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT tooth_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS tooth_records_patient_id_tooth_no_key ON tooth_records(patient_id, tooth_no);
CREATE INDEX IF NOT EXISTS tooth_records_tenant_id_idx  ON tooth_records(tenant_id);
CREATE INDEX IF NOT EXISTS tooth_records_patient_id_idx ON tooth_records(patient_id);

CREATE TABLE IF NOT EXISTS treatment_plans (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'ACTIVE',
  invoice_id TEXT,
  created_by TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT treatment_plans_tenant_id_fkey  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT treatment_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS treatment_plans_tenant_id_idx  ON treatment_plans(tenant_id);
CREATE INDEX IF NOT EXISTS treatment_plans_patient_id_idx ON treatment_plans(patient_id);

CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id                 TEXT PRIMARY KEY,
  plan_id            TEXT NOT NULL,
  phase              TEXT NOT NULL DEFAULT 'Phase 1',
  code               TEXT,
  description        TEXT NOT NULL,
  tooth_no           TEXT,
  fee                DOUBLE PRECISION NOT NULL DEFAULT 0,
  insurance_coverage DOUBLE PRECISION NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'PLANNED',
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT treatment_plan_items_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS treatment_plan_items_plan_id_idx ON treatment_plan_items(plan_id);

CREATE TABLE IF NOT EXISTS xray_records (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  patient_id  TEXT NOT NULL,
  scan_type   TEXT NOT NULL,
  region      TEXT,
  tooth_no    TEXT,
  taken_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  radiologist TEXT,
  findings    TEXT,
  status      TEXT NOT NULL DEFAULT 'PENDING',
  created_by  TEXT,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP(3) NOT NULL,
  CONSTRAINT xray_records_tenant_id_fkey  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT xray_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS xray_records_tenant_id_idx  ON xray_records(tenant_id);
CREATE INDEX IF NOT EXISTS xray_records_patient_id_idx ON xray_records(patient_id);

CREATE TABLE IF NOT EXISTS lab_orders (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  order_no   TEXT NOT NULL,
  lab        TEXT NOT NULL,
  work_type  TEXT NOT NULL,
  material   TEXT,
  tooth_no   TEXT,
  shade      TEXT,
  due_date   TIMESTAMP(3),
  status     TEXT NOT NULL DEFAULT 'DRAFT',
  notes      TEXT,
  created_by TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT lab_orders_tenant_id_fkey  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT lab_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS lab_orders_tenant_id_order_no_key ON lab_orders(tenant_id, order_no);
CREATE INDEX IF NOT EXISTS lab_orders_tenant_id_idx  ON lab_orders(tenant_id);
CREATE INDEX IF NOT EXISTS lab_orders_patient_id_idx ON lab_orders(patient_id);
