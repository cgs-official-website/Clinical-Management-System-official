import { prisma } from '../src/config/prisma.js'

async function main() {
  console.log('Searching for users matching "muzzimuzzi"...')
  const matchedUsers = await prisma.user.findMany({
    where: {
      email: { contains: 'muzzimuzzi', mode: 'insensitive' }
    },
    include: {
      tenant: true
    }
  })

  console.log(`Found ${matchedUsers.length} user(s):`)
  matchedUsers.forEach(u => {
    console.log(` - Email: ${u.email} | Name: ${u.fullName} | Tenant: ${u.tenant?.name} (${u.tenantId})`)
  })

  if (matchedUsers.length === 0) {
    console.log('No user found matching muzzimuzzi')
    return
  }

  const targetTenantId = matchedUsers[0].tenantId
  const tenantName = matchedUsers[0].tenant?.name

  console.log(`\n========================================`)
  console.log(`STAFF MEMBERS FOR TENANT: "${tenantName}"`)
  console.log(`Tenant ID: ${targetTenantId}`)
  console.log(`========================================\n`)

  const staff = await prisma.user.findMany({
    where: {
      tenantId: targetTenantId,
      userType: { in: ['STAFF', 'ADMIN'] }
    },
    include: {
      tenant: true,
      userRoles: { include: { role: true } },
      staffProfile: { include: { department: true } }
    },
    orderBy: { fullName: 'asc' }
  })

  console.log(`Total staff count: ${staff.length}\n`)

  staff.forEach((s, idx) => {
    console.log(`[${idx + 1}] ${s.fullName}`)
    console.log(`    ID:         ${s.id}`)
    console.log(`    Email:      ${s.email}`)
    console.log(`    Phone:      ${s.phone || 'N/A'}`)
    console.log(`    Status:     ${s.status}`)
    console.log(`    User Type:  ${s.userType}`)
    console.log(`    Department: ${s.staffProfile?.department?.name || 'General Clinic'}`)
    console.log(`    Specialty:  ${s.staffProfile?.specialty || 'General Practice / Administration'}`)
    console.log(`    Roles:      ${s.userRoles.map(ur => ur.role.name).join(', ') || 'No explicit role'}`)
    console.log(`    Tenant:     ${s.tenant?.name}`)
    console.log(`    Created At: ${s.createdAt.toISOString()}`)
    console.log('----------------------------------------')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
