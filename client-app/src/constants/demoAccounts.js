/**
 * Demo Presets aligned with server/src/constants/demoAccounts.js
 */

export const DEMO_PRESETS = [
  {
    role: 'SUPERADMIN',
    label: 'Super Admin',
    email: 'admin@zuna.com',
    password: 'password123',
    description: 'Global Multi-Tenant Platform Controller',
    badge: 'Platform Root',
  },
  {
    role: 'ADMIN',
    label: 'Clinic Admin',
    email: 'admin@aurahealth.org',
    password: 'password123',
    description: 'Dr. Evelyn Vance · Aura Health Memorial',
    badge: 'Clinic Admin',
  },
  {
    role: 'DOCTOR',
    label: 'Senior Doctor',
    email: 'doctor@clinic.io',
    password: 'password123',
    description: 'Dr. Sarah Al-Mansoor · Attending Physician',
    badge: 'Clinical MD',
  },
];

export default DEMO_PRESETS;
