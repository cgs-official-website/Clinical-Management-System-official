import { prisma } from '../src/config/prisma.js'

const DENTAL_MODULES = [
  {
    key: 'patients',
    name: 'Patients',
    description: 'Patient records, charts, demographics and dental medical history',
    displayOrder: 1,
  },
  {
    key: 'appointments',
    name: 'Appointments',
    description: 'Clinical scheduling, operatory calendar grids and patient chair bookings',
    displayOrder: 2,
  },
  {
    key: 'dental_chart',
    name: 'Dental Chart (Tooth Diagram)',
    description: 'Interactive adult & pediatric odontogram, surface restorations, periodontal charting, and tooth status',
    displayOrder: 3,
  },
  {
    key: 'treatment_plans',
    name: 'Treatment Plans',
    description: 'Multi-phased dental procedures, clinical fee estimates, procedure priorities, and patient consent',
    displayOrder: 4,
  },
  {
    key: 'xray_records',
    name: 'X-Ray Records',
    description: 'Digital panoramic, periapical, bitewing imaging, cephalometric scans, and radiographic analysis',
    displayOrder: 5,
  },
  {
    key: 'orthodontics',
    name: 'Orthodontics Tracker',
    description: 'Bracket alignments, clear aligner progression, cephalometric tracing, and wire sequencing',
    displayOrder: 6,
  },
  {
    key: 'implant_registry',
    name: 'Implant Registry',
    description: 'Fixture tracking, osseointegration stages, torque logging, and abutment components',
    displayOrder: 7,
  },
  {
    key: 'prescriptions',
    name: 'Prescriptions',
    description: 'Dental pharmaceuticals, analgesics, antibiotics, and post-op care guidance',
    displayOrder: 8,
  },
  {
    key: 'billing',
    name: 'Billing/Invoices',
    description: 'Dental ADA procedure codes, copay calculations, pre-authorizations, and patient billing',
    displayOrder: 9,
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Dental burs, composites, impressions, sterilization pouches, and surgical instruments',
    displayOrder: 10,
  },
  {
    key: 'lab_orders',
    name: 'Lab Work Orders',
    description: 'Crown & bridge fabrications, prosthodontic appliances, shade matching, and lab logistics',
    displayOrder: 11,
  },
  {
    key: 'reports',
    name: 'Reports',
    description: 'Clinical analytics, chair utilization, revenue cycles, and hygiene recall metrics',
    displayOrder: 12,
  },
  {
    key: 'staff',
    name: 'Staff',
    description: 'Dentists, dental hygienists, chairside assistants, and clinic admin rosters',
    displayOrder: 13,
  },
]

const STANDARD_ACTIONS = ['view', 'create', 'edit', 'delete']

async function seedDentalCare() {
  console.log('--- Seeding Dental Care Category & 13 Modules ---')

  // 1. Ensure "Dental Care" category exists and is active
  let category = await prisma.clinicCategory.findUnique({
    where: { name: 'Dental Care' },
  })

  if (!category) {
    category = await prisma.clinicCategory.create({
      data: {
        name: 'Dental Care',
        description: 'Comprehensive oral healthcare, restorative dentistry, orthodontic and dental hygiene services.',
        isActive: true,
      },
    })
    console.log('Created category: Dental Care')
  } else if (!category.isActive) {
    category = await prisma.clinicCategory.update({
      where: { id: category.id },
      data: { isActive: true },
    })
    console.log('Activated category: Dental Care')
  }

  // 2. Ensure standard PermissionActions exist
  const actionKeys = ['view', 'create', 'edit', 'delete', 'export', 'approve']
  const actionMap = new Map()
  for (const actKey of actionKeys) {
    let act = await prisma.permissionAction.findUnique({ where: { key: actKey } })
    if (!act) {
      act = await prisma.permissionAction.create({
        data: {
          key: actKey,
          name: actKey.charAt(0).toUpperCase() + actKey.slice(1),
        },
      })
    }
    actionMap.set(actKey, act)
  }

  // 3. Upsert exactly the 13 Modules & their permissions
  const moduleMap = new Map()
  for (const modData of DENTAL_MODULES) {
    let mod = await prisma.module.findUnique({ where: { key: modData.key } })
    if (!mod) {
      mod = await prisma.module.create({
        data: {
          key: modData.key,
          name: modData.name,
          description: modData.description,
        },
      })
      console.log(`Created Module: ${mod.key} (${mod.name})`)
    } else {
      mod = await prisma.module.update({
        where: { id: mod.id },
        data: {
          name: modData.name,
          description: modData.description,
        },
      })
      console.log(`Updated Module: ${mod.key} (${mod.name})`)
    }
    moduleMap.set(modData.key, mod)

    // Ensure permissions exist for each module for view, create, edit, delete
    for (const actKey of STANDARD_ACTIONS) {
      const act = actionMap.get(actKey)
      const permKey = `${mod.key}.${actKey}`
      let perm = await prisma.permission.findUnique({ where: { key: permKey } })
      if (!perm) {
        perm = await prisma.permission.create({
          data: {
            moduleId: mod.id,
            actionId: act.id,
            key: permKey,
            description: `Can ${actKey} ${mod.name}`,
          },
        })
        console.log(`Created Permission: ${permKey}`)
      }
    }
  }

  // 4. Link ALL 13 modules to Dental Care in ClinicCategoryModule
  for (const modData of DENTAL_MODULES) {
    const mod = moduleMap.get(modData.key)
    const existing = await prisma.clinicCategoryModule.findUnique({
      where: {
        clinicCategoryId_moduleId: {
          clinicCategoryId: category.id,
          moduleId: mod.id,
        },
      },
    })

    if (!existing) {
      await prisma.clinicCategoryModule.create({
        data: {
          clinicCategoryId: category.id,
          moduleId: mod.id,
          displayOrder: modData.displayOrder,
        },
      })
      console.log(`Linked ${mod.key} to Dental Care (order: ${modData.displayOrder})`)
    } else {
      await prisma.clinicCategoryModule.update({
        where: { id: existing.id },
        data: { displayOrder: modData.displayOrder },
      })
    }
  }

  // 5. Seed ClinicCategoryRoleTemplate rows for Clinic Admin / Clinical Administrator
  // "Also seed ClinicCategoryRoleTemplate rows so the Clinic Admin role gets full view+create+edit+delete on ALL 13 modules by default"
  const existingTemplates = await prisma.clinicCategoryRoleTemplate.findMany({
    where: { clinicCategoryId: category.id }
  })
  const existingKeySet = new Set(
    existingTemplates.map(t => `${t.roleName}|${t.module}|${t.action}`)
  )

  const adminRoleNames = ['Clinic Admin', 'Clinical Administrator']
  const newTemplates = []
  for (const roleName of adminRoleNames) {
    for (const modData of DENTAL_MODULES) {
      for (const actKey of STANDARD_ACTIONS) {
        const key = `${roleName}|${modData.key}|${actKey}`
        if (!existingKeySet.has(key)) {
          newTemplates.push({
            clinicCategoryId: category.id,
            roleName,
            module: modData.key,
            action: actKey,
          })
          existingKeySet.add(key)
        }
      }
    }
  }

  if (newTemplates.length > 0) {
    await prisma.clinicCategoryRoleTemplate.createMany({
      data: newTemplates,
      skipDuplicates: true
    })
    console.log(`Inserted ${newTemplates.length} ClinicCategoryRoleTemplate rows in batch.`)
  } else {
    console.log('All ClinicCategoryRoleTemplate rows already exist.')
  }

  console.log('--- Dental Care Seeding Complete ---')
}

seedDentalCare()
  .catch((e) => {
    console.error('Error seeding dental care:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
