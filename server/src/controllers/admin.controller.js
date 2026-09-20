import { AdminService } from '../services/admin.service.js'
import { RoleTemplateService } from '../services/roleTemplate.service.js'

export class AdminController {
  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats(req.user?.tenantId)
      return res.status(200).json({
        success: true,
        ...stats,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  static async getModulesAndPermissions(req, res, next) {
    try {
      const data = await AdminService.getModulesAndPermissions()
      return res.status(200).json({
        success: true,
        modules: data.modules,
        actions: data.actions,
        permissions: data.permissions,
        data
      })
    } catch (error) {
      next(error)
    }
  }

  static async getRoles(req, res, next) {
    try {
      const tenantId = req.query.tenantId || req.user?.tenantId
      const department = req.query.department
      const roles = await AdminService.getRoles(tenantId, { department })
      return res.status(200).json({
        success: true,
        roles,
        data: roles,
        total: roles.length
      })
    } catch (error) {
      next(error)
    }
  }

  static async createRole(req, res, next) {
    try {
      const role = await AdminService.createRole({
        tenantId: req.user.tenantId,
        name: req.body.name,
        displayName: req.body.displayName,
        description: req.body.description,
        permissionCodes: req.body.permissions || [],
        actorId: req.user.id
      })
      return res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
        ...role
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateRolePermissions(req, res, next) {
    try {
      const { id } = req.params
      const { permissions } = req.body

      const updatedRole = await AdminService.updateRolePermissions({
        roleId: id,
        tenantId: req.user.tenantId,
        permissionCodes: permissions || [],
        actorId: req.user.id
      })

      return res.status(200).json({
        success: true,
        message: 'Role permissions updated and caches refreshed',
        data: updatedRole,
        ...updatedRole
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteRole(req, res, next) {
    try {
      const { id } = req.params
      const result = await AdminService.deleteRole(id, req.user.tenantId, req.user.id)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async assignRole(req, res, next) {
    try {
      const { id: roleId } = req.params
      const { userId } = req.body

      const updated = await AdminService.assignRoleToUser({
        roleId,
        userId,
        tenantId: req.user.tenantId,
        actorId: req.user.id
      })

      return res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
        data: updated
      })
    } catch (error) {
      next(error)
    }
  }

  static async unassignRole(req, res, next) {
    try {
      const { id: roleId } = req.params
      const { userId } = req.body

      const updated = await AdminService.unassignRoleFromUser({
        roleId,
        userId,
        tenantId: req.user.tenantId,
        actorId: req.user.id
      })

      return res.status(200).json({
        success: true,
        message: 'Role removed from user successfully',
        data: updated
      })
    } catch (error) {
      next(error)
    }
  }

  static async createStaff(req, res, next) {
    try {
      const { name, email, phone, department, specialty, roles } = req.body
      const result = await AdminService.createStaff({
        tenantId: req.user.tenantId,
        name,
        email,
        phone,
        department,
        specialty,
        roles: Array.isArray(roles) ? roles : roles ? [roles] : [],
        actorId: req.user.id
      })

      return res.status(201).json({
        success: true,
        message: 'Staff member invited successfully',
        data: result,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateStaff(req, res, next) {
    try {
      const { id } = req.params
      const result = await AdminService.updateStaff({
        staffId: id,
        data: req.body,
        tenantId: req.user.tenantId,
        actorId: req.user.id
      })

      return res.status(200).json({
        success: true,
        message: 'Staff member updated successfully',
        data: result,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteStaff(req, res, next) {
    try {
      const { id } = req.params
      const result = await AdminService.deleteStaff({
        staffId: id,
        tenantId: req.user.tenantId,
        actorId: req.user.id
      })

      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async updateStaffRoles(req, res, next) {
    try {
      const { id } = req.params
      const { roles } = req.body

      const result = await AdminService.updateStaffRoles({
        staffId: id,
        roleIds: roles || [],
        tenantId: req.user.tenantId,
        actorId: req.user.id
      })

      return res.status(200).json({
        success: true,
        message: 'Staff roles updated successfully',
        data: result,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  static async getStaff(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 50
      const { search } = req.query

      const result = await AdminService.getStaff({
        tenantId: req.user.tenantId,
        page,
        limit,
        search
      })

      return res.status(200).json({
        success: true,
        staff: result.staff || result.data,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async getDepartments(req, res, next) {
    try {
      const tenantId = req.query.tenantId || req.user?.tenantId
      const departments = await AdminService.getDepartments(tenantId)
      return res.status(200).json({
        success: true,
        data: departments,
        departments
      })
    } catch (error) {
      next(error)
    }
  }

  static async getClinicalConfig(req, res, next) {
    try {
      const config = await AdminService.getClinicalConfig(req.user?.tenantId)
      return res.status(200).json({
        success: true,
        ...config,
        data: config
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateClinicalConfig(req, res, next) {
    try {
      const config = await AdminService.updateClinicalConfig(
        req.user?.tenantId,
        req.body,
        req.user?.id
      )
      return res.status(200).json({
        success: true,
        message: 'Clinical configuration saved successfully',
        ...config,
        data: config
      })
    } catch (error) {
      next(error)
    }
  }

  static async saveEnvironmentSetup(req, res, next) {
    try {
      const result = await AdminService.saveEnvironmentSetup(
        req.user?.tenantId,
        req.body,
        req.user?.id
      )
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async getReports(req, res, next) {
    try {
      const reports = await AdminService.getReports(req.user?.tenantId, req.query)
      return res.status(200).json({
        success: true,
        ...reports,
        data: reports
      })
    } catch (error) {
      next(error)
    }
  }

  static async suggestRolePermissions(req, res, next) {
    try {
      const { roleName } = req.query
      const tenantId = req.user?.tenantId
      const suggestion = await RoleTemplateService.suggestPermissions(roleName, tenantId)
      return res.status(200).json({
        success: true,
        data: suggestion,
        ...suggestion
      })
    } catch (error) {
      next(error)
    }
  }

  static async getRoleTemplates(req, res, next) {
    try {
      const tenantId = req.user?.tenantId
      const templates = await RoleTemplateService.listTemplates(tenantId)
      return res.status(200).json({
        success: true,
        data: templates,
        ...templates
      })
    } catch (error) {
      next(error)
    }
  }

  static async createRoleTemplate(req, res, next) {
    try {
      const tenantId = req.user?.tenantId
      const template = await RoleTemplateService.createTemplate(tenantId, req.body)
      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateRoleTemplate(req, res, next) {
    try {
      const { id } = req.params
      const tenantId = req.user?.tenantId
      const template = await RoleTemplateService.updateTemplate(tenantId, id, req.body)
      return res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteRoleTemplate(req, res, next) {
    try {
      const { id } = req.params
      const tenantId = req.user?.tenantId
      const result = await RoleTemplateService.deleteTemplate(tenantId, id)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async resetRoleTemplates(req, res, next) {
    try {
      const tenantId = req.user?.tenantId
      const result = await RoleTemplateService.resetToDefaults(tenantId)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default AdminController
