/**
 * Default offline keyword-to-permission role template definitions.
 * Deterministic rules derived from clinical personas:
 * - "doctor" / "physician" / "attending" -> patients.view, patients.create, appointments.view, prescriptions.view, prescriptions.create
 * - "nurse" -> patients.view, patients.create, appointments.view, appointments.create, appointments.edit, inventory.view, inventory.edit
 * - "receptionist" / "front desk" -> appointments.view, appointments.create, appointments.edit, patients.create, billing.create
 * - "billing" / "insurance" -> billing.view, billing.create, billing.edit, invoices.view, reports.view
 * - "admin" / "administrator" -> wildcard "*" on all modules (view+create+edit+delete)
 * - "senior" / "head" / "chief" (modifier) -> adds .edit on top of base role's matched modules
 */

export const ALL_SYSTEM_MODULES = [
  'patients',
  'appointments',
  'prescriptions',
  'billing',
  'inventory',
  'reports',
  'staff',
  'clinical_config',
  'roles'
]

export const ALL_ACTIONS = ['view', 'create', 'edit', 'delete']

export const MODIFIER_KEYWORDS = ['senior', 'head', 'chief']

export const DEFAULT_ROLE_TEMPLATES = [
  // 1. Doctor / Physician / Attending
  ...['doctor', 'physician', 'attending'].flatMap(keyword => [
    { keyword, module: 'patients', action: 'view', isWildcard: false },
    { keyword, module: 'patients', action: 'create', isWildcard: false },
    { keyword, module: 'appointments', action: 'view', isWildcard: false },
    { keyword, module: 'prescriptions', action: 'view', isWildcard: false },
    { keyword, module: 'prescriptions', action: 'create', isWildcard: false }
  ]),

  // 2. Nurse
  ...['nurse'].flatMap(keyword => [
    { keyword, module: 'patients', action: 'view', isWildcard: false },
    { keyword, module: 'patients', action: 'create', isWildcard: false },
    { keyword, module: 'appointments', action: 'view', isWildcard: false },
    { keyword, module: 'appointments', action: 'create', isWildcard: false },
    { keyword, module: 'appointments', action: 'edit', isWildcard: false },
    { keyword, module: 'inventory', action: 'view', isWildcard: false },
    { keyword, module: 'inventory', action: 'edit', isWildcard: false }
  ]),

  // 3. Receptionist / Front Desk
  ...['receptionist', 'front desk'].flatMap(keyword => [
    { keyword, module: 'appointments', action: 'view', isWildcard: false },
    { keyword, module: 'appointments', action: 'create', isWildcard: false },
    { keyword, module: 'appointments', action: 'edit', isWildcard: false },
    { keyword, module: 'patients', action: 'create', isWildcard: false },
    { keyword, module: 'billing', action: 'create', isWildcard: false }
  ]),

  // 4. Billing / Insurance
  ...['billing', 'insurance'].flatMap(keyword => [
    { keyword, module: 'billing', action: 'view', isWildcard: false },
    { keyword, module: 'billing', action: 'create', isWildcard: false },
    { keyword, module: 'billing', action: 'edit', isWildcard: false },
    { keyword, module: 'invoices', action: 'view', isWildcard: false },
    { keyword, module: 'reports', action: 'view', isWildcard: false }
  ]),

  // 5. Admin / Administrator (Wildcard on all modules)
  ...['admin', 'administrator'].map(keyword => ({
    keyword,
    module: '*',
    action: '*',
    isWildcard: true
  })),

  // 6. Senior / Head / Chief (Modifier: add .edit on top of base matched modules)
  ...MODIFIER_KEYWORDS.map(keyword => ({
    keyword,
    module: '*',
    action: 'edit',
    isWildcard: true
  }))
]
