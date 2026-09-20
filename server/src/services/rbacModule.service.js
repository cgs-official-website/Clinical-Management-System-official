import { prisma } from '../config/prisma.js'
import { pubsub } from '../config/redis.js'
import { logger } from '../utils/logger.js'

// Default in-memory seed stores ensuring 100% resilience across all environments
const DEFAULT_ROLES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Admin', description: 'Clinic Administrator' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Doctor', description: 'Senior Attending Physician' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Receptionist', description: 'Front Desk & Intake' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Nurse', description: 'Registered Clinical Nurse' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Biller', description: 'Billing & Insurance Officer' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Pharmacist', description: 'Pharmacy & Stock Officer' }
]

export const MODULE_METADATA = {
  patients: { name: 'Patients', icon: 'Users', route: '/app/staff/patients', defaultOrder: 1 },
  appointments: { name: 'Appointments', icon: 'Calendar', route: '/app/staff/appointments', defaultOrder: 2 },
  dental_chart: { name: 'Dental Chart (Tooth Diagram)', icon: 'Tooth', route: '/app/dental/chart', defaultOrder: 3 },
  treatment_plans: { name: 'Treatment Plans', icon: 'ClipboardList', route: '/app/dental/treatment-plans', defaultOrder: 4 },
  xray_records: { name: 'X-Ray Records', icon: 'FileImage', route: '/app/dental/xrays', defaultOrder: 5 },
  orthodontics: { name: 'Orthodontics Tracker', icon: 'Smile', route: '/app/dental/orthodontics', defaultOrder: 6 },
  implant_registry: { name: 'Implant Registry', icon: 'Layers', route: '/app/dental/implants', defaultOrder: 7 },
  prescriptions: { name: 'Prescriptions', icon: 'Pill', route: '/app/staff/prescriptions', defaultOrder: 8 },
  billing: { name: 'Billing/Invoices', icon: 'CreditCard', route: '/app/staff/billing', defaultOrder: 9 },
  inventory: { name: 'Inventory', icon: 'Boxes', route: '/app/staff/inventory', defaultOrder: 10 },
  lab_orders: { name: 'Lab Work Orders', icon: 'FlaskConical', route: '/app/dental/lab-orders', defaultOrder: 11 },
  reports: { name: 'Reports', icon: 'BarChart3', route: '/app/staff/reports', defaultOrder: 12 },
  staff: { name: 'Staff', icon: 'ShieldCheck', route: '/app/admin/staff', defaultOrder: 13 },
  flow: { name: 'Patient Flow (Rx Loop)', icon: 'Sparkles', route: '/app/staff/flow', defaultOrder: 14 },
  treatment_session_plans: { name: 'Treatment/Session Plans', icon: 'ClipboardList', route: '/app/physio/treatment-plans', defaultOrder: 3 },
  exercise_program_tracker: { name: 'Exercise Program Tracker', icon: 'Activity', route: '/app/physio/exercise-tracker', defaultOrder: 4 },
  progress_recovery_notes: { name: 'Progress/Recovery Notes', icon: 'FileText', route: '/app/physio/progress-notes', defaultOrder: 5 },
  ecg_records: { name: 'ECG/EKG Records', icon: 'Activity', route: '/app/cardio/ecg-records', defaultOrder: 3 },
  echo_reports: { name: 'Echocardiography (Echo) Reports', icon: 'FileText', route: '/app/cardio/echo-reports', defaultOrder: 4 },
  cath_lab_scheduling: { name: 'Cath Lab / Procedure Scheduling', icon: 'Clock', route: '/app/cardio/cath-lab', defaultOrder: 5 },
  cardiac_risk_assessment: { name: 'Cardiac Risk Assessment', icon: 'ShieldAlert', route: '/app/cardio/risk-assessment', defaultOrder: 6 },
  roles: { name: 'Roles & Permissions', icon: 'KeyRound', route: '/app/admin/roles', defaultOrder: 15 },
  clinical_config: { name: 'Clinical Config', icon: 'Sliders', route: '/app/admin/clinical-config', defaultOrder: 16 },
}

const DEFAULT_MODULES = [
  { id: 'a1111111-1111-1111-1111-111111111111', key: 'patients', name: 'Patients', icon: 'Users', route: '/app/staff/patients', displayOrder: 1 },
  { id: 'a2222222-2222-2222-2222-222222222222', key: 'appointments', name: 'Appointments', icon: 'Calendar', route: '/app/staff/appointments', displayOrder: 2 },
  { id: 'd0000001-0000-0000-0000-000000000001', key: 'dental_chart', name: 'Dental Chart (Tooth Diagram)', icon: 'Tooth', route: '/app/dental/chart', displayOrder: 3 },
  { id: 'd0000002-0000-0000-0000-000000000002', key: 'treatment_plans', name: 'Treatment Plans', icon: 'ClipboardList', route: '/app/dental/treatment-plans', displayOrder: 4 },
  { id: 'd0000003-0000-0000-0000-000000000003', key: 'xray_records', name: 'X-Ray Records', icon: 'FileImage', route: '/app/dental/xrays', displayOrder: 5 },
  { id: 'd0000004-0000-0000-0000-000000000004', key: 'orthodontics', name: 'Orthodontics Tracker', icon: 'Smile', route: '/app/dental/orthodontics', displayOrder: 6 },
  { id: 'd0000005-0000-0000-0000-000000000005', key: 'implant_registry', name: 'Implant Registry', icon: 'Layers', route: '/app/dental/implants', displayOrder: 7 },
  { id: 'a3333333-3333-3333-3333-333333333333', key: 'prescriptions', name: 'Prescriptions', icon: 'Pill', route: '/app/staff/prescriptions', displayOrder: 8 },
  { id: 'a4444444-4444-4444-4444-444444444444', key: 'billing', name: 'Billing/Invoices', icon: 'CreditCard', route: '/app/staff/billing', displayOrder: 9 },
  { id: 'a5555555-5555-5555-5555-555555555555', key: 'inventory', name: 'Inventory', icon: 'Boxes', route: '/app/staff/inventory', displayOrder: 10 },
  { id: 'd0000006-0000-0000-0000-000000000006', key: 'lab_orders', name: 'Lab Work Orders', icon: 'FlaskConical', route: '/app/dental/lab-orders', displayOrder: 11 },
  { id: 'a7777777-7777-7777-7777-777777777777', key: 'reports', name: 'Reports', icon: 'BarChart3', route: '/app/staff/reports', displayOrder: 12 },
  { id: 'a9999999-9999-9999-9999-999999999999', key: 'staff', name: 'Staff', icon: 'ShieldCheck', route: '/app/admin/staff', displayOrder: 13 },
  { id: 'a6666666-6666-6666-6666-666666666666', key: 'flow', name: 'Patient Flow (Rx Loop)', icon: 'Sparkles', route: '/app/staff/flow', displayOrder: 14 },
  { id: 'a8888888-8888-8888-8888-888888888888', key: 'roles', name: 'Roles & Permissions', icon: 'KeyRound', route: '/app/admin/roles', displayOrder: 15 },
  { id: 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', key: 'clinical_config', name: 'Clinical Config', icon: 'Sliders', route: '/app/admin/clinical-config', displayOrder: 16 }
]

// In-memory permission matrix store: roleId -> { [moduleId]: { can_view, can_edit, can_delete } }
const memoryPermissions = new Map()

// Helper to seed in-memory defaults
const initMemoryStore = () => {
  if (memoryPermissions.size > 0) return

  // Admin has full view, edit, delete on all modules
  const adminPerms = {}
  DEFAULT_MODULES.forEach(m => {
    adminPerms[m.id] = { can_view: true, can_edit: true, can_delete: true }
  })
  memoryPermissions.set('11111111-1111-1111-1111-111111111111', adminPerms)
  memoryPermissions.set('admin', adminPerms)

  // Doctor
  const doctorPerms = {}
  DEFAULT_MODULES.forEach(m => {
    if (['/app/staff/patients', '/app/staff/appointments', '/app/staff/prescriptions', '/app/staff/flow'].includes(m.route)) {
      doctorPerms[m.id] = { can_view: true, can_edit: true, can_delete: false }
    } else if (['/app/staff/inventory', '/app/staff/reports'].includes(m.route)) {
      doctorPerms[m.id] = { can_view: true, can_edit: false, can_delete: false }
    } else {
      doctorPerms[m.id] = { can_view: false, can_edit: false, can_delete: false }
    }
  })
  memoryPermissions.set('22222222-2222-2222-2222-222222222222', doctorPerms)
  memoryPermissions.set('doctor', doctorPerms)

  // Receptionist
  const receptionPerms = {}
  DEFAULT_MODULES.forEach(m => {
    if (['/app/staff/patients', '/app/staff/appointments', '/app/staff/billing', '/app/staff/flow'].includes(m.route)) {
      receptionPerms[m.id] = { can_view: true, can_edit: true, can_delete: false }
    } else if (['/app/staff/prescriptions', '/app/staff/inventory'].includes(m.route)) {
      receptionPerms[m.id] = { can_view: true, can_edit: false, can_delete: false }
    } else {
      receptionPerms[m.id] = { can_view: false, can_edit: false, can_delete: false }
    }
  })
  memoryPermissions.set('33333333-3333-3333-3333-333333333333', receptionPerms)
  memoryPermissions.set('receptionist', receptionPerms)

  // Nurse
  const nursePerms = {}
  DEFAULT_MODULES.forEach(m => {
    if (['/app/staff/patients', '/app/staff/flow'].includes(m.route)) {
      nursePerms[m.id] = { can_view: true, can_edit: true, can_delete: false }
    } else if (['/app/staff/appointments', '/app/staff/prescriptions', '/app/staff/inventory'].includes(m.route)) {
      nursePerms[m.id] = { can_view: true, can_edit: false, can_delete: false }
    } else {
      nursePerms[m.id] = { can_view: false, can_edit: false, can_delete: false }
    }
  })
  memoryPermissions.set('44444444-4444-4444-4444-444444444444', nursePerms)
  memoryPermissions.set('nurse', nursePerms)

  // Biller
  const billerPerms = {}
  DEFAULT_MODULES.forEach(m => {
    if (['/app/staff/billing'].includes(m.route)) {
      billerPerms[m.id] = { can_view: true, can_edit: true, can_delete: false }
    } else if (['/app/staff/patients', '/app/staff/prescriptions', '/app/staff/reports'].includes(m.route)) {
      billerPerms[m.id] = { can_view: true, can_edit: false, can_delete: false }
    } else {
      billerPerms[m.id] = { can_view: false, can_edit: false, can_delete: false }
    }
  })
  memoryPermissions.set('55555555-5555-5555-5555-555555555555', billerPerms)
  memoryPermissions.set('biller', billerPerms)

  // Pharmacist
  const pharmPerms = {}
  DEFAULT_MODULES.forEach(m => {
    if (['/app/staff/inventory'].includes(m.route)) {
      pharmPerms[m.id] = { can_view: true, can_edit: true, can_delete: true }
    } else if (['/app/staff/prescriptions', '/app/staff/flow'].includes(m.route)) {
      pharmPerms[m.id] = { can_view: true, can_edit: true, can_delete: false }
    } else if (['/app/staff/patients'].includes(m.route)) {
      pharmPerms[m.id] = { can_view: true, can_edit: false, can_delete: false }
    } else {
      pharmPerms[m.id] = { can_view: false, can_edit: false, can_delete: false }
    }
  })
  memoryPermissions.set('66666666-6666-6666-6666-666666666666', pharmPerms)
  memoryPermissions.set('pharmacist', pharmPerms)
}

initMemoryStore()

export class RbacModuleService {
  /**
   * Fetch all roles
   */
  static async getRoles(tenantId = null) {
    try {
      if (!tenantId) {
        return []
      }
      const dbRoles = await prisma.role.findMany({
        where: { tenantId },
        select: { id: true, name: true, description: true, tenantId: true },
        orderBy: { createdAt: 'asc' }
      })
      if (dbRoles && dbRoles.length > 0) {
        const seen = new Set()
        const unique = []
        for (const r of dbRoles) {
          const key = (r.name || '').toLowerCase().trim()
          if (!seen.has(key)) {
            seen.add(key)
            unique.push(r)
          }
        }
        return unique
      }
    } catch {
      // Fallback
    }
    return []
  }

  /**
   * Fetch all registered modules
   */
  static async getModules() {
    return DEFAULT_MODULES
  }

  /**
   * Resolve role identifier (by UUID, name, or slug)
   */
  static resolveRoleId(roleIdentifier) {
    if (!roleIdentifier) return '33333333-3333-3333-3333-333333333333'
    const clean = String(roleIdentifier).toLowerCase().trim()

    if (clean.includes('superadmin') || clean === 'super') return 'superadmin'
    if (clean.includes('admin') || clean === '11111111-1111-1111-1111-111111111111') return '11111111-1111-1111-1111-111111111111'
    if (clean.includes('doctor') || clean.includes('physician') || clean === '22222222-2222-2222-2222-222222222222') return '22222222-2222-2222-2222-222222222222'
    if (clean.includes('reception') || clean === '33333333-3333-3333-3333-333333333333') return '33333333-3333-3333-3333-333333333333'
    if (clean.includes('nurse') || clean === '44444444-4444-4444-4444-444444444444') return '44444444-4444-4444-4444-444444444444'
    if (clean.includes('biller') || clean.includes('billing') || clean === '55555555-5555-5555-5555-555555555555') return '55555555-5555-5555-5555-555555555555'
    if (clean.includes('pharm') || clean.includes('stock') || clean === '66666666-6666-6666-6666-666666666666') return '66666666-6666-6666-6666-666666666666'

    return roleIdentifier
  }

  /**
   * Get permissions for a role, joined with module details.
   * Cross-checks against TenantModule.isEnabled for category-driven module isolation.
   * Returns: [ { id, role_id, module_id, module_name, module_icon, module_route, can_view, can_edit, can_delete } ]
   */
  static async getPermissionsByRole(roleIdentifier, { tenantId = null, canViewOnly = false } = {}) {
    initMemoryStore()
    const resolvedId = this.resolveRoleId(roleIdentifier)

    // Super Admin bypass: sees all modules with full permissions
    if (resolvedId === 'superadmin' && !tenantId) {
      return DEFAULT_MODULES.map(m => ({
        id: `perm-super-${m.id}`,
        role_id: 'superadmin',
        module_id: m.id,
        module_key: m.key,
        module_name: m.name,
        module_icon: m.icon,
        module_route: m.route,
        can_view: true,
        can_edit: true,
        can_delete: true
      }))
    }

    // Try resolving role and TenantModule from PostgreSQL
    try {
      // 1. Find role in DB
      let dbRole = await prisma.role.findFirst({
        where: {
          OR: [
            { id: resolvedId },
            { name: { equals: resolvedId, mode: 'insensitive' } },
            ...(tenantId ? [{ tenantId, name: { equals: resolvedId, mode: 'insensitive' } }] : [])
          ]
        },
        include: {
          rolePerms: {
            include: {
              permission: {
                include: { module: true, action: true }
              }
            }
          }
        }
      })

      const effectiveTenantId = tenantId || dbRole?.tenantId || null
      const isAdminRole =
        resolvedId === '11111111-1111-1111-1111-111111111111' ||
        resolvedId === 'admin' ||
        (dbRole && (dbRole.isSystemRole || dbRole.name.toLowerCase().includes('admin')))

      // 2. Query TenantModule to get category-driven enabled modules
      let tenantModules = []
      let categoryModuleOrderMap = new Map()
      let categoryName = ''
      if (effectiveTenantId) {
        tenantModules = await prisma.tenantModule.findMany({
          where: { tenantId: effectiveTenantId, isEnabled: true },
          include: { module: true },
          orderBy: { createdAt: 'asc' }
        })

        const tenantRecord = await prisma.tenant.findUnique({
          where: { id: effectiveTenantId },
          select: { clinicCategoryId: true, clinicCategory: { select: { name: true } } }
        })
        categoryName = tenantRecord?.clinicCategory?.name || ''
        if (tenantRecord?.clinicCategoryId) {
          const cms = await prisma.clinicCategoryModule.findMany({
            where: { clinicCategoryId: tenantRecord.clinicCategoryId },
            select: { moduleId: true, displayOrder: true }
          })
          categoryModuleOrderMap = new Map(cms.map((c) => [c.moduleId, c.displayOrder]))
        }
      }

      // If tenant has configured TenantModule rows, build result STRICTLY from enabled modules!
      if (tenantModules && tenantModules.length > 0) {
        const result = tenantModules.map((tm) => {
          const m = tm.module
          const meta = MODULE_METADATA[m.key] || {}
          const name = meta.name || m.name
          const icon = meta.icon || 'Boxes'
          let route = meta.route || `/app/staff/${m.key}`
          if (m.key === 'implant_registry' && categoryName?.toLowerCase().includes('cardio')) {
            route = '/app/cardio/implants'
          }
          const order = categoryModuleOrderMap.get(m.id) ?? meta.defaultOrder ?? 50

          if (isAdminRole) {
            // Clinic Admin gets full access on all category-enabled modules
            return {
              id: `perm-${dbRole?.id || resolvedId}-${m.id}`,
              role_id: dbRole?.id || resolvedId,
              module_id: m.id,
              module_key: m.key,
              module_name: name,
              module_icon: icon,
              module_route: route,
              display_order: order,
              can_view: true,
              can_edit: true,
              can_delete: true,
            }
          }

          // Staff roles: check against rolePerms
          const permsForModule = (dbRole?.rolePerms || []).filter(
            (rp) => rp.permission?.moduleId === m.id || rp.permission?.module?.key === m.key
          )
          const can_view = permsForModule.some(
            (rp) => rp.permission?.action?.key === 'view' || rp.permission?.key?.endsWith('.view')
          )
          const can_edit = permsForModule.some((rp) => {
            const act = rp.permission?.action?.key || ''
            return act === 'create' || act === 'edit' || rp.permission?.key?.endsWith('.create') || rp.permission?.key?.endsWith('.edit')
          })
          const can_delete = permsForModule.some(
            (rp) => rp.permission?.action?.key === 'delete' || rp.permission?.key?.endsWith('.delete')
          )

          return {
            id: `perm-${dbRole?.id || resolvedId}-${m.id}`,
            role_id: dbRole?.id || resolvedId,
            module_id: m.id,
            module_key: m.key,
            module_name: name,
            module_icon: icon,
            module_route: route,
            display_order: order,
            can_view,
            can_edit,
            can_delete,
          }
        })

        result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

        if (canViewOnly) {
          return result.filter((p) => p.can_view === true)
        }
        return result
      }
    } catch (dbErr) {
      logger.warn(`Database query in getPermissionsByRole fallback: ${dbErr.message}`)
    }

    // In-memory fallback
    const rolePermMap = memoryPermissions.get(resolvedId) || memoryPermissions.get(String(roleIdentifier).toLowerCase()) || {}

    const result = DEFAULT_MODULES.map(m => {
      const flags = rolePermMap[m.id] || { can_view: false, can_edit: false, can_delete: false }
      return {
        id: `perm-${resolvedId}-${m.id}`,
        role_id: resolvedId,
        module_id: m.id,
        module_key: m.key,
        module_name: m.name,
        module_icon: m.icon,
        module_route: m.route,
        display_order: m.displayOrder,
        can_view: Boolean(flags.can_view),
        can_edit: Boolean(flags.can_edit),
        can_delete: Boolean(flags.can_delete)
      }
    })

    if (canViewOnly) {
      return result.filter(p => p.can_view === true)
    }

    return result
  }

  /**
   * Bulk save permissions for a role
   * Payload: roleId, permissions: [ { moduleId / module_id, can_view, can_edit, can_delete } ]
   */
  static async savePermissions(roleIdentifier, permissionsList = []) {
    initMemoryStore()
    const resolvedId = this.resolveRoleId(roleIdentifier)

    let rolePermMap = memoryPermissions.get(resolvedId)
    if (!rolePermMap) {
      rolePermMap = {}
      memoryPermissions.set(resolvedId, rolePermMap)
    }

    // Update in-memory store immediately
    for (const item of permissionsList) {
      const modId = item.moduleId || item.module_id
      if (modId) {
        rolePermMap[modId] = {
          can_view: Boolean(item.can_view ?? item.canView),
          can_edit: Boolean(item.can_edit ?? item.canEdit),
          can_delete: Boolean(item.can_delete ?? item.canDelete)
        }
      }
    }

    // Attempt to persist to PostgreSQL
    try {
      for (const item of permissionsList) {
        const modId = item.moduleId || item.module_id
        if (!modId) continue
        const canView = Boolean(item.can_view ?? item.canView)
        const canEdit = Boolean(item.can_edit ?? item.canEdit)
        const canDelete = Boolean(item.can_delete ?? item.canDelete)

        await prisma.$executeRaw`
          INSERT INTO permissions (role_id, module_id, can_view, can_edit, can_delete, updated_at)
          VALUES (${resolvedId}::uuid, ${modId}::uuid, ${canView}, ${canEdit}, ${canDelete}, NOW())
          ON CONFLICT (role_id, module_id)
          DO UPDATE SET 
            can_view = EXCLUDED.can_view,
            can_edit = EXCLUDED.can_edit,
            can_delete = EXCLUDED.can_delete,
            updated_at = NOW();
        `
      }
    } catch (e) {
      logger.warn(`PostgreSQL permissions save skipped/offline: ${e.message}`)
    }

    // Broadcast permission invalidation event to Redis / WebSockets for live instant client update
    try {
      pubsub.publish('permissions:invalidate', JSON.stringify({
        type: 'ROLE_PERMISSIONS_UPDATED',
        roleId: resolvedId,
        timestamp: Date.now()
      }))
    } catch {}

    // Return the updated permissions list for confirmation
    return this.getPermissionsByRole(resolvedId)
  }
}

export default RbacModuleService
