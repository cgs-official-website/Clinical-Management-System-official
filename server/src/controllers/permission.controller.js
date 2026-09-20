import { RbacModuleService } from '../services/rbacModule.service.js'

export class PermissionController {
  /**
   * GET /api/permissions/:roleId
   * Query params: ?can_view=true (optional)
   */
  static async getPermissionsByRole(req, res, next) {
    try {
      const { roleId } = req.params
      const canViewOnly = req.query.can_view === 'true' || req.query.canView === 'true'
      const tenantId = req.user?.tenantId || req.query?.tenantId || null

      const permissions = await RbacModuleService.getPermissionsByRole(roleId, { tenantId, canViewOnly })

      return res.status(200).json({
        success: true,
        roleId,
        count: permissions.length,
        permissions,
        data: permissions
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/permissions
   * Body: { roleId / role_id, permissions: [ { moduleId, can_view, can_edit, can_delete } ] }
   */
  static async bulkSavePermissions(req, res, next) {
    try {
      const roleId = req.body.roleId || req.body.role_id
      const permissionsList = req.body.permissions || req.body.data || []

      if (!roleId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'roleId is required'
          }
        })
      }

      const updatedPermissions = await RbacModuleService.savePermissions(roleId, permissionsList)

      return res.status(200).json({
        success: true,
        message: 'Role permissions updated successfully',
        roleId,
        permissions: updatedPermissions,
        data: updatedPermissions
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/modules
   * List all system modules
   */
  static async getModules(req, res, next) {
    try {
      const modules = await RbacModuleService.getModules()
      return res.status(200).json({
        success: true,
        count: modules.length,
        modules,
        data: modules
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/roles
   * List all roles
   */
  static async getRoles(req, res, next) {
    try {
      const tenantId = req.user?.tenantId || req.query?.tenantId || null
      const roles = await RbacModuleService.getRoles(tenantId)
      return res.status(200).json({
        success: true,
        count: roles.length,
        roles,
        data: roles
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/permissions/user/me
   * Get effective permitted modules for currently logged-in user
   */
  static async getMyPermissions(req, res, next) {
    try {
      const user = req.user
      const isSuper = Boolean(user?.isSuperadmin || user?.is_super_admin || user?.userType === 'SUPERADMIN')

      if (isSuper) {
        const allModules = await RbacModuleService.getModules()
        const superPerms = allModules.map(m => ({
          id: `perm-super-${m.id}`,
          role_id: 'superadmin',
          module_id: m.id,
          module_name: m.name,
          module_icon: m.icon,
          module_route: m.route,
          can_view: true,
          can_edit: true,
          can_delete: true
        }))
        return res.status(200).json({
          success: true,
          is_super_admin: true,
          permissions: superPerms,
          permittedModules: allModules
        })
      }

      const roleId =
        user?.role_id ||
        user?.roleId ||
        user?.role ||
        (user?.isAdmin || user?.userType === 'ADMIN' ? 'admin' : '33333333-3333-3333-3333-333333333333')
      const tenantId = user?.tenantId || null
      const permissions = await RbacModuleService.getPermissionsByRole(roleId, { tenantId })
      const permittedModules = permissions
        .filter(p => p.can_view === true)
        .map(p => ({
          id: p.module_id,
          name: p.module_name,
          icon: p.module_icon,
          route: p.module_route,
          can_edit: p.can_edit,
          can_delete: p.can_delete
        }))

      return res.status(200).json({
        success: true,
        is_super_admin: false,
        roleId,
        permissions,
        permittedModules
      })
    } catch (error) {
      next(error)
    }
  }
}

export default PermissionController
