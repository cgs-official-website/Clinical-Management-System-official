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
 * Builds a readable sentence description from real data only
 */
export const buildDescription = (log, actorName, actorRole) => {
  const actionUpper = String(log.action || '').toUpperCase()
  const entityType = log.entityType || 'record'
  const actorLabel = `${actorName} (${actorRole})`

  // 1. Check for updated fields array
  if (log.afterState && typeof log.afterState === 'object') {
    const fields = log.afterState.updatedFields || log.afterState.keysUpdated || log.afterState.fields
    if (Array.isArray(fields) && fields.length > 0) {
      return `${actorLabel} updated ${entityType}: ${fields.join(', ')}`
    }
  }

  // 2. Verb determination
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

  // 3. Name or role name if available
  if (log.afterState?.name) {
    return `${actorLabel} ${verb} ${entityType} "${log.afterState.name}"`
  }
  if (log.afterState?.roleName) {
    return `${actorLabel} ${verb} ${entityType} "${log.afterState.roleName}"`
  }
  if (typeof log.afterState?.details === 'string') {
    return `${actorLabel}: ${log.afterState.details}`
  }

  // 4. Fallback readable verb sentence
  return `${actorLabel} ${verb} ${entityType}`
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

      return await prisma.auditLog.create({
        data: {
          tenantId: validTenantId,
          actorUserId: validActorId,
          action,
          entityType,
          entityId: entityId ? String(entityId) : null,
          afterState: details ? (typeof details === 'object' ? details : { details }) : null,
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

    if (from || to) {
      where.createdAt = {}
      if (from) {
        const fromDate = new Date(from)
        if (!isNaN(fromDate.getTime())) {
          if (typeof from === 'string' && from.length === 10) {
            fromDate.setUTCHours(0, 0, 0, 0)
          }
          where.createdAt.gte = fromDate
        }
      }
      if (to) {
        const toDate = new Date(to)
        if (!isNaN(toDate.getTime())) {
          if (typeof to === 'string' && to.length === 10) {
            toDate.setUTCHours(23, 59, 59, 999)
          }
          where.createdAt.lte = toDate
        }
      }
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
    from = null,
    to = null,
    search = null,
    sort = 'desc',
    page = 1,
    limit = 20
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
    const skip = (pageNum - 1) * limitNum

    const where = this.buildWhereClause({
      tenantId,
      clinicId,
      actorId,
      entityType,
      module,
      action,
      role,
      from,
      to,
      search
    })

    const sortOrder = sort === 'asc' ? 'asc' : 'desc'

    // Server's UTC start of day
    const todayUtc = new Date()
    todayUtc.setUTCHours(0, 0, 0, 0)

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
      // Today's activity since 00:00 UTC
      prisma.auditLog.count({
        where: {
          ...(effectiveTenantId && effectiveTenantId !== 'ALL' ? { tenantId: effectiveTenantId } : {}),
          createdAt: { gte: todayUtc }
        }
      }),
      // Security alerts count
      prisma.auditLog.count({
        where: {
          ...(effectiveTenantId && effectiveTenantId !== 'ALL' ? { tenantId: effectiveTenantId } : {}),
          OR: SECURITY_ALERT_CONDITIONS.prismaOr
        }
      }),
      // Count of distinct actors in the filtered range
      prisma.auditLog.findMany({
        where: {
          ...where,
          actorUserId: { not: null }
        },
        distinct: ['actorUserId'],
        select: { actorUserId: true }
      }),
      // Actual paginated data
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: sortOrder },
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

    // Determine actor role
    let actorRole = 'SYSTEM'
    if (log.actor) {
      if (log.actor.userType === 'SUPERADMIN') actorRole = 'SUPERADMIN'
      else if (log.actor.userType === 'ADMIN') actorRole = 'ADMIN'
      else if (log.actor.userRoles && log.actor.userRoles.length > 0 && log.actor.userRoles[0]?.role?.name) {
        actorRole = log.actor.userRoles[0].role.name
      } else {
        actorRole = log.actor.userType || 'STAFF'
      }
    } else if (log.actorUserId) {
      actorRole = 'STAFF'
    }

    const actorName = log.actor?.fullName || (log.actorUserId ? 'Admin User' : 'System')
    const actorEmail = log.actor?.email || (log.actorUserId ? 'admin@clinic.io' : 'system@clinic.io')
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
      let actorRole = 'SYSTEM'
      if (log.actor) {
        if (log.actor.userType === 'SUPERADMIN') actorRole = 'SUPERADMIN'
        else if (log.actor.userType === 'ADMIN') actorRole = 'ADMIN'
        else if (log.actor.userRoles && log.actor.userRoles.length > 0 && log.actor.userRoles[0]?.role?.name) {
          actorRole = log.actor.userRoles[0].role.name
        } else {
          actorRole = log.actor.userType || 'STAFF'
        }
      } else if (log.actorUserId) {
        actorRole = 'STAFF'
      }

      const actorName = log.actor?.fullName || (log.actorUserId ? 'Admin User' : 'System')
      const actorEmail = log.actor?.email || (log.actorUserId ? 'admin@clinic.io' : 'system@clinic.io')
      const description = buildDescription(log, actorName, actorRole)

      const dateObj = new Date(log.createdAt)
      const formattedTimestamp = !isNaN(dateObj.getTime())
        ? dateObj.toISOString().replace('T', ' ').substring(0, 19)
        : String(log.createdAt)

      return {
        Timestamp: formattedTimestamp,
        Actor: actorName,
        Email: actorEmail,
        Role: actorRole,
        Action: log.action,
        Module: log.entityType || 'General',
        Description: description,
        Clinic: log.tenant?.name || 'System-Wide',
        IP: normalizeIp(log.ip),
        Device: formatDevice(log.userAgent)
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs')
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }
}

export default AuditService
