import XLSX from 'xlsx'
import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'
import { getRequestContext, normalizeIp, formatDevice } from '../utils/requestContext.js'

export const SECURITY_ALERT_CONDITIONS = {
  definition: 'Deletions, suspensions, rejections, and role or permission changes',
  prismaOr: [
    { action: { contains: 'DELETE', mode: 'insensitive' } },
    { action: { contains: 'REMOVED', mode: 'insensitive' } },
    { action: { contains: 'SUSPEND', mode: 'insensitive' } },
    { action: { contains: 'REJECT', mode: 'insensitive' } },
    { action: { contains: 'DECOMMISSION', mode: 'insensitive' } },
    { action: { contains: 'PERMISSION', mode: 'insensitive' } },
    { action: { contains: 'ROLE', mode: 'insensitive' } }
  ]
}

/**
 * Categorizes an action into CREATE, UPDATE, DELETE, LOGIN, or OTHER
 */
export const deriveActionType = (action = '') => {
  const act = String(action).toUpperCase()
  if (act.includes('CREATE') || act.includes('INVITED') || act.includes('PROVISION')) {
    return 'CREATE'
  }
  if (act.includes('UPDATE') || act.includes('MODIFIED') || act.includes('CHANGE') || act.includes('ASSIGN')) {
    return 'UPDATE'
  }
  if (act.includes('DELETE') || act.includes('REMOVED') || act.includes('DECOMMISSION') || act.includes('REJECT') || act.includes('SUSPEND')) {
    return 'DELETE'
  }
  if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('LOGOUT')) {
    return 'LOGIN'
  }
  return 'OTHER'
}

/**
 * Strips sensitive fields recursively from state objects
 */
export const stripSensitiveFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripSensitiveFields)
  const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'password_hash',
    'token',
    'refreshtoken',
    'refresh_token',
    'accesstoken',
    'access_token',
    'otp',
    'secret',
    'clientsecret',
    'client_secret',
    'authorization'
  ])
  const cleaned = {}
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      continue
    }
    if (val !== null && typeof val === 'object') {
      cleaned[key] = stripSensitiveFields(val)
    } else {
      cleaned[key] = val
    }
  }
  return cleaned
}

/**
 * Resolves actor name, email, and role consistently without fake fallback names
 */
export const resolveActorInfo = (log) => {
  let actorRole = 'SYSTEM'
  let actorName = 'System'
  let actorEmail = '—'

  if (log?.actor) {
    actorName = log.actor.fullName || 'User'
    actorEmail = log.actor.email || '—'
    if (log.actor.userType === 'SUPERADMIN') actorRole = 'SUPERADMIN'
    else if (log.actor.userType === 'ADMIN') actorRole = 'ADMIN'
    else if (log.actor.userRoles && log.actor.userRoles.length > 0 && log.actor.userRoles[0]?.role?.name) {
      actorRole = log.actor.userRoles[0].role.name
    } else {
      actorRole = log.actor.userType || 'STAFF'
    }
  } else if (log?.actorUserId) {
    const shortId = String(log.actorUserId).length > 8 ? log.actorUserId.slice(0, 8) : log.actorUserId
    actorName = `Deleted user (${shortId})`
    actorEmail = `deleted (${shortId})`
    actorRole = 'DELETED'
  }

  return { actorName, actorEmail, actorRole }
}

/**
 * Builds a readable sentence description from real data only
 */
export const buildDescription = (log, actorName, actorRole) => {
  try {
    if (!log) return ''
    const actionUpper = String(log.action || '').toUpperCase()
    const entityType = log.entityType || 'record'
    const actorLabel = `${actorName || 'System'} (${actorRole || 'SYSTEM'})`

    // Verb determination
    let verb = 'modified'
    if (actionUpper.includes('INVITED')) verb = 'invited'
    else if (actionUpper.includes('CREATE') || actionUpper.includes('PROVISION')) verb = 'created'
    else if (actionUpper.includes('SUSPEND')) verb = 'suspended'
    else if (actionUpper.includes('REJECT')) verb = 'rejected'
    else if (actionUpper.includes('DECOMMISSION')) verb = 'decommissioned'
    else if (actionUpper.includes('DELETE') || actionUpper.includes('REMOVE')) verb = 'deleted'
    else if (actionUpper.includes('ASSIGN')) verb = 'assigned'
    else if (actionUpper.includes('UPDATE')) verb = 'updated'
    else if (actionUpper.includes('LOGIN')) verb = 'authenticated via'

    const after = log.afterState && typeof log.afterState === 'object' ? log.afterState : null
    const before = log.beforeState && typeof log.beforeState === 'object' ? log.beforeState : null

    // 1. If explicit details string
    if (typeof after?.details === 'string') {
      return `${actorLabel} ${verb} ${entityType}: ${after.details}`
    }

    // 2. Check for explicit updatedFields/keysUpdated/fields
    if (after) {
      const updatedFields = after.updatedFields || after.keysUpdated || after.fields
      if (Array.isArray(updatedFields) && updatedFields.length > 0) {
        const fieldDetails = updatedFields
          .map((f) => {
            if (after[f] !== undefined && after[f] !== null) {
              const valStr = typeof after[f] === 'object' ? '{…}' : String(after[f]).slice(0, 40)
              return `${f} (${valStr})`
            }
            return f
          })
          .join(', ')
        return `${actorLabel} updated ${entityType}: ${fieldDetails}`
      }
    }

    // 3. Primary label preference
    const state = after || before || {}
    let primaryLabel = null
    const PRIMARY_KEYS = ['fullName', 'name', 'roleName', 'categoryName', 'email', 'mrn', 'title']
    for (const pk of PRIMARY_KEYS) {
      if (state[pk] && typeof state[pk] === 'string' && state[pk].trim()) {
        primaryLabel = state[pk].trim()
        break
      }
    }

    // 4. Collect up to 4 other scalar key: value pairs
    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str))
    const SKIP_KEYS = new Set([
      'updatedfields',
      'keysupdated',
      'fields',
      'password',
      'token',
      'otp',
      'secret',
      'id',
      'createdat',
      'updatedat'
    ])

    const entries = []
    let uuidFallback = null

    for (const [key, val] of Object.entries(state)) {
      if (val === null || val === undefined || val === '') continue
      const lowerKey = key.toLowerCase()
      if (SKIP_KEYS.has(lowerKey)) continue
      if (primaryLabel && state[key] === primaryLabel) continue

      if (typeof val === 'string' && isUuid(val)) {
        if (!uuidFallback) uuidFallback = `${key}: ${val.slice(0, 8)}…`
        continue
      }

      if (Array.isArray(val)) {
        if (val.length === 0) continue
        const joined = val.map((v) => (typeof v === 'object' ? '{…}' : String(v))).join(', ')
        const truncated = joined.length > 40 ? joined.slice(0, 37) + '…' : joined
        entries.push(`${key}: [${truncated}]`)
      } else if (typeof val === 'object') {
        entries.push(`${key}: {…}`)
      } else {
        const valStr = String(val)
        const truncated = valStr.length > 40 ? valStr.slice(0, 37) + '…' : valStr
        entries.push(`${key}: ${truncated}`)
      }

      if (entries.length >= 4) break
    }

    if (entries.length === 0 && !primaryLabel && uuidFallback) {
      entries.push(uuidFallback)
    }

    let result = `${actorLabel} ${verb} ${entityType}`
    if (primaryLabel) {
      result += ` "${primaryLabel}"`
    }
    if (entries.length > 0) {
      result += ` (${entries.join(', ')})`
    }
    return result
  } catch (err) {
    return `${actorName || 'User'} performed ${log?.action || 'action'} on ${log?.entityType || 'record'}`
  }
}

export class AuditService {
  /**
   * Record an audit log entry
   */
  static async log({
    tenantId = null,
    actorId = null,
    action,
    entityType,
    entityId = null,
    details = null,
    beforeState = null,
    ipAddress = null,
    userAgent = null
  }) {
    try {
      const ctx = getRequestContext()
      const resolvedIp = ipAddress || ctx.ip || null
      const resolvedUserAgent = userAgent || ctx.userAgent || null

      // Validate actorId is a valid existing UUID in DB or null
      let validActorId = actorId
      if (validActorId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(validActorId)
        if (!isUuid) {
          validActorId = null
        } else {
          const userExists = await prisma.user.findUnique({
            where: { id: validActorId },
            select: { id: true }
          }).catch(() => null)
          if (!userExists) validActorId = null
        }
      }

      // Validate tenantId is a valid existing UUID in DB or null
      let validTenantId = tenantId
      if (validTenantId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(validTenantId)
        if (!isUuid) {
          validTenantId = null
        } else {
          const tenantExists = await prisma.tenant.findUnique({
            where: { id: validTenantId },
            select: { id: true }
          }).catch(() => null)
          if (!tenantExists) validTenantId = null
        }
      }

      const rawAfter = details ? (typeof details === 'object' ? details : { details }) : null
      const rawBefore = beforeState ? (typeof beforeState === 'object' ? beforeState : { beforeState }) : null

      return await prisma.auditLog.create({
        data: {
          tenantId: validTenantId,
          actorUserId: validActorId,
          action,
          entityType,
          entityId: entityId ? String(entityId) : null,
          beforeState: stripSensitiveFields(rawBefore),
          afterState: stripSensitiveFields(rawAfter),
          ip: resolvedIp ? normalizeIp(resolvedIp) : null,
          userAgent: resolvedUserAgent
        }
      })
    } catch (err) {
      logger.error(`Failed to record audit log: ${err.message}`, { action, entityType, entityId })
      return null
    }
  }

  /**
   * Builds the Prisma where clause from filter parameters
   */
  static buildWhereClause({
    tenantId = null,
    clinicId = null,
    actorId = null,
    entityType = null,
    module = null,
    action = null,
    role = null,
    period = null,
    from = null,
    to = null,
    search = null
  }) {
    const where = {}

    const effectiveTenantId = tenantId || clinicId
    if (effectiveTenantId && effectiveTenantId !== 'ALL') {
      where.tenantId = effectiveTenantId
    }

    if (actorId && actorId !== 'ALL') {
      where.actorUserId = actorId
    }

    const effectiveModule = module || entityType
    if (effectiveModule && effectiveModule !== 'ALL') {
      where.entityType = { equals: effectiveModule, mode: 'insensitive' }
    }

    if (action && action !== 'ALL') {
      where.action = { equals: action, mode: 'insensitive' }
    }

    if (role && role !== 'ALL') {
      where.actor = {
        userType: role
      }
    }

    // Time period and date filtering
    // When period is 'ALL', explicitly ensure NO date filters are applied (full history)
    if (period === 'ALL') {
      // Intentionally no createdAt filter
    } else if (period === 'TODAY' && !from && !to) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      where.createdAt = { gte: todayStart, lte: todayEnd }
    } else if (period === '7D' && !from && !to) {
      const past = new Date()
      past.setDate(past.getDate() - 7)
      past.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      where.createdAt = { gte: past, lte: todayEnd }
    } else if (period === '30D' && !from && !to) {
      const past = new Date()
      past.setDate(past.getDate() - 30)
      past.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      where.createdAt = { gte: past, lte: todayEnd }
    } else if (from || to) {
      where.createdAt = {}
      let fromDate = null
      let toDate = null
      if (from) {
        fromDate = new Date(from)
        if (!isNaN(fromDate.getTime())) {
          if (typeof from === 'string' && from.length === 10) {
            fromDate.setHours(0, 0, 0, 0)
          }
        } else {
          fromDate = null
        }
      }
      if (to) {
        toDate = new Date(to)
        if (!isNaN(toDate.getTime())) {
          if (typeof to === 'string' && to.length === 10) {
            toDate.setHours(23, 59, 59, 999)
          }
        } else {
          toDate = null
        }
      }
      if (fromDate && toDate && fromDate > toDate) {
        const tmp = fromDate
        fromDate = toDate
        toDate = tmp
      }
      if (fromDate) where.createdAt.gte = fromDate
      if (toDate) where.createdAt.lte = toDate
      if (!fromDate && !toDate) delete where.createdAt
    }

    if (search && search.trim()) {
      const s = search.trim()
      where.OR = [
        { action: { contains: s, mode: 'insensitive' } },
        { entityType: { contains: s, mode: 'insensitive' } },
        { actor: { fullName: { contains: s, mode: 'insensitive' } } },
        { actor: { email: { contains: s, mode: 'insensitive' } } },
        { tenant: { name: { contains: s, mode: 'insensitive' } } }
      ]
    }

    return where
  }

  /**
   * Retrieve paginated audit logs with server-side filtering and real stats
   */
  static async getLogs({
    tenantId = null,
    clinicId = null,
    actorId = null,
    entityType = null,
    module = null,
    action = null,
    role = null,
    period = null,
    from = null,
    to = null,
    search = null,
    sort = 'desc',
    page = 1,
    limit = 10
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10))
    const skip = (pageNum - 1) * limitNum

    const where = this.buildWhereClause({
      tenantId,
      clinicId,
      actorId,
      entityType,
      module,
      action,
      role,
      period,
      from,
      to,
      search
    })

    const sortOrder = sort === 'asc' ? 'asc' : 'desc'

    // Local / facility start and end of day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const effectiveTenantId = tenantId || clinicId

    const [
      totalRecords,
      filteredRecords,
      todaysActivity,
      securityAlerts,
      distinctActors,
      rawLogs
    ] = await Promise.all([
      // Total unfiltered records (scoped to tenant if tenant-restricted)
      prisma.auditLog.count({
        where: effectiveTenantId && effectiveTenantId !== 'ALL' ? { tenantId: effectiveTenantId } : {}
      }),
      // Filtered records count matching query
      prisma.auditLog.count({ where }),
      // Today's activity across facility
      prisma.auditLog.count({
        where: {
          ...(effectiveTenantId && effectiveTenantId !== 'ALL' ? { tenantId: effectiveTenantId } : {}),
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      // Security alerts count
      prisma.auditLog.count({
        where: {
          ...(effectiveTenantId && effectiveTenantId !== 'ALL' ? { tenantId: effectiveTenantId } : {}),
          OR: SECURITY_ALERT_CONDITIONS.prismaOr
        }
      }),
      // Count of distinct actors in the filtered range using groupBy
      prisma.auditLog.groupBy({
        by: ['actorUserId'],
        where: {
          ...where,
          actorUserId: { not: null }
        }
      }),
      // Actual paginated data with stable secondary sort
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { createdAt: sortOrder },
          { id: sortOrder }
        ],
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              userType: true,
              userRoles: {
                include: {
                  role: { select: { name: true } }
                }
              }
            }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      })
    ])

    const logs = rawLogs.map((log) => this.formatRecord(log))

    const stats = {
      totalRecords,
      filteredRecords,
      todaysActivity,
      todaysActivityLabel: 'Since 00:00 UTC',
      securityAlerts,
      securityAlertsDefinition: SECURITY_ALERT_CONDITIONS.definition,
      activeActors: distinctActors.length,
      activeActorsLabel: 'Distinct operators performing actions'
    }

    return {
      data: logs,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredRecords,
        totalPages: Math.ceil(filteredRecords / limitNum) || 1
      },
      stats
    }
  }

  /**
   * Normalize and format a single audit log record consistently
   */
  static formatRecord(log) {
    if (!log) return null

    const { actorName, actorEmail, actorRole } = resolveActorInfo(log)
    const actionType = deriveActionType(log.action)
    const description = buildDescription(log, actorName, actorRole)
    const dateObj = new Date(log.createdAt)
    const timestampIso = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : String(log.createdAt)

    return {
      id: log.id,
      timestamp: timestampIso,
      createdAt: log.createdAt,
      actorName,
      actorEmail,
      actorRole,
      action: log.action,
      actionType,
      module: log.entityType || 'General',
      entityType: log.entityType || null,
      entityId: log.entityId || null,
      description,
      clinicName: log.tenant?.name || 'Platform',
      tenantId: log.tenantId,
      ipAddress: log.ip ? normalizeIp(log.ip) : null,
      device: formatDevice(log.userAgent),
      userAgent: log.userAgent || null,
      payload: log.afterState || log.beforeState || null,
      beforeState: log.beforeState || null,
      afterState: log.afterState || null
    }
  }

  /**
   * Retrieve a single audit log entry by ID
   */
  static async getLogById(id) {
    if (!id) return null
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
            userRoles: {
              include: {
                role: { select: { name: true } }
              }
            }
          }
        },
        tenant: {
          select: { id: true, name: true }
        }
      }
    })

    if (!log) return null
    return this.formatRecord(log)
  }

  /**
   * Retrieve distinct filter values computed directly from database
   */
  static async getFilterOptions() {
    const [modulesRaw, actionsRaw, tenantsRaw, usersRaw] = await Promise.all([
      prisma.auditLog.findMany({
        distinct: ['entityType'],
        select: { entityType: true },
        orderBy: { entityType: 'asc' }
      }),
      prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' }
      }),
      prisma.auditLog.findMany({
        where: { tenantId: { not: null } },
        distinct: ['tenantId'],
        select: {
          tenant: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.auditLog.findMany({
        where: { actorUserId: { not: null } },
        distinct: ['actorUserId'],
        select: {
          actor: {
            select: { userType: true }
          }
        }
      })
    ])

    const modules = modulesRaw.map((m) => m.entityType).filter(Boolean)
    const actions = actionsRaw.map((a) => a.action).filter(Boolean)
    const clinics = tenantsRaw
      .map((t) => t.tenant)
      .filter(Boolean)
      .map((t) => ({ id: t.id, name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const distinctRoles = Array.from(
      new Set(
        usersRaw
          .map((u) => u.actor?.userType)
          .filter(Boolean)
      )
    ).sort()

    return {
      modules,
      actions,
      clinics,
      roles: distinctRoles.length > 0 ? distinctRoles : ['SUPERADMIN', 'ADMIN', 'STAFF']
    }
  }

  /**
   * Exports all matching audit logs as an Excel (.xlsx) Buffer
   */
  static async exportLogsToExcel(filters = {}) {
    const where = this.buildWhereClause(filters)
    const sortOrder = filters.sort === 'asc' ? 'asc' : 'desc'

    // Fetch matching logs without pagination (capped at 5000 to protect server memory)
    const rawLogs = await prisma.auditLog.findMany({
      where,
      take: 5000,
      orderBy: { createdAt: sortOrder },
      include: {
        actor: {
          select: {
            fullName: true,
            email: true,
            userType: true,
            userRoles: {
              include: {
                role: { select: { name: true } }
              }
            }
          }
        },
        tenant: {
          select: { name: true }
        }
      }
    })

    const rows = rawLogs.map((log) => {
      const { actorName, actorEmail, actorRole } = resolveActorInfo(log)
      const description = buildDescription(log, actorName, actorRole)

      const dateObj = new Date(log.createdAt)
      const formattedTimestamp = !isNaN(dateObj.getTime())
        ? dateObj.toISOString().replace('T', ' ').substring(0, 19)
        : String(log.createdAt)

      const state = log.afterState || log.beforeState || {}
      const details = typeof state === 'string' ? state : JSON.stringify(state)

      return {
        Timestamp: formattedTimestamp,
        Actor: actorName,
        Email: actorEmail,
        Role: actorRole,
        Action: log.action,
        Module: log.entityType || 'General',
        'Entity ID': log.entityId || '—',
        Description: description,
        Details: details,
        'IP Address': log.ip ? normalizeIp(log.ip) : '—',
        Device: formatDevice(log.userAgent),
        Clinic: log.tenant?.name || 'System-Wide'
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs')
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }
}

export default AuditService
