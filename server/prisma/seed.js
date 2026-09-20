import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedRoleTemplates } from './seed-role-templates.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Clinical Management System database seed...')

  // 1. CLEAR EXISTING DATA IN REVERSE DEPENDENCY ORDER
  await prisma.auditLog.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.staffProfile.deleteMany()
  await prisma.department.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.permissionAction.deleteMany()
  await prisma.roleTemplate.deleteMany()
  await prisma.module.deleteMany()
  await prisma.role.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.publicSiteContent.deleteMany()

  // 2. SEED DEFAULT TENANT
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Aura Health Memorial',
      subdomain: 'aura-health',
      domain: 'aura.clinic.io',
      plan: 'Enterprise',
      status: 'ACTIVE',
      region: 'North America (East)',
      contactEmail: 'admin@aurahealth.org',
    },
  })
  console.log(`✅ Provisioned primary tenant: ${tenant.name} (${tenant.id})`)

  // 3. SEED DYNAMIC MODULES
  const moduleDefs = [
    { key: 'patients', name: 'Patients', description: 'Patient records, charts, demographics and medical history' },
    { key: 'appointments', name: 'Appointments', description: 'Clinical scheduling, calendar grids and bookings' },
    { key: 'prescriptions', name: 'Prescriptions & Notes', description: 'Clinical encounter notes and drug prescriptions' },
    { key: 'billing', name: 'Billing & Invoices', description: 'Financial ledger, insurance claims and patient invoices' },
    { key: 'inventory', name: 'Pharmacy & Stock', description: 'Medication supplies, medical consumables and reorder thresholds' },
    { key: 'staff', name: 'Staff Management', description: 'Clinical staff profiles, credentials and duty rosters' },
    { key: 'roles', name: 'Roles & Permissions', description: 'Granular security privileges and access matrix' },
    { key: 'reports', name: 'Analytics & Reports', description: 'Clinical performance, KPI trends and export tools' },
    { key: 'clinical_config', name: 'Clinical Config', description: 'Departments, specialties, operating slots and doctor hours' },
    { key: 'settings', name: 'Global Settings', description: 'Platform branding, tenant settings and feature toggles' },
  ]

  const modules = {}
  for (const m of moduleDefs) {
    modules[m.key] = await prisma.module.create({ data: m })
  }
  console.log(`✅ Seeded ${Object.keys(modules).length} dynamic modules`)

  // 4. SEED DYNAMIC PERMISSION ACTIONS
  const actionDefs = [
    { key: 'view', name: 'View / Read' },
    { key: 'create', name: 'Create' },
    { key: 'edit', name: 'Edit / Update' },
    { key: 'delete', name: 'Delete' },
    { key: 'export', name: 'Export Data' },
    { key: 'approve', name: 'Approve' },
  ]

  const actions = {}
  for (const a of actionDefs) {
    actions[a.key] = await prisma.permissionAction.create({ data: a })
  }
  console.log(`✅ Seeded ${Object.keys(actions).length} permission actions`)

  // 5. DYNAMIC CROSS-JOIN: GENERATE PERMISSIONS (module x action)
  const permissionsByKey = {}
  for (const mod of Object.values(modules)) {
    for (const act of Object.values(actions)) {
      const key = `${mod.key}.${act.key}`
      const perm = await prisma.permission.create({
        data: {
          moduleId: mod.id,
          actionId: act.id,
          key,
          description: `Grants permission to ${act.name.toLowerCase()} ${mod.name}`,
        },
      })
      permissionsByKey[key] = perm
    }
  }
  console.log(`✅ Dynamically generated ${Object.keys(permissionsByKey).length} permission keys`)

  // 6. SEED ROLES
  const roleAdmin = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Clinical Administrator',
      description: 'Complete clinic administrative and operational control',
      isSystemRole: true,
    },
  })

  const roleDoctor = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Senior Attending Physician',
      description: 'Direct care provider with diagnosis, prescription and appointment controls',
      isSystemRole: false,
    },
  })

  const roleReceptionist = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Front Desk & Receptionist',
      description: 'Patient check-in, registration, scheduling and initial intake billing',
      isSystemRole: false,
    },
  })

  const roleNurse = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Registered Clinical Nurse',
      description: 'Patient vitals recording, triage, medication administration and chart viewing',
      isSystemRole: false,
    },
  })

  const roleBiller = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Billing & Insurance Officer',
      description: 'Invoicing, claim adjudications, payment collections and financial reports',
      isSystemRole: false,
    },
  })

  // 7. ASSIGN PERMISSIONS TO ROLES
  const assignPermissionsToRole = async (roleId, keys) => {
    for (const key of keys) {
      const perm = permissionsByKey[key]
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId: perm.id },
        })
      }
    }
  }

  // Admin gets all permissions across all modules
  await assignPermissionsToRole(roleAdmin.id, Object.keys(permissionsByKey))

  // Doctor permissions
  await assignPermissionsToRole(roleDoctor.id, [
    'patients.view', 'patients.edit', 'patients.export',
    'appointments.view', 'appointments.create', 'appointments.edit',
    'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.export',
    'inventory.view',
    'reports.view',
  ])

  // Receptionist permissions
  await assignPermissionsToRole(roleReceptionist.id, [
    'patients.view', 'patients.create', 'patients.edit',
    'appointments.view', 'appointments.create', 'appointments.edit',
    'billing.view', 'billing.create',
  ])

  // Nurse permissions
  await assignPermissionsToRole(roleNurse.id, [
    'patients.view', 'patients.create', 'patients.edit',
    'appointments.view',
    'prescriptions.view',
    'inventory.view',
  ])

  // Biller permissions
  await assignPermissionsToRole(roleBiller.id, [
    'patients.view',
    'billing.view', 'billing.create', 'billing.edit', 'billing.export',
    'reports.view', 'reports.export',
  ])

  console.log('✅ Configured granular dynamic permission matrix per role')

  // 8. SEED USERS & CREDENTIALS (Bcrypt cost 12)
  const passwordSuperadmin = await bcrypt.hash('Cgs@001a', 12)
  const passwordAdmin = await bcrypt.hash('Admin@123', 12)
  const passwordDoctor = await bcrypt.hash('Doctor@123', 12)
  const passwordReception = await bcrypt.hash('Reception@123', 12)
  const passwordNurse = await bcrypt.hash('Nurse@123', 12)
  const passwordBiller = await bcrypt.hash('Biller@123', 12)

  // Superadmin (Global platform-level, no tenant restriction)
  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@clinic.io',
      passwordHash: passwordSuperadmin,
      fullName: 'Alexander Sterling',
      userType: 'SUPERADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
  })

  // Primary Superadmin (admin@zuna.com)
  await prisma.user.create({
    data: {
      email: 'admin@zuna.com',
      passwordHash: passwordSuperadmin,
      fullName: 'Super Administrator',
      userType: 'SUPERADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
  })

  // Clinic Admin
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@aurahealth.org',
      passwordHash: passwordAdmin,
      fullName: 'Dr. Evelyn Vance',
      userType: 'ADMIN',
      status: 'ACTIVE',
      twoFactorEnabled: true,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    },
  })
  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: roleAdmin.id } })

  // Doctor
  const doctorUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'doctor@clinic.io',
      passwordHash: passwordDoctor,
      fullName: 'Dr. Sarah Al-Mansoor',
      userType: 'STAFF',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
  })
  await prisma.userRole.create({ data: { userId: doctorUser.id, roleId: roleDoctor.id } })

  // Receptionist
  const receptionistUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'reception@clinic.io',
      passwordHash: passwordReception,
      fullName: 'Elena Rostova',
      userType: 'STAFF',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1594824813572-c24458514131?auto=format&fit=crop&q=80&w=300',
    },
  })
  await prisma.userRole.create({ data: { userId: receptionistUser.id, roleId: roleReceptionist.id } })

  // Nurse
  const nurseUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'nurse@clinic.io',
      passwordHash: passwordNurse,
      fullName: 'James C. Rodriguez',
      userType: 'STAFF',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    },
  })
  await prisma.userRole.create({ data: { userId: nurseUser.id, roleId: roleNurse.id } })

  // Biller
  const billerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'biller@clinic.io',
      passwordHash: passwordBiller,
      fullName: 'Amara Chen',
      userType: 'STAFF',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    },
  })
  await prisma.userRole.create({ data: { userId: billerUser.id, roleId: roleBiller.id } })

  console.log('✅ Seeded users with hashed credentials and assigned roles')

  // 9. SEED DEPARTMENTS & STAFF PROFILES
  const deptCardio = await prisma.department.create({ data: { tenantId: tenant.id, name: 'Cardiology' } })
  const deptDiag = await prisma.department.create({ data: { tenantId: tenant.id, name: 'Diagnostic Medicine' } })
  const deptER = await prisma.department.create({ data: { tenantId: tenant.id, name: 'Emergency & Critical Care' } })

  await prisma.staffProfile.create({
    data: {
      userId: doctorUser.id,
      departmentId: deptCardio.id,
      specialty: 'Interventional Cardiologist',
      licenseNo: 'MD-849201',
    },
  })

  await prisma.staffProfile.create({
    data: {
      userId: nurseUser.id,
      departmentId: deptER.id,
      specialty: 'Charge Nurse BSN, RN',
      licenseNo: 'RN-394012',
    },
  })

  // 10. SEED SAMPLE PATIENTS
  const pat1 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      mrn: 'MRN-84920',
      fullName: 'Eleanor Vance-Bishop',
      dob: new Date('1984-06-14'),
      gender: 'Female',
      bloodGroup: 'A+',
      phone: '+1 (555) 912-3401',
      email: 'eleanor.vb@gmail.com',
      address: '482 Maplecrest Blvd, Suite 4A',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Hypertension', 'Mild Asthma'],
      createdBy: adminUser.id,
    },
  })

  const pat2 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      mrn: 'MRN-84921',
      fullName: 'Liam Alexander Reyes',
      dob: new Date('1992-11-28'),
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+1 (555) 834-2900',
      email: 'liam.reyes@techmail.com',
      address: '109 Pine Ridge Terrace',
      allergies: ['No Known Drug Allergies (NKDA)'],
      chronicConditions: ['Type 2 Diabetes'],
      createdBy: adminUser.id,
    },
  })

  // 11. SEED APPOINTMENTS
  const apt1 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: pat1.id,
      departmentId: deptCardio.id,
      scheduledAt: new Date(Date.now() + 3600 * 1000 * 4), // 4 hrs from now
      durationMinutes: 30,
      status: 'SCHEDULED',
      type: 'In-Person Consultation',
      room: 'Exam Room 3B',
      reason: 'Quarterly cardiac stress test evaluation & blood pressure check',
    },
  })

  // 12. SEED PRESCRIPTIONS
  await prisma.prescription.create({
    data: {
      patientId: pat1.id,
      appointmentId: apt1.id,
      prescribedBy: doctorUser.fullName,
      diagnosis: 'Stage 1 Essential Hypertension (ICD-10 I10)',
      medications: [
        { drug: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily in the morning', duration: '90 days', refills: 3 },
        { drug: 'Hydrochlorothiazide', dosage: '12.5mg', frequency: 'Once daily with food', duration: '90 days', refills: 3 },
      ],
      notes: 'Advised daily low-sodium diet and twice-daily BP log. Return in 3 months.',
      status: 'Active',
    },
  })

  // 13. SEED INVOICES (in INR ₹)
  const inv1 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      patientId: pat1.id,
      appointmentId: apt1.id,
      invoiceNumber: 'INV-2026-0081',
      amount: 3500.00,
      insuranceCoverage: 2800.00,
      patientResponsibility: 700.00,
      status: 'PAID',
      paymentMethod: 'UPI / Net Banking',
    },
  })

  await prisma.invoiceItem.create({
    data: {
      invoiceId: inv1.id,
      description: 'Comprehensive Cardiology Specialist Consultation',
      code: 'CPT-99214',
      fee: 2500.00,
    },
  })

  await prisma.invoiceItem.create({
    data: {
      invoiceId: inv1.id,
      description: '12-Lead Electrocardiogram (ECG) with interpretation',
      code: 'CPT-93000',
      fee: 1000.00,
    },
  })

  // 14. SEED INVENTORY (PHARMACY STOCK)
  await prisma.inventoryItem.create({
    data: {
      tenantId: tenant.id,
      itemCode: 'MED-AMLO-5',
      name: 'Amlodipine Besylate 5mg Tablets',
      category: 'Cardiovascular',
      stockQuantity: 840,
      unit: 'Tablets',
      minReorderThreshold: 200,
      batchNumber: 'BCH-2026-042',
      expiryDate: new Date('2027-11-30'),
      unitCost: 15.00,
      sellingPrice: 70.00,
      status: 'Optimal',
    },
  })

  await prisma.inventoryItem.create({
    data: {
      tenantId: tenant.id,
      itemCode: 'MED-MET-1000',
      name: 'Metformin Extended-Release 1000mg',
      category: 'Endocrinology',
      stockQuantity: 140,
      unit: 'Tablets',
      minReorderThreshold: 250,
      batchNumber: 'BCH-2025-911',
      expiryDate: new Date('2027-04-15'),
      unitCost: 18.00,
      sellingPrice: 90.00,
      status: 'Low Stock',
    },
  })

  // 15. SEED PUBLIC SITE CONTENT CMS
  await prisma.publicSiteContent.create({
    data: {
      key: 'main_landing',
      content: {
        hero: {
          badge: 'Next-Gen Clinical Intelligence OS',
          title: 'Precision Healthcare Operations, Engineered for the Future',
          subtitle: 'Unify clinical scheduling, zero-trust granular permissions, smart EHR charts, and financial analytics in a single ultra-responsive platform.',
          primaryCta: 'Explore Live Platform',
          secondaryCta: 'Schedule Architecture Demo',
        },
        stats: {
          patientsManaged: '4.8M+',
          clinicsOnboarded: '1,420+',
          uptimePercent: '99.99%',
          satisfactionRate: '98.6%',
        },
        features: [
          {
            id: 'feat-1',
            icon: 'ShieldCheck',
            title: 'Dynamic Multi-Tenant RBAC',
            description: 'Customizable permission matrices per module and action with instant visual preview of effective staff entitlements.',
          },
          {
            id: 'feat-2',
            icon: 'CalendarClock',
            title: 'Intelligent Schedule Engine',
            description: 'Multi-provider timeline views, drag-to-reschedule conflicts protection, automated SMS reminders and telehealth rooms.',
          },
          {
            id: 'feat-3',
            icon: 'Activity',
            title: 'Clinical Vitals & Rx Pipeline',
            description: 'Prescription builder with drug interaction checks, structured clinical encounter notes and ICD-10 search.',
          },
          {
            id: 'feat-4',
            icon: 'DollarSign',
            title: 'Automated Billing & Claims',
            description: 'Instant insurance co-pay calculation, CPT-coded invoices, automated claims generation and digital payments in INR.',
          },
          {
            id: 'feat-5',
            icon: 'Boxes',
            title: 'Pharmacy & Stock Tracking',
            description: 'Batch expiry monitoring, automated low-stock reorder triggers, and real-time dispensing audit trails.',
          },
          {
            id: 'feat-6',
            icon: 'Cpu',
            title: 'Real-time System Observability',
            description: 'Superadmin tenant observability, cluster health metrics, Redis queue status, and exportable audit logs.',
          },
        ],
        pricingTiers: [
          {
            name: 'Starter Clinic',
            price: '₹24,999',
            period: '/month',
            description: 'Essential management for independent practices and single specialty clinics.',
            features: ['Up to 10 clinical staff', 'Patient charts & scheduling', 'Standard billing & invoicing', 'Email support'],
            highlighted: false,
          },
          {
            name: 'Professional Health Center',
            price: '₹59,999',
            period: '/month',
            description: 'Comprehensive solution for multi-provider clinics and growing health centers.',
            features: ['Up to 50 clinical staff', 'Dynamic RBAC permission matrix', 'Pharmacy & inventory tracking', 'Priority 24/7 SLA', 'Clinical analytics & reports'],
            highlighted: true,
          },
          {
            name: 'Enterprise Hospital Network',
            price: 'Custom',
            period: 'annual billing',
            description: 'Full white-label deployment for health networks with dedicated infrastructure.',
            features: ['Unlimited staff & locations', 'Dedicated tenant cluster & custom domain', 'FHIR / HL7 API integration', 'Custom audit export & SSO / SAML', 'Dedicated Solutions Engineer'],
            highlighted: false,
          },
        ],
        faqs: [
          {
            q: 'How does the dynamic permission matrix work?',
            a: 'Admins can construct custom roles by selecting granular actions (View, Create, Edit, Delete, Export, Approve) across all clinical modules. When a staff member is assigned multiple roles, the system computes their effective merged permission set in real time.',
          },
          {
            q: 'Is patient health information secure?',
            a: 'Engineered with HIPAA and GDPR compliance as first-class architectural requirements, featuring TLS 1.3 encryption in transit, AES-256 at rest, strict audit logging, and role-based zero-trust authorization.',
          },
          {
            q: 'Can we connect clinic with existing laboratory or pharmacy systems?',
            a: 'Yes. Standardized REST and FHIR APIs with webhook subscriptions for lab results, pharmacy dispensing orders, and billing clearinghouses are supported.',
          },
        ],
      },
    },
  })

  // 12. SEED ROLE TEMPLATES
  await seedRoleTemplates()

  console.log('✨ Seed process successfully completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
