import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'

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
      return await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: actorId,
          action,
          entityType,
          entityId: entityId ? String(entityId) : null,
          afterState: details ? (typeof details === 'object' ? details : { details }) : null,
          ip: ipAddress
        }
      })
    } catch (err) {
      logger.error(`Failed to record audit log: ${err.message}`, { action, entityType, entityId })
      return null
    }
  }

  /**
   * Retrieve paginated audit logs with filtering
   */
  static async getLogs({ tenantId = null, actorId = null, entityType = null, page = 1, limit = 20 } = {}) {
    const where = {}
    if (tenantId) where.tenantId = tenantId
    if (actorId) where.actorUserId = actorId
    if (entityType) where.entityType = entityType

    const skip = (Math.max(1, page) - 1) * limit

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      })
    ])

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

export default AuditService
