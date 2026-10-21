import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../src/config/prisma.js'
import { seedClinicCategories } from '../prisma/seedClinicCategories.js'
import { seedRoleTemplates } from '../prisma/seed-role-templates.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REG_FILE = path.join(__dirname, '../data/registrations.json')

export async function clearAllData() {
  console.log('========================================================')
  console.log('🚨 STARTING COMPLETE DATA RESET (STATIC & DYNAMIC) 🚨')
  console.log('========================================================\n')

  // 1. Reset local registrations.json registry
  console.log('1. Clearing static/file registrations in registrations.json...')
  const emptyRegistry = {
    pending: [],
    approved: [],
    rejected: []
  }
  fs.writeFileSync(REG_FILE, JSON.stringify(emptyRegistry, null, 2), 'utf-8')
  console.log('✅ registrations.json cleared to empty { pending: [], approved: [], rejected: [] }')

  // 2. Clear all transactional, operational and dynamic records from PostgreSQL
  console.log('\n2. Deleting dynamic transactional records from PostgreSQL in dependency order...')

  try {
    const deletedNotifications = await prisma.notification.deleteMany({})
    console.log(`   - Deleted ${deletedNotifications.count} notifications`)

    const deletedAudit = await prisma.auditLog.deleteMany({})
    console.log(`   - Deleted ${deletedAudit.count} audit logs`)

    const deletedStock = await prisma.stockMovement.deleteMany({})
    console.log(`   - Deleted ${deletedStock.count} stock movements`)

    const deletedInventory = await prisma.inventoryItem.deleteMany({})
    console.log(`   - Deleted ${deletedInventory.count} inventory items`)

    const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({})
    console.log(`   - Deleted ${deletedInvoiceItems.count} invoice items`)

    const deletedInvoices = await prisma.invoice.deleteMany({})
    console.log(`   - Deleted ${deletedInvoices.count} invoices`)

    const deletedPrescriptions = await prisma.prescription.deleteMany({})
    console.log(`   - Deleted ${deletedPrescriptions.count} prescriptions`)

    const deletedAppointments = await prisma.appointment.deleteMany({})
    console.log(`   - Deleted ${deletedAppointments.count} appointments`)

    const deletedPatients = await prisma.patient.deleteMany({})
    console.log(`   - Deleted ${deletedPatients.count} patients`)

    const deletedStaff = await prisma.staffProfile.deleteMany({})
    console.log(`   - Deleted ${deletedStaff.count} staff profiles`)

    const deletedTokens = await prisma.refreshToken.deleteMany({})
    console.log(`   - Deleted ${deletedTokens.count} refresh tokens`)

    const deletedUserRoles = await prisma.userRole.deleteMany({})
    console.log(`   - Deleted ${deletedUserRoles.count} user roles`)

    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`   - Deleted ${deletedUsers.count} users`)

    const deletedTenantModules = await prisma.tenantModule.deleteMany({})
    console.log(`   - Deleted ${deletedTenantModules.count} tenant modules`)

    const deletedRolePerms = await prisma.rolePermission.deleteMany({})
    console.log(`   - Deleted ${deletedRolePerms.count} role permissions`)

    const deletedRoles = await prisma.role.deleteMany({})
    console.log(`   - Deleted ${deletedRoles.count} custom roles`)

    const deletedDepartments = await prisma.department.deleteMany({})
    console.log(`   - Deleted ${deletedDepartments.count} departments`)

    const deletedTenants = await prisma.tenant.deleteMany({})
    console.log(`   - Deleted ${deletedTenants.count} tenants / clinics`)

    const deletedDemos = await prisma.demoRequest.deleteMany({})
    console.log(`   - Deleted ${deletedDemos.count} demo requests`)

    const deletedNewsletters = await prisma.newsletterSubscription.deleteMany({})
    console.log(`   - Deleted ${deletedNewsletters.count} newsletter subscriptions`)

    console.log('✅ All dynamic transactional data purged from database.')
  } catch (err) {
    console.error('❌ Error during transactional cleanup:', err.message)
    throw err
  }

  // 3. Reseed Baseline Security Modules and Actions
  console.log('\n3. Provisioning clean baseline dynamic modules and permissions...')
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

  const actionDefs = [
    { key: 'view', name: 'View / Read' },
    { key: 'create', name: 'Create' },
    { key: 'edit', name: 'Edit / Update' },
    { key: 'delete', name: 'Delete' },
    { key: 'export', name: 'Export Data' },
    { key: 'approve', name: 'Approve' },
  ]

  for (const m of moduleDefs) {
    await prisma.module.upsert({
      where: { key: m.key },
      update: { name: m.name, description: m.description },
      create: m
    })
  }

  for (const a of actionDefs) {
    await prisma.permissionAction.upsert({
      where: { key: a.key },
      update: { name: a.name },
      create: a
    })
  }

  const allModules = await prisma.module.findMany()
  const allActions = await prisma.permissionAction.findMany()

  for (const mod of allModules) {
    for (const act of allActions) {
      const key = `${mod.key}.${act.key}`
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: {
          moduleId: mod.id,
          actionId: act.id,
          key,
          description: `Grants permission to ${act.name.toLowerCase()} ${mod.name}`
        }
      })
    }
  }
  console.log(`✅ Provisioned ${allModules.length} system modules and ${allModules.length * allActions.length} granular permissions.`)

  // 4. Reseed Baseline Role Templates
  console.log('\n4. Seeding baseline global role templates...')
  await seedRoleTemplates()

  // 5. Clean & Re-seed canonical Clinic Categories (Cardiology, Dental Care, Physiotherapy)
  console.log('\n5. Seeding canonical baseline clinic categories & role templates...')
  await seedClinicCategories()

  console.log('\n========================================================')
  console.log('✨ FULL RESET COMPLETE: SYSTEM IS CLEAN & READY ✨')
  console.log('========================================================')
}

// Run if called directly
if (process.argv[1]?.endsWith('clearAllData.js')) {
  clearAllData()
    .catch((e) => {
      console.error('Fatal error resetting data:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
}
