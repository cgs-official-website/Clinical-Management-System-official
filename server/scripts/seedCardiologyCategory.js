import { prisma } from '../src/config/prisma.js'

export const CARDIOLOGY_MODULES = [
  {
    key: 'patients',
    name: 'Patients',
    description: 'Cardiac patient records, cardiovascular risk profiles, intake and medical history',
    displayOrder: 1,
  },
  {
    key: 'appointments',
    name: 'Appointments',
    description: 'Consultation scheduling, cardiology clinic slots, follow-ups and telemetry bookings',
    displayOrder: 2,
  },
  {
    key: 'ecg_records',
    name: 'ECG/EKG Records',
    description: '12-lead electrocardiogram waveforms, rhythm strips, QT/PR intervals, and ST segment analysis',
    displayOrder: 3,
  },
  {
    key: 'echo_reports',
    name: 'Echocardiography (Echo) Reports',
    description: 'Transthoracic & transesophageal echocardiograms, EF ejection fraction, and valvular Doppler studies',
    displayOrder: 4,
  },
  {
    key: 'cath_lab_scheduling',
    name: 'Cath Lab / Procedure Scheduling',
    description: 'Cardiac Catheterization Laboratory procedure bookings, coronary angiographies and angioplasty slots',
    displayOrder: 5,
  },
  {
    key: 'cardiac_risk_assessment',
    name: 'Cardiac Risk Assessment',
    description: 'ACC/AHA ASCVD 10-year risk estimator, Framingham score, lipid profiles and statin recommendations',
    displayOrder: 6,
  },
  {
    key: 'implant_registry',
    name: 'Implant Registry',
    description: 'Cardiac implant log: pacemakers, coronary drug-eluting stents, ICDs, CRT-Ds, serials and lead telemetry',
    displayOrder: 7,
  },
  {
    key: 'prescriptions',
    name: 'Prescriptions',
    description: 'Cardiovascular pharmacotherapy: antiplatelets, beta-blockers, ACE inhibitors, anticoagulants and statins',
    displayOrder: 8,
  },
  {
    key: 'billing',
    name: 'Billing/Invoices',
    description: 'Cardiology consultation fees, cath lab procedures, echo diagnostics, and insurance pre-authorizations',
    displayOrder: 9,
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Cath lab consumables, balloons, coronary stents, introducer sheaths, ECG electrodes, and emergency carts',
    displayOrder: 10,
  },
  {
    key: 'reports',
    name: 'Reports',
    description: 'Cardiac outcomes, cath lab turnaround metrics, complications registry, and clinic revenue analytics',
    displayOrder: 11,
  },
  {
    key: 'staff',
    name: 'Staff',
    description: 'Interventional cardiologists, cardiac electrophysiologists, cardiac nurses, cath lab techs and admin',
    displayOrder: 12,
  },
]

const STANDARD_ACTIONS = ['view', 'create', 'edit', 'delete']

export async function seedCardiologyCategory() {
  console.log('--- Seeding Cardiology Category & 12 Modules ---')

  // Warm up DB connection
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      break
    } catch (e) {
      console.log(`DB connection attempt ${attempt} waiting...`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // 1. Ensure "Cardiology" category exists and is active
  let category = await prisma.clinicCategory.findUnique({
    where: { name: 'Cardiology' },
  })

  if (!category) {
    category = await prisma.clinicCategory.create({
      data: {
        name: 'Cardiology',
        description: 'Specialized cardiovascular diagnostics, heart health, arrhythmia and vascular medicine.',
        isActive: true,
      },
    })
    console.log('Created category: Cardiology')
  } else if (!category.isActive) {
    category = await prisma.clinicCategory.update({
      where: { id: category.id },
      data: { isActive: true },
    })
    console.log('Activated category: Cardiology')
  } else {
    console.log(`Found active category: Cardiology (ID: ${category.id})`)
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

  // 3. Upsert Modules & their permissions
  // Note: Reuse existing shared rows (patients, appointments, implant_registry, prescriptions, billing, inventory, reports, staff)
  const moduleMap = new Map()
  for (const modData of CARDIOLOGY_MODULES) {
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
      console.log(`Using existing/shared Module: ${mod.key} (${mod.name})`)
    }
    moduleMap.set(modData.key, mod)

    // Ensure permissions exist for each module for standard actions
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

  // 4. Link ALL 12 modules to Cardiology in ClinicCategoryModule
  const cardioModuleIds = CARDIOLOGY_MODULES.map((m) => moduleMap.get(m.key).id)

  // Remove any modules previously linked that are not in these 12
  await prisma.clinicCategoryModule.deleteMany({
    where: {
      clinicCategoryId: category.id,
      moduleId: { notIn: cardioModuleIds },
    },
  })

  for (const modData of CARDIOLOGY_MODULES) {
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
      console.log(`Linked ${mod.key} to Cardiology (order: ${modData.displayOrder})`)
    } else {
      await prisma.clinicCategoryModule.update({
        where: { id: existing.id },
        data: { displayOrder: modData.displayOrder },
      })
      console.log(`Updated ${mod.key} in Cardiology (order: ${modData.displayOrder})`)
    }
  }

  // 5. Seed ClinicCategoryRoleTemplate rows for Cardiology
  // Remove existing templates to guarantee an exact clean mapping
  await prisma.clinicCategoryRoleTemplate.deleteMany({
    where: { clinicCategoryId: category.id },
  })

  const templateRows = []

  // - "Clinic Administrator" role → full view+create+edit+delete on all 12 modules
  const adminRoleNames = ['Clinic Administrator', 'Clinical Administrator', 'Clinic Admin']
  for (const roleName of adminRoleNames) {
    for (const modData of CARDIOLOGY_MODULES) {
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

  // - "Cardiologist" role → patients, appointments, ecg_records, echo_reports, cath_lab_scheduling, cardiac_risk_assessment, implant_registry, prescriptions, reports (view+create+edit)
  const cardiologistModules = [
    'patients',
    'appointments',
    'ecg_records',
    'echo_reports',
    'cath_lab_scheduling',
    'cardiac_risk_assessment',
    'implant_registry',
    'prescriptions',
    'reports',
  ]
  for (const modKey of cardiologistModules) {
    for (const actKey of ['view', 'create', 'edit']) {
      templateRows.push({
        clinicCategoryId: category.id,
        roleName: 'Cardiologist',
        module: modKey,
        action: actKey,
      })
    }
  }

  // - "Cardiac Nurse" role → patients, appointments, ecg_records, inventory (view+edit)
  const nurseModules = ['patients', 'appointments', 'ecg_records', 'inventory']
  for (const modKey of nurseModules) {
    for (const actKey of ['view', 'edit']) {
      templateRows.push({
        clinicCategoryId: category.id,
        roleName: 'Cardiac Nurse',
        module: modKey,
        action: actKey,
      })
    }
  }

  // - "Cath Lab Technician" role → cath_lab_scheduling, echo_reports, ecg_records, implant_registry (view+create)
  const cathTechModules = ['cath_lab_scheduling', 'echo_reports', 'ecg_records', 'implant_registry']
  for (const modKey of cathTechModules) {
    for (const actKey of ['view', 'create']) {
      templateRows.push({
        clinicCategoryId: category.id,
        roleName: 'Cath Lab Technician',
        module: modKey,
        action: actKey,
      })
    }
  }

  // - "Billing Officer" role → billing, invoices, reports (view+create+edit)
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

  // - "Front Desk" role → appointments (view+create+edit), patients (create), billing (create)
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
  console.log(`Seeded ${templateRows.length} ClinicCategoryRoleTemplate rows for Cardiology.`)

  console.log('--- Cardiology Seeding Complete ---')
}

// Run directly if invoked as main script
if (process.argv[1]?.endsWith('seedCardiologyCategory.js')) {
  seedCardiologyCategory()
    .then(() => {
      console.log('Cardiology seeding script completed successfully.')
      process.exit(0)
    })
    .catch((e) => {
      console.error('Error seeding cardiology:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
