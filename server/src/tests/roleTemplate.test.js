import assert from 'node:assert'
import { RoleTemplateService } from '../services/roleTemplate.service.js'
import { ALL_SYSTEM_MODULES, ALL_ACTIONS } from '../constants/defaultRoleTemplates.js'

async function runTests() {
  console.log('\n🧪 Running RoleTemplate & Permission Suggestion Engine Tests...\n')

  // Test 1: Doctor / Physician / Attending keyword matching
  {
    const res = await RoleTemplateService.suggestPermissions('Attending Physician')
    assert.ok(res.matchedKeywords.includes('physician') || res.matchedKeywords.includes('attending'), 'Matched physician or attending')
    assert.ok(res.permissionCodes.includes('patients.view'), 'Has patients.view')
    assert.ok(res.permissionCodes.includes('patients.create'), 'Has patients.create')
    assert.ok(res.permissionCodes.includes('appointments.view'), 'Has appointments.view')
    assert.ok(res.permissionCodes.includes('prescriptions.view'), 'Has prescriptions.view')
    assert.ok(res.permissionCodes.includes('prescriptions.create'), 'Has prescriptions.create')
    assert.strictEqual(res.permissionCodes.includes('billing.delete'), false, 'Does not have billing.delete')
    console.log('  ✅ PASS: Doctor / Physician / Attending persona matches expected clinical permissions')
  }

  // Test 2: Nurse keyword matching
  {
    const res = await RoleTemplateService.suggestPermissions('Staff Nurse')
    assert.ok(res.matchedKeywords.includes('nurse'), 'Matched nurse')
    assert.ok(res.permissionCodes.includes('patients.view'), 'Has patients.view')
    assert.ok(res.permissionCodes.includes('patients.create'), 'Has patients.create')
    assert.ok(res.permissionCodes.includes('appointments.view'), 'Has appointments.view')
    assert.ok(res.permissionCodes.includes('appointments.create'), 'Has appointments.create')
    assert.ok(res.permissionCodes.includes('appointments.edit'), 'Has appointments.edit')
    assert.ok(res.permissionCodes.includes('inventory.view'), 'Has inventory.view')
    assert.ok(res.permissionCodes.includes('inventory.edit'), 'Has inventory.edit')
    console.log('  ✅ PASS: Nurse persona matches expected triage & stock permissions')
  }

  // Test 3: Receptionist / Front Desk keyword matching
  {
    const res = await RoleTemplateService.suggestPermissions('Front Desk Intake')
    assert.ok(res.matchedKeywords.includes('front desk'), 'Matched front desk')
    assert.ok(res.permissionCodes.includes('appointments.view'), 'Has appointments.view')
    assert.ok(res.permissionCodes.includes('appointments.create'), 'Has appointments.create')
    assert.ok(res.permissionCodes.includes('appointments.edit'), 'Has appointments.edit')
    assert.ok(res.permissionCodes.includes('patients.create'), 'Has patients.create')
    assert.ok(res.permissionCodes.includes('billing.create'), 'Has billing.create')
    console.log('  ✅ PASS: Receptionist / Front Desk persona matches front intake permissions')
  }

  // Test 4: Billing / Insurance keyword matching
  {
    const res = await RoleTemplateService.suggestPermissions('Insurance Claims Specialist')
    assert.ok(res.matchedKeywords.includes('insurance'), 'Matched insurance')
    assert.ok(res.permissionCodes.includes('billing.view'), 'Has billing.view')
    assert.ok(res.permissionCodes.includes('billing.create'), 'Has billing.create')
    assert.ok(res.permissionCodes.includes('billing.edit'), 'Has billing.edit')
    assert.ok(res.permissionCodes.includes('invoices.view'), 'Has invoices.view')
    assert.ok(res.permissionCodes.includes('reports.view'), 'Has reports.view')
    console.log('  ✅ PASS: Billing / Insurance persona matches ledger and invoice permissions')
  }

  // Test 5: Admin / Administrator wildcard matching
  {
    const res = await RoleTemplateService.suggestPermissions('Clinical Administrator')
    assert.ok(res.matchedKeywords.includes('administrator') || res.matchedKeywords.includes('admin'), 'Matched admin')
    // Wildcard gives view, create, edit, delete across all 9 modules = 36 permissions
    for (const mod of ALL_SYSTEM_MODULES) {
      for (const act of ALL_ACTIONS) {
        assert.ok(res.permissionCodes.includes(`${mod}.${act}`), `Admin has ${mod}.${act}`)
      }
    }
    assert.strictEqual(res.permissionCodes.length >= 36, true, 'Admin has full permissions')
    console.log('  ✅ PASS: Admin / Administrator wildcard expands to all modules (view+create+edit+delete)')
  }

  // Test 6: Senior / Head / Chief modifier rule (Senior Nurse)
  {
    const baseNurse = await RoleTemplateService.suggestPermissions('Nurse')
    assert.strictEqual(baseNurse.permissionCodes.includes('patients.edit'), false, 'Base nurse does not have patients.edit')

    const seniorNurse = await RoleTemplateService.suggestPermissions('Senior Nurse')
    assert.ok(seniorNurse.matchedKeywords.includes('nurse'), 'Matched nurse')
    assert.ok(seniorNurse.matchedKeywords.includes('senior'), 'Matched senior modifier')
    // Modifier adds .edit to all matched modules
    assert.ok(seniorNurse.permissionCodes.includes('patients.edit'), 'Senior Nurse has patients.edit added by modifier')
    assert.ok(seniorNurse.permissionCodes.includes('appointments.edit'), 'Senior Nurse has appointments.edit')
    assert.ok(seniorNurse.permissionCodes.includes('inventory.edit'), 'Senior Nurse has inventory.edit')
    console.log('  ✅ PASS: Senior modifier adds .edit on top of base matched modules')
  }

  // Test 7: Senior Billing Officer (multiple keyword merger)
  {
    const res = await RoleTemplateService.suggestPermissions('Senior Billing Officer')
    assert.ok(res.matchedKeywords.includes('billing'), 'Matched billing')
    assert.ok(res.matchedKeywords.includes('senior'), 'Matched senior')
    assert.ok(res.permissionCodes.includes('billing.edit'), 'Has billing.edit')
    assert.ok(res.permissionCodes.includes('invoices.edit'), 'Senior adds invoices.edit')
    assert.ok(res.permissionCodes.includes('reports.edit'), 'Senior adds reports.edit')
    console.log('  ✅ PASS: Multiple keyword merger ("Senior Billing Officer") correctly combines base + modifier')
  }

  // Test 8: Unmatched role name returns empty array + exact message
  {
    const res = await RoleTemplateService.suggestPermissions('Astronaut Pilot')
    assert.strictEqual(res.permissions.length, 0, 'Permissions array is empty')
    assert.strictEqual(res.permissionCodes.length, 0, 'Permission codes array is empty')
    assert.strictEqual(res.matchedKeywords.length, 0, 'Matched keywords is empty')
    assert.strictEqual(res.message, 'No matching template found. Please select permissions manually.')
    console.log('  ✅ PASS: Unmatched role returns empty array with manual selection prompt')
  }

  // Test 9: Output format conforms to ROLE_PERMISSION expectation
  {
    const res = await RoleTemplateService.suggestPermissions('Doctor')
    assert.ok(Array.isArray(res.permissions), 'permissions is array')
    assert.ok(res.permissions.length > 0, 'has items')
    const sample = res.permissions[0]
    assert.ok('module' in sample, 'item has module field')
    assert.ok('action' in sample, 'item has action field')
    console.log('  ✅ PASS: Output format conforms to [{ module, action }, ...] structure')
  }

  console.log('\n📊 All 9 RoleTemplate & Permission Suggestion Engine tests passed successfully!\n')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
