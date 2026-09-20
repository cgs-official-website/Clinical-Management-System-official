import { RoleTemplateService } from '../src/services/roleTemplate.service.js'
import { AdminService } from '../src/services/admin.service.js'
import { prisma } from '../src/config/prisma.js'

async function run() {
  console.log('🔍 Testing Live Backend Suggestion & Role Creation Flow...\n')

  // 1. Test suggestPermissions for "Senior Nurse"
  const nurseRes = await RoleTemplateService.suggestPermissions('Senior Nurse')
  console.log('1. Suggestion for "Senior Nurse":', {
    matchedKeywords: nurseRes.matchedKeywords,
    permissionCount: nurseRes.permissions.length,
    samplePermissions: nurseRes.permissions.slice(0, 3),
    message: nurseRes.message
  })

  if (!nurseRes.matchedKeywords.includes('nurse') || !nurseRes.matchedKeywords.includes('senior')) {
    throw new Error('Failed to match nurse and senior keywords')
  }

  // 2. Test suggestPermissions for "Head Biller & Insurance"
  const billerRes = await RoleTemplateService.suggestPermissions('Head Biller & Insurance')
  console.log('\n2. Suggestion for "Head Biller & Insurance":', {
    matchedKeywords: billerRes.matchedKeywords,
    permissionCount: billerRes.permissions.length,
    samplePermissions: billerRes.permissions.slice(0, 3)
  })

  // 3. Test suggestPermissions for unmatched role
  const unkRes = await RoleTemplateService.suggestPermissions('Deep Sea Diver')
  console.log('\n3. Suggestion for unmatched "Deep Sea Diver":', {
    matchedKeywords: unkRes.matchedKeywords,
    permissionCount: unkRes.permissions.length,
    message: unkRes.message
  })

  if (unkRes.permissions.length !== 0 || !unkRes.message.includes('No matching template')) {
    throw new Error('Expected empty permissions for unmatched role')
  }

  // 4. Test list templates
  const templatesRes = await RoleTemplateService.listTemplates()
  console.log('\n4. RoleTemplate Table Query:', {
    globalTemplatesCount: templatesRes.globalTemplates.length,
    isUsingCustom: templatesRes.isUsingCustom
  })

  // 5. Test AdminService.createRole with only name
  const testRoleName = `AutoSuggest Test Role ${Date.now()}`
  console.log(`\n5. Creating role with name "${testRoleName}" and NO explicit permissions...`)
  const createdRole = await AdminService.createRole({
    name: `${testRoleName} Nurse`,
    actorId: null
  })

  console.log('Role successfully created:', {
    id: createdRole.id,
    name: createdRole.name,
    assignedPermissionsCount: createdRole.permissions.length,
    matchedKeywords: createdRole.matchedKeywords
  })

  if (createdRole.permissions.length === 0) {
    throw new Error('Expected auto-suggested permissions to be assigned to created role!')
  }

  // Clean up test role
  await prisma.rolePermission.deleteMany({ where: { roleId: createdRole.id } })
  await prisma.role.delete({ where: { id: createdRole.id } })
  console.log('Cleaned up test role.')

  console.log('\n✨ All live API service flow tests PASSED!')
}

run()
  .catch(err => {
    console.error('❌ Error during test:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
