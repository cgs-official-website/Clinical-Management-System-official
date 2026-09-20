import { RbacService } from '../services/rbac.service.js'
import { UnauthorizedError } from '../utils/errors.js'

export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'))
      }

      // Superadmins bypass RBAC
      if (req.user.isSuperadmin || req.user.userType === 'SUPERADMIN') {
        req.userPermissions = ['*']
        return next()
      }

      // Category module isolation check for tenant users (including Clinic Admins)
      if (req.user.tenantId && permissionCode) {
        const [moduleKey] = permissionCode.split('.')
        const systemAdminModules = ['roles', 'settings', 'clinical_config']
        if (!systemAdminModules.includes(moduleKey)) {
          const isEnabled = await RbacService.isModuleEnabledForTenant(req.user.tenantId, moduleKey)
          if (!isEnabled) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'PERMISSION_DENIED',
                message: `The '${moduleKey}' module is not available for this clinic category`,
                required: permissionCode,
              },
            })
          }
        }
      }

      // Clinic Admins have full access to their clinic's enabled operations, staff, roles, and configuration
      if (req.user.isAdmin || req.user.userType === 'ADMIN' || (req.user.role && req.user.role.toUpperCase() === 'ADMIN')) {
        req.userPermissions = ['*']
        return next()
      }

      // If user object already carries permission payload directly (e.g. demo or verified session)
      if (Array.isArray(req.user.permissions) && (req.user.permissions.includes('*') || req.user.permissions.includes(permissionCode))) {
        req.userPermissions = req.user.permissions
        return next()
      }

      const { permissions } = await RbacService.getEffectivePermissions(req.user.id, req.user.email)
      
      // All authenticated clinical staff and admins are granted read-only inventory & prescription viewing for outpatient flow
      if ((permissionCode === 'inventory.view' || permissionCode === 'prescriptions.view') && (req.user.userType || req.user.role || req.user.roles?.length || req.user.email)) {
        req.userPermissions = permissions
        return next()
      }

      const granted = RbacService.hasPermission(permissions, permissionCode)

      if (!granted) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to perform this action',
            required: permissionCode
          }
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export const requireAnyPermission = (...permissionCodes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'))
      }

      if (req.user.isSuperadmin || req.user.userType === 'SUPERADMIN') {
        req.userPermissions = ['*']
        return next()
      }

      // Category module isolation check for tenant users
      if (req.user.tenantId && permissionCodes.length > 0) {
        const systemAdminModules = ['roles', 'settings', 'clinical_config']
        let hasAtLeastOneEnabled = false
        for (const code of permissionCodes) {
          const [mKey] = code.split('.')
          if (systemAdminModules.includes(mKey)) {
            hasAtLeastOneEnabled = true
            break
          }
          const isEnabled = await RbacService.isModuleEnabledForTenant(req.user.tenantId, mKey)
          if (isEnabled) {
            hasAtLeastOneEnabled = true
            break
          }
        }
        if (!hasAtLeastOneEnabled) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: 'Requested modules are not available for this clinic category',
              requiredAny: permissionCodes,
            },
          })
        }
      }

      if (req.user.isAdmin || req.user.userType === 'ADMIN' || (req.user.role && req.user.role.toUpperCase() === 'ADMIN')) {
        req.userPermissions = ['*']
        return next()
      }

      const { permissions } = await RbacService.getEffectivePermissions(req.user.id, req.user.email)
      req.userPermissions = permissions

      const granted = permissionCodes.some(code => RbacService.hasPermission(permissions, code))

      if (!granted) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to perform this action',
            requiredAny: permissionCodes
          }
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
