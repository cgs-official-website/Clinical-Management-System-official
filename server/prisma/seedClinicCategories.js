import { prisma } from '../src/config/prisma.js'

export const SEED_CATEGORIES = [
  {
    name: 'Cardiology',
    description: 'Specialized cardiovascular diagnostics, heart health, arrhythmia and vascular medicine.',
    isActive: true,
    templates: [
      // Clinic Administrator
      ...['patients', 'appointments', 'ecg_records', 'echo_reports', 'cath_lab_scheduling', 'cardiac_risk_assessment', 'implant_registry', 'prescriptions', 'billing', 'inventory', 'reports', 'staff'].flatMap(module => [
        { roleName: 'Clinic Administrator', module, action: 'view' },
        { roleName: 'Clinic Administrator', module, action: 'create' },
        { roleName: 'Clinic Administrator', module, action: 'edit' },
        { roleName: 'Clinic Administrator', module, action: 'delete' },
      ]),
      // Cardiologist
      ...['patients', 'appointments', 'ecg_records', 'echo_reports', 'cath_lab_scheduling', 'cardiac_risk_assessment', 'implant_registry', 'prescriptions', 'reports'].flatMap(module => [
        { roleName: 'Cardiologist', module, action: 'view' },
        { roleName: 'Cardiologist', module, action: 'create' },
        { roleName: 'Cardiologist', module, action: 'edit' },
      ]),
      // Cardiac Nurse
      ...['patients', 'appointments', 'ecg_records', 'inventory'].flatMap(module => [
        { roleName: 'Cardiac Nurse', module, action: 'view' },
        { roleName: 'Cardiac Nurse', module, action: 'edit' },
      ]),
      // Cath Lab Technician
      ...['cath_lab_scheduling', 'echo_reports', 'ecg_records', 'implant_registry'].flatMap(module => [
        { roleName: 'Cath Lab Technician', module, action: 'view' },
        { roleName: 'Cath Lab Technician', module, action: 'create' },
      ]),
      // Billing Officer
      ...['billing', 'invoices', 'reports'].flatMap(module => [
        { roleName: 'Billing Officer', module, action: 'view' },
        { roleName: 'Billing Officer', module, action: 'create' },
        { roleName: 'Billing Officer', module, action: 'edit' },
      ]),
      // Front Desk
      { roleName: 'Front Desk', module: 'appointments', action: 'view' },
      { roleName: 'Front Desk', module: 'appointments', action: 'create' },
      { roleName: 'Front Desk', module: 'appointments', action: 'edit' },
      { roleName: 'Front Desk', module: 'patients', action: 'create' },
      { roleName: 'Front Desk', module: 'billing', action: 'create' },
    ]
  },
  {
    name: 'Dental Care',
    description: 'Comprehensive oral healthcare, restorative dentistry, orthodontic and dental hygiene services.',
    isActive: true,
    templates: [
      // Dentist
      { roleName: 'Dentist', module: 'patients', action: 'view' },
      { roleName: 'Dentist', module: 'patients', action: 'create' },
      { roleName: 'Dentist', module: 'patients', action: 'edit' },
      { roleName: 'Dentist', module: 'appointments', action: 'view' },
      { roleName: 'Dentist', module: 'appointments', action: 'create' },
      { roleName: 'Dentist', module: 'appointments', action: 'edit' },
      { roleName: 'Dentist', module: 'prescriptions', action: 'view' },
      { roleName: 'Dentist', module: 'prescriptions', action: 'create' },
      { roleName: 'Dentist', module: 'prescriptions', action: 'edit' },
      { roleName: 'Dentist', module: 'inventory', action: 'view' },
      // Dental Hygienist
      { roleName: 'Dental Hygienist', module: 'patients', action: 'view' },
      { roleName: 'Dental Hygienist', module: 'appointments', action: 'view' },
      { roleName: 'Dental Hygienist', module: 'inventory', action: 'view' },
      { roleName: 'Dental Hygienist', module: 'prescriptions', action: 'view' },
      // Dental Receptionist
      { roleName: 'Dental Receptionist', module: 'patients', action: 'view' },
      { roleName: 'Dental Receptionist', module: 'patients', action: 'create' },
      { roleName: 'Dental Receptionist', module: 'appointments', action: 'view' },
      { roleName: 'Dental Receptionist', module: 'appointments', action: 'create' },
      { roleName: 'Dental Receptionist', module: 'appointments', action: 'edit' },
      { roleName: 'Dental Receptionist', module: 'billing', action: 'view' },
      { roleName: 'Dental Receptionist', module: 'billing', action: 'create' },
    ]
  },
  {
    name: 'Physiotherapy',
    description: 'Physical rehabilitation, musculoskeletal therapy, sports injury recovery and mobility care.',
    isActive: true,
    templates: [
      // Clinic Administrator
      ...['patients', 'appointments', 'treatment_session_plans', 'exercise_program_tracker', 'progress_recovery_notes', 'prescriptions', 'billing', 'inventory', 'reports', 'staff'].flatMap(module => [
        { roleName: 'Clinic Administrator', module, action: 'view' },
        { roleName: 'Clinic Administrator', module, action: 'create' },
        { roleName: 'Clinic Administrator', module, action: 'edit' },
        { roleName: 'Clinic Administrator', module, action: 'delete' },
      ]),
      // Physiotherapist
      ...['patients', 'appointments', 'treatment_session_plans', 'exercise_program_tracker', 'progress_recovery_notes', 'prescriptions'].flatMap(module => [
        { roleName: 'Physiotherapist', module, action: 'view' },
        { roleName: 'Physiotherapist', module, action: 'create' },
        { roleName: 'Physiotherapist', module, action: 'edit' },
      ]),
      // Physiotherapy Assistant
      ...['appointments', 'exercise_program_tracker', 'inventory'].flatMap(module => [
        { roleName: 'Physiotherapy Assistant', module, action: 'view' },
        { roleName: 'Physiotherapy Assistant', module, action: 'edit' },
      ]),
      // Billing Officer
      ...['billing', 'invoices', 'reports'].flatMap(module => [
        { roleName: 'Billing Officer', module, action: 'view' },
        { roleName: 'Billing Officer', module, action: 'create' },
        { roleName: 'Billing Officer', module, action: 'edit' },
      ]),
      // Front Desk
      { roleName: 'Front Desk', module: 'appointments', action: 'view' },
      { roleName: 'Front Desk', module: 'appointments', action: 'create' },
      { roleName: 'Front Desk', module: 'appointments', action: 'edit' },
      { roleName: 'Front Desk', module: 'patients', action: 'create' },
      { roleName: 'Front Desk', module: 'billing', action: 'create' },
    ]
  }
]

export async function seedClinicCategories() {
  console.log('Resetting and seeding strictly requested clinic categories: Cardiology, Dental Care, Physiotherapy...')

  // Deactivate all existing categories first
  await prisma.clinicCategory.updateMany({
    data: { isActive: false }
  })

  for (const cat of SEED_CATEGORIES) {
    let category = await prisma.clinicCategory.findUnique({
      where: { name: cat.name }
    })

    if (!category) {
      category = await prisma.clinicCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          isActive: true,
        }
      })
      console.log(`Created category: ${cat.name}`)
    } else {
      category = await prisma.clinicCategory.update({
        where: { id: category.id },
        data: {
          description: cat.description,
          isActive: true,
        }
      })
      console.log(`Updated category to active: ${cat.name}`)
    }

    // Seed templates for this category
    for (const tpl of cat.templates) {
      const existing = await prisma.clinicCategoryRoleTemplate.findFirst({
        where: {
          clinicCategoryId: category.id,
          roleName: tpl.roleName,
          module: tpl.module,
          action: tpl.action,
        }
      })
      if (!existing) {
        await prisma.clinicCategoryRoleTemplate.create({
          data: {
            clinicCategoryId: category.id,
            roleName: tpl.roleName,
            module: tpl.module,
            action: tpl.action,
          }
        })
      }
    }
  }

  // Remove or permanently delete old inactive categories that are not attached to any tenants
  const otherCategories = await prisma.clinicCategory.findMany({
    where: {
      name: { notIn: SEED_CATEGORIES.map(c => c.name) }
    },
    include: { tenants: true }
  })

  for (const oc of otherCategories) {
    if (oc.tenants.length === 0) {
      await prisma.clinicCategoryRoleTemplate.deleteMany({
        where: { clinicCategoryId: oc.id }
      })
      await prisma.clinicCategory.delete({
        where: { id: oc.id }
      })
      console.log(`Deleted unassigned old category: ${oc.name}`)
    } else {
      console.log(`Kept old category deactivated (assigned to existing tenants): ${oc.name}`)
    }
  }

  console.log('Finished seeding clinic categories. Only active categories:', SEED_CATEGORIES.map(c => c.name))
}

if (process.argv[1]?.endsWith('seedClinicCategories.js')) {
  seedClinicCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error seeding clinic categories:', err)
      process.exit(1)
    })
}
