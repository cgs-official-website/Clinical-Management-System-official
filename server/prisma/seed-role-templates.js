import { PrismaClient } from '@prisma/client'
import { DEFAULT_ROLE_TEMPLATES } from '../src/constants/defaultRoleTemplates.js'

const prisma = new PrismaClient()

export async function seedRoleTemplates() {
  console.log('🌱 Seeding global default RoleTemplate records...')

  // Delete existing global templates (tenantId is null)
  await prisma.roleTemplate.deleteMany({
    where: { tenantId: null }
  })

  // Insert all default global templates
  const created = await prisma.roleTemplate.createMany({
    data: DEFAULT_ROLE_TEMPLATES.map(t => ({
      tenantId: null,
      keyword: t.keyword,
      module: t.module,
      action: t.action,
      isWildcard: t.isWildcard
    }))
  })

  console.log(`✅ Seeded ${created.count} global RoleTemplate records successfully.`)
}

// Run directly if invoked as standalone script
if (process.argv[1] && (process.argv[1].endsWith('seed-role-templates.js') || process.argv[1].includes('seed-role-templates'))) {
  seedRoleTemplates()
    .catch((err) => {
      console.error('❌ Failed to seed role templates:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
