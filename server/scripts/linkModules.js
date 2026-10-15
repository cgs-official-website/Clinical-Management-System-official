// Links modules to clinic categories and enables them for tenants.
//
// Usage (from the server folder):
//   node scripts/linkModules.js                      -> link ALL modules to ALL categories, then
//                                                       enable modules for every ACTIVE tenant that has a category
//   node scripts/linkModules.js kmch Cardiology      -> also set tenant "kmch" category to "Cardiology" first
import { prisma } from '../src/config/prisma.js'

const [subdomainArg, categoryArg] = process.argv.slice(2)

const modules = await prisma.module.findMany()
const categories = await prisma.clinicCategory.findMany()
console.log(`Found ${modules.length} modules, ${categories.length} categories`)

// 1. category -> modules
for (const cat of categories) {
    const res = await prisma.clinicCategoryModule.createMany({
        data: modules.map((m, i) => ({ clinicCategoryId: cat.id, moduleId: m.id, displayOrder: i })),
        skipDuplicates: true,
    })
    console.log(`Category "${cat.name}": linked ${res.count} new module(s)`)
}

// 2. optionally fix one tenant's category
if (subdomainArg && categoryArg) {
    const cat = categories.find((c) => c.name.toLowerCase() === categoryArg.toLowerCase())
    if (!cat) throw new Error(`Category "${categoryArg}" not found`)
    const t = await prisma.tenant.update({
        where: { subdomain: subdomainArg },
        data: { clinicCategoryId: cat.id },
    })
    console.log(`Tenant "${t.subdomain}" category set to "${cat.name}"`)
}

// 3. tenant -> modules (from its category)
const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', clinicCategoryId: { not: null } },
})
for (const t of tenants) {
    const links = await prisma.clinicCategoryModule.findMany({ where: { clinicCategoryId: t.clinicCategoryId } })
    const res = await prisma.tenantModule.createMany({
        data: links.map((l) => ({ tenantId: t.id, moduleId: l.moduleId, isEnabled: true })),
        skipDuplicates: true,
    })
    console.log(`Tenant "${t.subdomain}": enabled ${res.count} new module(s)`)
}

await prisma.$disconnect()
console.log('Done.')