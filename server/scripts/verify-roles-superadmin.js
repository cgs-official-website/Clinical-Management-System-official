import { AuthService } from '../src/services/auth.service.js'

async function run() {
  console.log('--- Testing Superadmin Access ---')
  const superRes = await AuthService.login('superadmin@clinic.io', 'Admin@123')
  const superToken = superRes.tokens.accessToken
  console.log('Superadmin logged in. userType:', superRes.user.userType, 'isSuperadmin:', superRes.user.isSuperadmin)

  const pendingRes = await fetch('http://localhost:5001/api/superadmin/pending-registrations', {
    headers: { Authorization: 'Bearer ' + superToken }
  })
  console.log('SUPERADMIN GET /pending-registrations STATUS:', pendingRes.status)
  const pendingJson = await pendingRes.json()
  console.log('PENDING REGISTRATIONS COUNT:', pendingJson.registrations?.length)

  console.log('\n--- Testing Clinic Admin Access ---')
  const adminRes = await AuthService.login('admin@aurahealth.org', 'Admin@123')
  const adminToken = adminRes.tokens.accessToken
  console.log('Admin logged in. userType:', adminRes.user.userType, 'isSuperadmin:', adminRes.user.isSuperadmin, 'isAdmin:', adminRes.user.isAdmin)

  const rolesRes = await fetch('http://localhost:5001/api/admin/roles', {
    headers: { Authorization: 'Bearer ' + adminToken }
  })
  console.log('ADMIN GET /api/admin/roles STATUS:', rolesRes.status)
  const rolesJson = await rolesRes.json()
  console.log('ROLES COUNT:', rolesJson.roles?.length)

  const kpisRes = await fetch('http://localhost:5001/api/admin/kpis', {
    headers: { Authorization: 'Bearer ' + adminToken }
  })
  console.log('ADMIN GET /api/admin/kpis STATUS:', kpisRes.status)

  process.exit(0)
}

run().catch((e) => {
  console.error('ERROR:', e)
  process.exit(1)
})
