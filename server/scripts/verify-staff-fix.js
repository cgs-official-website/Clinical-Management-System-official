async function run() {
  console.log('=== 1. Testing CORS Preflight OPTIONS /api/admin/staff ===')
  const preflightRes = await fetch('http://localhost:5001/api/admin/staff', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization, content-type, x-user-email, x-user-role'
    }
  })
  console.log('Preflight status:', preflightRes.status)
  console.log('Access-Control-Allow-Origin:', preflightRes.headers.get('access-control-allow-origin'))
  console.log('Access-Control-Allow-Headers:', preflightRes.headers.get('access-control-allow-headers'))

  console.log('\n=== 2. Testing Login with muzzimuzzi07@gmail.com (Typo Normalization) ===')
  const loginRes07 = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'muzzimuzzi07@gmail.com',
      password: 'muzzi123'
    })
  })
  const loginData07 = await loginRes07.json()
  const user07 = loginData07.user || loginData07.data?.user
  console.log('Login 07 status:', loginRes07.status)
  console.log('User returned:', user07?.name, user07?.email, 'Tenant ID:', user07?.tenantId)

  console.log('\n=== 3. Testing Login with muzzimuzzi007@gmail.com ===')
  const loginRes007 = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'muzzimuzzi007@gmail.com',
      password: 'muzzi123'
    })
  })
  const loginData007 = await loginRes007.json()
  const user007 = loginData007.user || loginData007.data?.user
  const token = loginData007.tokens?.accessToken || loginData007.data?.tokens?.accessToken
  console.log('Login 007 status:', loginRes007.status, 'Token acquired:', !!token)

  console.log('\n=== 4. Fetching Staff via GET /api/admin/staff with headers ===')
  const staffRes = await fetch('http://localhost:5001/api/admin/staff', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-user-email': loginData007.user?.email,
      'x-user-role': loginData007.user?.userType || 'ADMIN'
    }
  })
  console.log('Staff API status:', staffRes.status)
  const staffData = await staffRes.json()
  const staffList = staffData.staff || (Array.isArray(staffData.data) ? staffData.data : (Array.isArray(staffData) ? staffData : []))
  console.log('Staff count returned:', staffList.length)
  console.log('Staff list:')
  staffList.forEach(s => {
    console.log(` - ID: ${s.id}, Name: ${s.name}, Email: ${s.email}, Role: ${s.role}, UserType: ${s.userType}, Status: ${s.status}`)
  })
}

run().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
