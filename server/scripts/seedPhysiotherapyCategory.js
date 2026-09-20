import { prisma } from '../src/config/prisma.js'

export const PHYSIO_MODULES = [
  {
    key: 'patients',
    name: 'Patients',
    description: 'Patient records, rehabilitation intake, mobility history and clinical demographics',
    displayOrder: 1,
  },
  {
    key: 'appointments',
    name: 'Appointments',
    description: 'Session scheduling, therapy room allocations and treatment calendar bookings',
    displayOrder: 2,
  },
  {
    key: 'treatment_session_plans',
    name: 'Treatment/Session Plans',
    description: 'Multi-session rehabilitation regimens, clinical milestones, therapy modalities and target recovery goals',
    displayOrder: 3,
  },
  {
    key: 'exercise_program_tracker',
    name: 'Exercise Program Tracker',
    description: 'Home & clinic exercise prescriptions, repetitions, resistance progression, and mobility tracking',
    displayOrder: 4,
  },
  {
    key: 'progress_recovery_notes',
    name: 'Progress/Recovery Notes',
    description: 'SOAP progress notes, range of motion (ROM) measurements, pain scale assessments and recovery milestones',
    displayOrder: 5,
  },
  {
    key: 'prescriptions',
    name: 'Prescriptions',
    description: 'Therapeutic medications, NSAIDs, muscle relaxants and post-therapy recovery aids',
    displayOrder: 6,
  },
  {
    key: 'billing',
    name: 'Billing/Invoices',
    description: 'Therapy session packages, modalities billing, insurance claims, and copay processing',
    displayOrder: 7,
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Therapy resistance bands, traction equipment, ultrasound gel, cold/heat packs and mobility aids',
    displayOrder: 8,
  },
  {
    key: 'reports',
    name: 'Reports',
    description: 'Patient recovery outcome metrics, clinic utilization, revenue cycles and therapist performance',
    displayOrder: 9,
  },
  {
    key: 'staff',
    name: 'Staff',
    description: 'Physiotherapists, rehab assistants, sports injury specialists and clinic administrators',
    displayOrder: 10,
  },
]

const STANDARD_ACTIONS = ['view', 'create', 'edit', 'delete']

export async function seedPhysiotherapyCategory() {
  console.log('--- Seeding Physiotherapy Category & 10 Modules ---')

  // 1. Ensure "Physiotherapy" category exists and is active
  let category = await prisma.clinicCategory.findUnique({
    where: { name: 'Physiotherapy' },
  })

  if (!category) {
    category = await prisma.clinicCategory.create({
      data: {
        name: 'Physiotherapy',
        description: 'Physical rehabilitation, musculoskeletal therapy, sports injury recovery and mobility care.',
        isActive: true,
      },
    })
    console.log('Created category: Physiotherapy')
  } else if (!category.isActive) {
    category = await prisma.clinicCategory.update({
      where: { id: category.id },
      data: { isActive: true },
    })
    console.log('Activated category: Physiotherapy')
  } else {
    console.log(`Found active category: Physiotherapy (ID: ${category.id})`)
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

  // 3. Upsert exactly the 10 Modules & their permissions
  const moduleMap = new Map()
  for (const modData of PHYSIO_MODULES) {
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

    // Ensure permissions exist for each module for view, create, edit, delete, export, approve
    for (const actKey of actionKeys) {
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

  // 4. Link ALL 10 modules to Physiotherapy in ClinicCategoryModule
  const physioModuleIds = PHYSIO_MODULES.map((m) => moduleMap.get(m.key).id)

  // Remove any modules not in these 10 for Physiotherapy
  await prisma.clinicCategoryModule.deleteMany({
    where: {
      clinicCategoryId: category.id,
      moduleId: { notIn: physioModuleIds },
    },
  })

  for (const modData of PHYSIO_MODULES) {
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
      console.log(`Linked ${mod.key} to Physiotherapy (order: ${modData.displayOrder})`)
    } else {
      await prisma.clinicCategoryModule.update({
        where: { id: existing.id },
        data: { displayOrder: modData.displayOrder },
      })
      console.log(`Updated ${mod.key} in Physiotherapy (order: ${modData.displayOrder})`)
    }
  }

  // 5. Seed ClinicCategoryRoleTemplate rows for Physiotherapy
  // Remove existing templates to guarantee an exact clean mapping
  await prisma.clinicCategoryRoleTemplate.deleteMany({
    where: { clinicCategoryId: category.id },
  })

  const templateRows = []

  // - "Clinic Administrator" role → full view+create+edit+delete on all 10 modules
  // Also add "Clinical Administrator" & "Clinic Admin" aliases to match system admin role names
  const adminRoleNames = ['Clinic Administrator', 'Clinical Administrator', 'Clinic Admin']
  for (const roleName of adminRoleNames) {
    for (const modData of PHYSIO_MODULES) {
      for (const actKey of STANDARD_ACTIONS) {
        templateRows.push({
          clinicCategoryId: category.id,
          roleName,
          module: modData.key,
          action: actKey,
        })
      }
    }
  }

  // - "Physiotherapist" role → patients, appointments, treatment_session_plans, exercise_program_tracker, progress_recovery_notes, prescriptions (view+create+edit)
  const physioModules = [
    'patients',
    'appointments',
    'treatment_session_plans',
    'exercise_program_tracker',
    'progress_recovery_notes',
    'prescriptions',
  ]
  for (const modKey of physioModules) {
    for (const actKey of ['view', 'create', 'edit']) {
      templateRows.push({
        clinicCategoryId: category.id,
        roleName: 'Physiotherapist',
        module: modKey,
        action: actKey,
      })
    }
  }

  // - "Physiotherapy Assistant" role → appointments, exercise_program_tracker, inventory (view+edit)
  const assistantModules = ['appointments', 'exercise_program_tracker', 'inventory']
  for (const modKey of assistantModules) {
    for (const actKey of ['view', 'edit']) {
      templateRows.push({
        clinicCategoryId: category.id,
        roleName: 'Physiotherapy Assistant',
        module: modKey,
        action: actKey,
      })
    }
  }

  // - "Billing Officer" role → billing, invoices, reports (view+create+edit)
  // Maps to billing (and invoices alias) + reports
  const billingModules = ['billing', 'invoices', 'reports']
  for (const modKey of billingModules) {
    for (const actKey of ['view', 'create', 'edit']) {
      templateRows.push({
        clinicCategoryId: category.id,
        roleName: 'Billing Officer',
        module: modKey,
        action: actKey,
      })
    }
  }

  // - "Front Desk" role → appointments, patients (create), billing (create)
  // appointments (view, create, edit), patients (create), billing (create)
  for (const actKey of ['view', 'create', 'edit']) {
    templateRows.push({
      clinicCategoryId: category.id,
      roleName: 'Front Desk',
      module: 'appointments',
      action: actKey,
    })
  }
  templateRows.push({
    clinicCategoryId: category.id,
    roleName: 'Front Desk',
    module: 'patients',
    action: 'create',
  })
  templateRows.push({
    clinicCategoryId: category.id,
    roleName: 'Front Desk',
    module: 'billing',
    action: 'create',
  })

  // Insert all templates
  await prisma.clinicCategoryRoleTemplate.createMany({
    data: templateRows,
    skipDuplicates: true,
  })
  console.log(`Seeded ${templateRows.length} ClinicCategoryRoleTemplate rows for Physiotherapy.`)

  console.log('--- Physiotherapy Seeding Complete ---')
}

// Run directly if invoked as main script
if (process.argv[1]?.endsWith('seedPhysiotherapyCategory.js')) {
  seedPhysiotherapyCategory()
    .then(() => {
      console.log('Seeding script completed successfully.')
      process.exit(0)
    })
    .catch((e) => {
      console.error('Error seeding physiotherapy:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
