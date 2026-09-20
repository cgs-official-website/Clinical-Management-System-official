import { prisma } from '../config/prisma.js'
import { redis, pubsub } from '../config/redis.js'
import { logger } from '../utils/logger.js'
import { DEMO_ACCOUNTS } from '../constants/demoAccounts.js'

const PERM_CACHE_TTL = 300 // 5 minutes

export const CLINIC_ADMIN_PERMISSIONS = [
  'patients.*',
  'appointments.*',
  'prescriptions.*',
  'billing.*',
  'inventory.*',
  'staff.*',
  'roles.*',
  'reports.*',
  'clinical_config.*',
  'settings.*',
  'patients.view', 'patients.create', 'patients.edit', 'patients.delete', 'patients.export',
  'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.export',
  'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.delete', 'prescriptions.export',
  'billing.view', 'billing.create', 'billing.edit', 'billing.delete', 'billing.export',
  'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.export',
  'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.export',
  'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
  'reports.view', 'reports.export',
  'clinical_config.view', 'clinical_config.edit',
  'settings.view', 'settings.edit',
]

export class RbacService {
  /**
   * Computes the merged union of effective permissions across all roles assigned to the user
   */
  static async getEffectivePermissions(userId, userEmail = null) {
    if (!userId && !userEmail) return { permissions: [], roles: [] }

    const cacheKey = `perms:${userId || userEmail}`
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached
      }
    } catch (e) {
      logger.warn(`Redis get cache error: ${e.message}`)
    }

    try {
      let user = null

      // 1. Try finding by userId
      if (userId) {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { email: { equals: userId, mode: 'insensitive' } }
            ]
          },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePerms: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }).catch(() => null)
      }

      // 2. If not found, try finding by userEmail
      if (!user && userEmail) {
        user = await prisma.user.findFirst({
          where: { email: { equals: userEmail, mode: 'insensitive' } },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePerms: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }).catch(() => null)
      }

      if (!user) {
        // Check demo accounts fallback with comprehensive ID & alias resolution
        const demoAccount =
          DEMO_ACCOUNTS[userId] ||
          (userEmail && DEMO_ACCOUNTS[userEmail.toLowerCase()]) ||
          Object.values(DEMO_ACCOUNTS).find((d) =>
            d.id === userId ||
            (userEmail && d.email?.toLowerCase() === userEmail.toLowerCase()) ||
            (typeof userId === 'string' && (
              d.email?.toLowerCase() === userId.toLowerCase() ||
              (userId === 'staff-1' && (d.role === 'DOCTOR' || d.roleTitle?.includes('Physician'))) ||
              (userId === 'staff-2' && (d.role === 'RECEPTIONIST' || d.roleTitle?.includes('Reception'))) ||
              (userId === 'staff-3' && (d.role === 'NURSE' || d.roleTitle?.includes('Nurse'))) ||
              (userId === 'staff-4' && (d.role === 'BILLER' || d.roleTitle?.includes('Biller')))
            ))
          )

        if (demoAccount) {
          return {
            userId: userId || demoAccount.id,
            roles: demoAccount.roles || [demoAccount.role || 'STAFF'],
            permissions: demoAccount.permissions || ['*']
          }
        }
        return { permissions: [], roles: [] }
      }

      const roleNames = []
      const permSet = new Set()

      // Superadmin wildcard check
      if (user.userType === 'SUPERADMIN' || user.isSuperadmin) {
        permSet.add('*')
        if (!roleNames.includes('SUPERADMIN')) roleNames.push('SUPERADMIN')
      }

      // Clinic Admin permissions: full access to clinic operations, staff, roles, and config
      if (user.userType === 'ADMIN' || user.isAdmin) {
        if (!roleNames.includes('ADMIN')) roleNames.push('ADMIN')
        for (const p of CLINIC_ADMIN_PERMISSIONS) {
          permSet.add(p)
        }
      }

      for (const ur of user.userRoles || []) {
        const role = ur.role
        if (!role) continue

        roleNames.push(role.name)
        const upperRole = (role.name || '').toUpperCase()
        if (upperRole.includes('SUPERADMIN')) {
          permSet.add('*')
        } else if (upperRole.includes('ADMIN')) {
          for (const p of CLINIC_ADMIN_PERMISSIONS) {
            permSet.add(p)
          }
        } else if (upperRole.includes('NURSE')) {
          ['patients.view', 'patients.create', 'patients.edit', 'appointments.view', 'prescriptions.view', 'inventory.view'].forEach(p => permSet.add(p))
        } else if (upperRole.includes('PHYSICIAN') || upperRole.includes('DOCTOR')) {
          ['patients.view', 'patients.edit', 'patients.export', 'appointments.view', 'appointments.create', 'appointments.edit', 'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.export', 'inventory.view', 'reports.view'].forEach(p => permSet.add(p))
        } else if (upperRole.includes('RECEPTION')) {
          ['patients.view', 'patients.create', 'patients.edit', 'appointments.view', 'appointments.create', 'appointments.edit', 'billing.view', 'billing.create', 'inventory.view', 'prescriptions.view'].forEach(p => permSet.add(p))
        } else if (upperRole.includes('BILLER') || upperRole.includes('BILLING')) {
          ['patients.view', 'billing.view', 'billing.create', 'billing.edit', 'billing.export', 'reports.view', 'reports.export', 'inventory.view', 'prescriptions.view'].forEach(p => permSet.add(p))
        } else if (upperRole.includes('PHARMACY') || upperRole.includes('STOCK')) {
          ['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.export', 'prescriptions.view', 'patients.view'].forEach(p => permSet.add(p))
        }

        for (const rp of role.rolePerms || role.rolePermissions || []) {
          const permKey = rp.permission?.key || rp.permission?.code
          if (permKey) {
            permSet.add(permKey)
          }
        }
      }

      // Filter effective permissions against TenantModule if configured for this clinic
      if (user.tenantId && user.userType !== 'SUPERADMIN' && !user.isSuperadmin) {
        try {
          const tenantModules = await prisma.tenantModule.findMany({
            where: { tenantId: user.tenantId, isEnabled: true },
            include: { module: true },
          })
          if (tenantModules && tenantModules.length > 0) {
            const allowedKeys = new Set(tenantModules.map((tm) => tm.module.key))
            allowedKeys.add('roles')
            allowedKeys.add('settings')

            const filteredPerms = Array.from(permSet).filter((p) => {
              if (p === '*') return false
              const modKey = p.split('.')[0]
              return allowedKeys.has(modKey)
            })

            if (user.userType === 'ADMIN' || user.isAdmin) {
              for (const key of allowedKeys) {
                filteredPerms.push(`${key}.*`)
                filteredPerms.push(`${key}.view`)
                filteredPerms.push(`${key}.create`)
                filteredPerms.push(`${key}.edit`)
                filteredPerms.push(`${key}.delete`)
              }
            }

            const result = {
              userId: user.id || userId,
              roles: roleNames,
              permissions: Array.from(new Set(filteredPerms)),
            }

            try {
              await redis.setex(cacheKey, PERM_CACHE_TTL, JSON.stringify(result))
            } catch (e) {
              logger.warn(`Redis set cache error: ${e.message}`)
            }

            return result
          }
        } catch (tmErr) {
          logger.warn(`TenantModule resolution error: ${tmErr.message}`)
        }
      }

      const result = {
        userId: user.id || userId,
        roles: roleNames,
        permissions: Array.from(permSet)
      }

      // Cache effective permissions
      try {
        await redis.setex(cacheKey, PERM_CACHE_TTL, JSON.stringify(result))
      } catch (e) {
        logger.warn(`Redis set cache error: ${e.message}`)
      }

      return result
    } catch (err) {
      logger.error(`Database error resolving permissions for user ${userId}: ${err.message}`)
      // Fallback return with demo check
      const demoAccount = Object.values(DEMO_ACCOUNTS).find(
        (d) => d.id === userId || d.email?.toLowerCase() === userId?.toLowerCase()
      )
      if (demoAccount) {
        return {
          userId,
          roles: demoAccount.roles || [demoAccount.role || 'ADMIN'],
          permissions: demoAccount.permissions || ['*']
        }
      }
      return { userId, roles: [], permissions: [] }
    }
  }

  /**
   * Check if a list of permission codes satisfies the required permission
   */
  static hasPermission(userPermissions = [], requiredPermission) {
    if (!requiredPermission) return true
    if (userPermissions.includes('*')) return true
    if (userPermissions.includes(requiredPermission)) return true

    // Check wildcard module matching e.g. 'patients.*'
    const [module] = requiredPermission.split('.')
    if (module && userPermissions.includes(`${module}.*`)) {
      return true
    }

    return false
  }

  /**
   * Check whether a given module key is enabled for the specified tenant in TenantModule
   */
  static async isModuleEnabledForTenant(tenantId, moduleKey) {
    if (!tenantId || !moduleKey) return true
    try {
      const tenantModulesCount = await prisma.tenantModule.count({
        where: { tenantId }
      })
      if (tenantModulesCount === 0) return true

      const tm = await prisma.tenantModule.findFirst({
        where: {
          tenantId,
          isEnabled: true,
          module: { key: moduleKey }
        }
      })
      return Boolean(tm)
    } catch {
      return true
    }
  }

  /**
   * Invalidate Redis cache for a specific user and broadcast real-time update
   */
  static async invalidateUserPermissions(userId) {
    if (!userId) return
    const cacheKey = `perms:${userId}`
    try {
      await redis.del(cacheKey)
      await pubsub.publish('permissions:invalidate', {
        type: 'INVALIDATE_USER',
        userId,
        timestamp: Date.now()
      })
      logger.info(`Invalidated permission cache for user ${userId}`)
    } catch (e) {
      logger.error(`Failed to invalidate cache for user ${userId}: ${e.message}`)
    }
  }

  /**
   * Invalidate Redis cache for all users assigned to a role
   */
  static async invalidateRolePermissions(roleId) {
    if (!roleId) return
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { roleId },
        select: { userId: true }
      })
      const userIds = userRoles.map(ur => ur.userId)

      for (const uid of userIds) {
        await redis.del(`perms:${uid}`)
      }

      await pubsub.publish('permissions:invalidate', {
        type: 'INVALIDATE_ROLE',
        roleId,
        userIds,
        timestamp: Date.now()
      })
      logger.info(`Invalidated permission cache for ${userIds.length} users with role ${roleId}`)
    } catch (e) {
      logger.error(`Failed to invalidate role permissions for ${roleId}: ${e.message}`)
    }
  }
}

export default RbacService
