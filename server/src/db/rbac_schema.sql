-- ==============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- PostgreSQL schema for Role, Module, and Permission tables
-- ==============================================================================

-- 1. Enable UUID generator extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ROLES TABLE (id, name)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MODULES TABLE (id, name, icon, route)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100) NOT NULL,
  route VARCHAR(255) NOT NULL UNIQUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PERMISSIONS TABLE (id, role_id, module_id, can_view, can_edit, can_delete)
-- Many-to-many link between roles and modules with granular flags
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_role_module UNIQUE (role_id, module_id)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module_id ON permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_can_view ON permissions(role_id, can_view);

-- ==============================================================================
-- SEED DATA (Standard Clinic Roles & System Modules)
-- ==============================================================================

-- Seed standard roles
INSERT INTO roles (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'Clinic Administrator with full operational management privileges'),
  ('22222222-2222-2222-2222-222222222222', 'Doctor', 'Senior Physician with clinical EHR and prescription privileges'),
  ('33333333-3333-3333-3333-333333333333', 'Receptionist', 'Front Desk Receptionist with patient intake and appointment privileges'),
  ('44444444-4444-4444-4444-444444444444', 'Nurse', 'Clinical Nurse with triage, vitals, and queue observation privileges'),
  ('55555555-5555-5555-5555-555555555555', 'Biller', 'Billing Specialist with financial claims and invoice privileges'),
  ('66666666-6666-6666-6666-666666666666', 'Pharmacist', 'Pharmacy & Stock Officer with medication dispensing privileges')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Seed system modules
INSERT INTO modules (id, name, icon, route, display_order) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Patients & EHR', 'Users', '/app/staff/patients', 10),
  ('a2222222-2222-2222-2222-222222222222', 'Appointments', 'Calendar', '/app/staff/appointments', 20),
  ('a3333333-3333-3333-3333-333333333333', 'Prescriptions & Notes', 'Pill', '/app/staff/prescriptions', 30),
  ('a4444444-4444-4444-4444-444444444444', 'Billing & Invoices', 'CreditCard', '/app/staff/billing', 40),
  ('a5555555-5555-5555-5555-555555555555', 'Pharmacy & Stock', 'Boxes', '/app/staff/inventory', 50),
  ('a6666666-6666-6666-6666-666666666666', 'Patient Flow (Rx Loop)', 'Sparkles', '/app/staff/flow', 60),
  ('a7777777-7777-7777-7777-777777777777', 'Clinical Analytics', 'BarChart3', '/app/staff/reports', 70),
  ('a8888888-8888-8888-8888-888888888888', 'Roles & Permissions', 'KeyRound', '/app/admin/roles', 80),
  ('a9999999-9999-9999-9999-999999999999', 'Staff Management', 'ShieldCheck', '/app/admin/staff', 90),
  ('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Clinical Config', 'Sliders', '/app/admin/clinical-config', 100)
ON CONFLICT (name) DO UPDATE SET 
  icon = EXCLUDED.icon, 
  route = EXCLUDED.route, 
  display_order = EXCLUDED.display_order;

-- Seed default matrix: Admin (full permissions on everything)
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete)
SELECT '11111111-1111-1111-1111-111111111111', id, true, true, true
FROM modules
ON CONFLICT (role_id, module_id) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;

-- Seed default matrix: Doctor
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete) VALUES
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', true, true, false), -- Patients
  ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', true, true, false), -- Appointments
  ('22222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', true, true, false), -- Prescriptions
  ('22222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', true, false, false), -- Inventory (view only)
  ('22222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', true, true, false), -- Flow
  ('22222222-2222-2222-2222-222222222222', 'a7777777-7777-7777-7777-777777777777', true, false, false) -- Reports
ON CONFLICT (role_id, module_id) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;

-- Seed default matrix: Receptionist
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete) VALUES
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', true, true, false), -- Patients
  ('33333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', true, true, false), -- Appointments
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', true, false, false), -- Prescriptions
  ('33333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', true, true, false), -- Billing
  ('33333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', true, false, false), -- Inventory
  ('33333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', true, true, false)  -- Flow
ON CONFLICT (role_id, module_id) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;

-- Seed default matrix: Nurse
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete) VALUES
  ('44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', true, true, false), -- Patients
  ('44444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', true, false, false), -- Appointments
  ('44444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', true, false, false), -- Prescriptions
  ('44444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', true, false, false), -- Inventory
  ('44444444-4444-4444-4444-444444444444', 'a6666666-6666-6666-6666-666666666666', true, true, false)  -- Flow
ON CONFLICT (role_id, module_id) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;

-- Seed default matrix: Biller
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete) VALUES
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', true, false, false), -- Patients
  ('55555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', true, false, false), -- Prescriptions
  ('55555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', true, true, false),  -- Billing
  ('55555555-5555-5555-5555-555555555555', 'a7777777-7777-7777-7777-777777777777', true, false, false)  -- Reports
ON CONFLICT (role_id, module_id) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;

-- Seed default matrix: Pharmacist
INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete) VALUES
  ('66666666-6666-6666-6666-666666666666', 'a1111111-1111-1111-1111-111111111111', true, false, false), -- Patients
  ('66666666-6666-6666-6666-666666666666', 'a3333333-3333-3333-3333-333333333333', true, true, false),  -- Prescriptions
  ('66666666-6666-6666-6666-666666666666', 'a5555555-5555-5555-5555-555555555555', true, true, true),   -- Inventory
  ('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', true, true, false)   -- Flow
ON CONFLICT (role_id, module_id) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;
