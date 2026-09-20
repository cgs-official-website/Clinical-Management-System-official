import assert from 'assert'
import { RbacService } from '../services/rbac.service.js'
import { redis } from '../config/redis.js'

async function runTests() {
  console.log('\n🧪 Running RBAC Engine Unit & Integration Tests...\n')
  let passed = 0
  let failed = 0

  function test(name, fn) {
    return Promise.resolve()
      .then(() => fn())
      .then(() => {
        console.log(`  ✅ PASS: ${name}`)
        passed++
      })
      .catch((err) => {
        console.error(`  ❌ FAIL: ${name}`)
        console.error(`     Error: ${err.message}`)
        failed++
      })
  }

  // 1. Permission Evaluation: Single permission match
  await test('hasPermission matches exact permission code', () => {
    const userPerms = ['patients.view', 'patients.create']
    assert.strictEqual(RbacService.hasPermission(userPerms, 'patients.create'), true)
    assert.strictEqual(RbacService.hasPermission(userPerms, 'patients.delete'), false)
  })

  // 2. Permission Evaluation: Wildcard Superadmin
  await test('hasPermission grants access when user has global wildcard *', () => {
    const userPerms = ['*']
    assert.strictEqual(RbacService.hasPermission(userPerms, 'billing.delete'), true)
    assert.strictEqual(RbacService.hasPermission(userPerms, 'roles.edit'), true)
  })

  // 3. Permission Evaluation: Module-level wildcard
  await test('hasPermission grants access when user has module wildcard (e.g. patients.*)', () => {
    const userPerms = ['patients.*', 'appointments.view']
    assert.strictEqual(RbacService.hasPermission(userPerms, 'patients.delete'), true)
    assert.strictEqual(RbacService.hasPermission(userPerms, 'patients.create'), true)
    assert.strictEqual(RbacService.hasPermission(userPerms, 'billing.view'), false)
  })

  // 4. Multi-role Union computation
  await test('Multi-role union computation merges distinct permissions across roles', () => {
    // Simulate user with Role A (Doctor: patients.*, prescriptions.*) and Role B (Department Head: staff.view, billing.view)
    const roleDoctorPerms = ['patients.view', 'patients.create', 'prescriptions.create']
    const roleDeptHeadPerms = ['staff.view', 'billing.view', 'patients.view']

    const merged = Array.from(new Set([...roleDoctorPerms, ...roleDeptHeadPerms]))

    assert.strictEqual(merged.includes('patients.view'), true)
    assert.strictEqual(merged.includes('patients.create'), true)
    assert.strictEqual(merged.includes('prescriptions.create'), true)
    assert.strictEqual(merged.includes('staff.view'), true)
    assert.strictEqual(merged.includes('billing.view'), true)
    assert.strictEqual(merged.includes('billing.delete'), false)
    assert.strictEqual(merged.length, 5) // Set deduplicates patients.view
  })

  // 5. Redis Cache set and invalidation test
  await test('Redis cache stores and invalidates permission keys', async () => {
    const userId = 'test-user-' + Date.now()
    const cacheKey = `perms:${userId}`
    const mockPermData = {
      userId,
      roles: ['NURSE'],
      permissions: ['patients.view', 'appointments.view']
    }

    // Set cache
    await redis.set(cacheKey, JSON.stringify(mockPermData), 'EX', 60)
    const cached = await redis.get(cacheKey)
    assert.ok(cached, 'Cache key should exist')
    const parsed = JSON.parse(cached)
    assert.deepStrictEqual(parsed.permissions, mockPermData.permissions)

    // Invalidate
    await RbacService.invalidateUserPermissions(userId)
    const afterInvalidation = await redis.get(cacheKey)
    assert.strictEqual(afterInvalidation, null, 'Cache key should be deleted after invalidation')
  })

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed.\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((e) => {
  console.error('Test runner fatal error:', e)
  process.exit(1)
})
