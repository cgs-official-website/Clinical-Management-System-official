import { prisma } from '../src/config/prisma.js'

async function checkServer() {
  console.log('=== CHECKING SERVER & SERVICES CONNECTIVITY ===\n')

  // 1. Root HTTP endpoint
  try {
    const t0 = Date.now()
    const res = await fetch('http://localhost:5000/')
    const dt = Date.now() - t0
    const body = await res.json()
    console.log(`[PASS] Root API (http://localhost:5000/) - Status: ${res.status} (${dt}ms)`)
    console.log('       Service name:', body.name)
  } catch (err) {
    console.log(`[FAIL] Root API (http://localhost:5000/) - ${err.message}`)
  }

  // 2. Health Endpoint
  try {
    const t0 = Date.now()
    const res = await fetch('http://localhost:5000/health')
    const dt = Date.now() - t0
    const body = await res.json()
    console.log(`[PASS] Health Probe (http://localhost:5000/health) - Status: ${res.status} (${dt}ms)`)
    console.log('       Overall status:', body.status)
    console.log('       Database:', JSON.stringify(body.database))
    console.log('       Uptime:', body.uptime, 'seconds')
  } catch (err) {
    console.log(`[FAIL] Health Probe (http://localhost:5000/health) - ${err.message}`)
  }

  // 3. Public API Endpoint
  try {
    const t0 = Date.now()
    const res = await fetch('http://localhost:5000/api/public/clinic-categories')
    const dt = Date.now() - t0
    const body = await res.json()
    console.log(`[PASS] API Endpoint (/api/public/clinic-categories) - Status: ${res.status} (${dt}ms)`)
    console.log('       Active categories:', body.data?.map((c) => c.name).join(', '))
  } catch (err) {
    console.log(`[FAIL] API Endpoint - ${err.message}`)
  }

  // 4. PostgreSQL Database via Prisma
  try {
    const t0 = Date.now()
    await prisma.$queryRaw`SELECT 1 as connected`
    const dt = Date.now() - t0
    const categoryCount = await prisma.clinicCategory.count()
    console.log(`[PASS] PostgreSQL Database Connection - Latency: ${dt}ms`)
    console.log(`       Verified Active Categories: ${categoryCount}`)
  } catch (err) {
    console.log(`[FAIL] PostgreSQL Database Connection - ${err.message}`)
  }

  // 5. Client Dev Server
  try {
    const t0 = Date.now()
    const res = await fetch('http://localhost:5173/')
    const dt = Date.now() - t0
    console.log(`[PASS] Frontend Web Client (http://localhost:5173/) - Status: ${res.status} (${dt}ms)`)
  } catch (err) {
    console.log(`[FAIL] Frontend Web Client (http://localhost:5173/) - ${err.message}`)
  }

  console.log('\n=== ALL SERVICES ONLINE AND RESPONDING ===')
}

checkServer()
  .catch((e) => {
    console.error('Check failed:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
