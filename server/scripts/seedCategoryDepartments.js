import { prisma } from '../src/config/prisma.js'

export const CATEGORY_DEPARTMENTS = {
  Cardiology: [
    'Cardiology',
    'Cardiac Surgery',
  ],
  'Dental Care': [
    'General Dentistry',
    'Orthodontics',
    'Oral Surgery',
    'Periodontics',
    'Pediatric Dentistry',
  ],
  Physiotherapy: [
    'Physiotherapy',
    'Orthopedic Rehabilitation',
    'Sports Physical Therapy',
    'Neurological Rehabilitation',
  ],
}

// Category role mappings (which roles are relevant to which category)
export const CATEGORY_ROLES = {
  Cardiology: [
    'Clinical Administrator',
    'Clinic Administrator',
    'Senior Attending Physician',
    'Cardiologist',
    'Interventional Cardiologist',
    'Registered Clinical Nurse',
    'Cardiac Nurse',
    'Cath Lab Technician',
    'Front Desk & Receptionist',
    'Front Desk',
    'Billing & Insurance Officer',
    'Billing Officer',
  ],
  'Dental Care': [
    'Clinical Administrator',
    'Clinic Administrator',
    'Dentist',
    'Dental Hygienist',
    'Dental Receptionist',
    'Billing Officer',
    'Billing & Insurance Officer',
  ],
  Physiotherapy: [
    'Clinical Administrator',
    'Clinic Administrator',
    'Physiotherapist',
    'Physiotherapy Assistant',
    'Billing Officer',
    'Billing & Insurance Officer',
    'Front Desk',
    'Front Desk & Receptionist',
  ],
}

export async function seedCategoryDepartments() {
  console.log('--- Seeding Clinic Category Departments ---')

  // Ensure table exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS clinic_category_departments (
      id TEXT PRIMARY KEY,
      clinic_category_id TEXT NOT NULL REFERENCES clinic_categories(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(clinic_category_id, name)
    );
  `)

  for (const [catName, depts] of Object.entries(CATEGORY_DEPARTMENTS)) {
    const category = await prisma.clinicCategory.findUnique({
      where: { name: catName },
    })

    if (!category) {
      console.warn(`Category "${catName}" not found. Skipping departments seed.`)
      continue
    }

    for (const deptName of depts) {
      const id = `catdept-${category.id.slice(0, 8)}-${deptName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO clinic_category_departments (id, clinic_category_id, name, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (clinic_category_id, name) DO NOTHING`,
        id,
        category.id,
        deptName
      )
    }
    console.log(`Seeded ${depts.length} departments for ${catName}`)
  }

  // Also ensure existing tenants with category have their tenant departments in sync
  const tenants = await prisma.tenant.findMany({
    include: { clinicCategory: true },
  })

  for (const t of tenants) {
    if (!t.clinicCategory) continue
    const allowedDepts = CATEGORY_DEPARTMENTS[t.clinicCategory.name] || []
    for (const deptName of allowedDepts) {
      const existing = await prisma.department.findFirst({
        where: { tenantId: t.id, name: deptName },
      })
      if (!existing) {
        await prisma.department.create({
          data: { tenantId: t.id, name: deptName },
        })
      }
    }
  }

  console.log('Category departments seed completed successfully.')
}

// Run standalone if executed directly
if (process.argv[1]?.endsWith('seedCategoryDepartments.js')) {
  seedCategoryDepartments()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
