// Syncs modules -> permissions -> clinic categories -> tenants.
// Replaces scripts/linkModules.js. Safe to run many times.
//
// Usage (from the server folder):   node scripts/syncCategoryModules.js
//
// What it does
//  1. Creates every module row (common + dental + cardio + physio) in `modules`
//  2. Creates permission rows (module x view/create/edit/delete/export/approve)
//  3. Links each category ONLY to its own modules (common + category specific)
//  4. Enables those modules for every ACTIVE tenant of that category (removes the wrong ones)
//  5. Gives the tenant's "Clinical Administrator" role all permissions of its modules
import { prisma } from '../src/config/prisma.js'
import { MODULE_METADATA } from '../src/services/rbacModule.service.js'

const COMMON = [
    'patients', 'appointments', 'prescriptions', 'billing', 'inventory',
    'reports', 'staff', 'roles', 'clinical_config', 'settings',
]

const CATEGORY_MODULES = {
    'Dental Care': ['dental_chart', 'treatment_plans', 'xray_records', 'lab_orders'],
    'Cardiology': ['ecg_records', 'echo_reports', 'cath_lab_scheduling', 'cardiac_risk_assessment', 'implant_registry'],
    'Physiotherapy': ['treatment_session_plans', 'exercise_program_tracker', 'progress_recovery_notes'],
}

const ACTIONS = [
    { key: 'view', name: 'View / Read' },
    { key: 'create', name: 'Create' },
    { key: 'edit', name: 'Edit / Update' },
    { key: 'delete', name: 'Delete' },
    { key: 'export', name: 'Export Data' },
    { key: 'approve', name: 'Approve' },
]

const allKeys = [...new Set([...COMMON, ...Object.values(CATEGORY_MODULES).flat()])]

// 1. modules
const moduleByKey = {}
for (const key of allKeys) {
    const name = MODULE_METADATA[key]?.name || key
    moduleByKey[key] = await prisma.module.upsert({ where: { key }, update: {}, create: { key, name } })
}
console.log(`Modules ready: ${allKeys.length}`)

// 2. permission actions + permissions
const actionByKey = {}
for (const a of ACTIONS) {
    actionByKey[a.key] = await prisma.permissionAction.upsert({ where: { key: a.key }, update: {}, create: a })
}
let newPerms = 0
for (const key of allKeys) {
    for (const a of ACTIONS) {
        const pkey = `${key}.${a.key}`
        const exists = await prisma.permission.findUnique({ where: { key: pkey } })
        if (!exists) {
            await prisma.permission.create({
                data: {
                    key: pkey,
                    moduleId: moduleByKey[key].id,
                    actionId: actionByKey[a.key].id,
                    description: `Grants permission to ${a.name.toLowerCase()} ${moduleByKey[key].name}`,
                },
            })
            newPerms++
        }
    }
}
console.log(`New permissions created: ${newPerms}`)

// 3 + 4 + 5. per category
const categories = await prisma.clinicCategory.findMany()
for (const cat of categories) {
    const specific = CATEGORY_MODULES[cat.name]
    if (!specific) { console.log(`Skipping category "${cat.name}" (no module mapping defined)`); continue }

    const wantedKeys = [...COMMON, ...specific]
    const wantedIds = wantedKeys.map((k) => moduleByKey[k].id)

    // category -> modules
    await prisma.clinicCategoryModule.deleteMany({ where: { clinicCategoryId: cat.id, moduleId: { notIn: wantedIds } } })
    await prisma.clinicCategoryModule.createMany({
        data: wantedKeys.map((k, i) => ({ clinicCategoryId: cat.id, moduleId: moduleByKey[k].id, displayOrder: MODULE_METADATA[k]?.defaultOrder ?? i })),
        skipDuplicates: true,
    })
    console.log(`Category "${cat.name}": ${wantedKeys.length} modules`)

    const perms = await prisma.permission.findMany({ where: { moduleId: { in: wantedIds } } })
    const tenants = await prisma.tenant.findMany({ where: { clinicCategoryId: cat.id, status: 'ACTIVE' } })

    for (const t of tenants) {
        // tenant -> modules
        await prisma.tenantModule.deleteMany({ where: { tenantId: t.id, moduleId: { notIn: wantedIds } } })
        await prisma.tenantModule.createMany({
            data: wantedIds.map((moduleId) => ({ tenantId: t.id, moduleId, isEnabled: true })),
            skipDuplicates: true,
        })
        await prisma.tenantModule.updateMany({ where: { tenantId: t.id, moduleId: { in: wantedIds } }, data: { isEnabled: true } })

        // admin role -> permissions
        const adminRole = await prisma.role.findFirst({ where: { tenantId: t.id, name: 'Clinical Administrator' } })
        if (adminRole) {
            await prisma.rolePermission.createMany({
                data: perms.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
                skipDuplicates: true,
            })
        }
        console.log(`  Tenant "${t.subdomain}": modules synced${adminRole ? ', admin role updated' : ' (no Clinical Administrator role found)'}`)
    }
}

await prisma.$disconnect()
console.log('Done. Ask users to log out and log in again.')
