async function runHttpE2E() {
  console.log('=== RUNNING LIVE HTTP REST API E2E VERIFICATION ===\n')

  const BASE_URL = 'http://localhost:5000'

  // 1. GET /api/public/clinic-categories
  console.log('1. Testing GET /api/public/clinic-categories...')
  const catRes = await fetch(`${BASE_URL}/api/public/clinic-categories`)
  if (!catRes.ok) throw new Error(`Failed to fetch categories: ${catRes.status}`)
  const catData = await catRes.json()
  const categories = catData.data || []
  console.log(`[PASS] Found ${categories.length} active categories:`, categories.map((c) => c.name))

  const physioCat = categories.find((c) => c.name === 'Physiotherapy')
  if (!physioCat) {
    throw new Error('Physiotherapy category is NOT present in GET /api/public/clinic-categories!')
  }
  console.log(`[PASS] "Physiotherapy" found with ID: ${physioCat.id}`)

  // 2. Register clinic with category "Physiotherapy"
  const testSubdomain = `physio-e2e-${Date.now()}`
  const testEmail = `admin.${testSubdomain}@physioe2e.org`
  const testPassword = 'Password123!'

  console.log(`\n2. Submitting POST /api/public/register-clinic for subdomain: ${testSubdomain}...`)
  const regRes = await fetch(`${BASE_URL}/api/public/register-clinic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinicName: 'Kinetic Edge Physiotherapy Clinic',
      subdomain: testSubdomain,
      adminName: 'Dr. Evelyn Reed PT',
      email: testEmail,
      password: testPassword,
      phone: '+1 555-839-2049',
      clinic_category_id: physioCat.id,
      plan: 'Professional',
    }),
  })

  const regData = await regRes.json()
  if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`)
  console.log(`[PASS] Registration created successfully! Registration ID: ${regData.registrationId}`)

  // 3. Login as Superadmin
  console.log('\n3. Logging in as Superadmin via POST /api/auth/login...')
  const superLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@clinic.io',
      password: 'Cgs@001a',
    }),
  })

  const superLoginData = await superLoginRes.json()
  if (!superLoginRes.ok) throw new Error(`Superadmin login failed: ${JSON.stringify(superLoginData)}`)
  const superToken = superLoginData.data?.tokens?.accessToken || superLoginData.tokens?.accessToken
  console.log('[PASS] Superadmin logged in successfully!')

  // 4. Fetch clinics as Superadmin to locate the newly registered clinic
  console.log('\n4. Fetching clinic list via GET /api/superadmin/clinics...')
  const clinicsRes = await fetch(`${BASE_URL}/api/superadmin/clinics?status=pending`, {
    headers: { Authorization: `Bearer ${superToken}` },
  })
  const clinicsData = await clinicsRes.json()
  const pendingClinics = clinicsData.clinics || clinicsData.data || []
  let registeredClinic = pendingClinics.find((c) => c.slug === testSubdomain || c.subdomain === testSubdomain)
  if (!registeredClinic) {
    // Also try checking /api/superadmin/pending-registrations
    const regListRes = await fetch(`${BASE_URL}/api/superadmin/pending-registrations`, {
      headers: { Authorization: `Bearer ${superToken}` },
    })
    const regListData = await regListRes.json()
    const foundReg = (regListData.data || []).find((r) => r.subdomain === testSubdomain)
    if (!foundReg) {
      throw new Error(`Registered clinic with subdomain "${testSubdomain}" not found in pending list!`)
    }
    registeredClinic = foundReg
  }
  const clinicId = registeredClinic?.tenantId || registeredClinic?.id
  console.log(`[PASS] Found pending clinic in Superadmin queue (ID: ${clinicId})`)

  // 5. Approve clinic via PATCH /api/superadmin/clinics/:id/status
  console.log(`\n5. Approving clinic via PATCH /api/superadmin/clinics/${clinicId}/status with { status: "ACTIVE" }...`)
  const approveRes = await fetch(`${BASE_URL}/api/superadmin/clinics/${clinicId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${superToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'ACTIVE' }),
  })

  const approveData = await approveRes.json()
  if (!approveRes.ok) throw new Error(`Clinic approval failed: ${JSON.stringify(approveData)}`)
  console.log('[PASS] Clinic approved successfully by Superadmin! Status:', approveData.clinic?.status || approveData.status)

  // 6. Login as the newly approved clinic administrator
  console.log(`\n6. Logging in as approved clinic admin: ${testEmail}...`)
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  })

  const adminLoginData = await adminLoginRes.json()
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`)
  const adminToken = adminLoginData.data?.tokens?.accessToken || adminLoginData.tokens?.accessToken
  console.log('[PASS] Clinic admin logged in successfully! Role:', adminLoginData.data?.user?.role || adminLoginData.user?.role)

  // 7. Check permitted modules for the logged in admin user
  console.log('\n7. Querying permitted modules via GET /api/permissions/user/me...')
  const myPermRes = await fetch(`${BASE_URL}/api/permissions/user/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  const myPermData = await myPermRes.json()
  if (!myPermRes.ok) throw new Error(`Failed to fetch user permissions: ${JSON.stringify(myPermData)}`)

  const permittedModules = myPermData.permittedModules || []
  console.log(`[VERIFY] Total permitted modules for Physiotherapy clinic admin: ${permittedModules.length}`)
  console.log('Permitted modules returned:')
  for (const m of permittedModules) {
    console.log(`  - ${m.name}: route="${m.route}"`)
  }

  if (permittedModules.length !== 10) {
    throw new Error(`Expected exactly 10 permitted modules, got ${permittedModules.length}!`)
  }

  const expected10Names = [
    'Patients',
    'Appointments',
    'Treatment/Session Plans',
    'Exercise Program Tracker',
    'Progress/Recovery Notes',
    'Prescriptions',
    'Billing/Invoices',
    'Inventory',
    'Reports',
    'Staff',
  ]

  const returnedNames = permittedModules.map((m) => m.name)
  for (const name of expected10Names) {
    if (!returnedNames.includes(name)) {
      throw new Error(`Expected module "${name}" was not found in permitted modules!`)
    }
  }

  // Ensure NO Dental Care modules are permitted
  const dentalNames = [
    'Dental Chart (Tooth Diagram)',
    'Treatment Plans',
    'X-Ray Records',
    'Orthodontics Tracker',
    'Implant Registry',
    'Lab Work Orders',
  ]

  for (const dName of dentalNames) {
    if (returnedNames.includes(dName)) {
      throw new Error(`Dental Care module "${dName}" unexpectedly returned for Physiotherapy clinic!`)
    }
  }
  console.log('[PASS] Exactly the 10 Physiotherapy modules are returned and 0 Dental Care modules!')

  // 8. Clean up test clinic
  console.log('\n8. Cleaning up test clinic...')
  const deleteRes = await fetch(`${BASE_URL}/api/superadmin/clinics/${clinicId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superToken}` },
  })
  console.log(`[PASS] Cleanup completed (status ${deleteRes.status}).`)

  console.log('\n=== ALL HTTP REST API E2E VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n')
}

runHttpE2E().catch((err) => {
  console.error('\n❌ HTTP E2E TEST FAILED:', err)
  process.exit(1)
})
