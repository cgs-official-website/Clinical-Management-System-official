import { SuperadminService } from '../services/superadmin.service.js'
import { AuditService } from '../services/audit.service.js'
import { RegistrationService } from '../services/registration.service.js'

export class SuperadminController {
  static async getStats(req, res, next) {
    try {
      const stats = await SuperadminService.getDashboardStats()
      return res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  static async getTenants(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 50
      const { search, plan, status } = req.query

      const result = await SuperadminService.getTenants({ page, limit, search, plan, status })
      const formattedClinics = result.data.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.subdomain || t.slug || '',
        domain: t.domain || `${t.subdomain || 'clinic'}.clinic.io`,
        plan: t.plan || 'Professional',
        status: (t.status || 'active').toLowerCase(),
        region: t.region || 'North America (East)',
        contactEmail: t.contactEmail || t.email || '',
        patientsCount: t.stats?.patients || 0,
        staffCount: t.stats?.users || 0,
        createdAt: t.createdAt,
      }))

      return res.status(200).json({
        success: true,
        clinics: formattedClinics,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async createTenant(req, res, next) {
    try {
      const result = await SuperadminService.createTenant({
        ...req.body,
        actorId: req.user.id
      })
      return res.status(201).json({
        success: true,
        message: 'Tenant clinic created and provisioned successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateTenantStatus(req, res, next) {
    try {
      const { id } = req.params
      const statusParam = req.body.status || req.body.isActive
      const rejectionReason = req.body.rejection_reason || req.body.rejectionReason || req.body.reason

      if (
        (statusParam === 'REJECTED' || statusParam === 'rejected') &&
        (!rejectionReason || !rejectionReason.trim())
      ) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A rejection reason is required when rejecting a clinic registration.'
          }
        })
      }

      const updated = await SuperadminService.updateTenantStatus(
        id,
        statusParam,
        req.user?.id,
        rejectionReason ? rejectionReason.trim() : null
      )
      return res.status(200).json({
        success: true,
        message: `Tenant clinic status updated successfully`,
        data: updated
      })
    } catch (error) {
      next(error)
    }
  }

  static async decommissionTenant(req, res, next) {
    try {
      const { id } = req.params
      const result = await SuperadminService.decommissionTenant(id, req.user.id)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 20
      const { tenantId, actorId, entityType } = req.query

      const logs = await AuditService.getLogs({ tenantId, actorId, entityType, page, limit })
      return res.status(200).json({
        success: true,
        data: logs.data,
        pagination: logs.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async getHealth(req, res, next) {
    try {
      const health = await SuperadminService.getSystemHealth()
      return res.status(200).json({
        success: true,
        data: health
      })
    } catch (error) {
      next(error)
    }
  }

  static async getPendingRegistrations(req, res, next) {
    try {
      const data = await RegistrationService.getPendingRegistrations()
      return res.status(200).json({
        success: true,
        data: data.registrations || [],
        registrations: data.registrations || [],
        total: data.total || 0,
      })
    } catch (error) {
      next(error)
    }
  }

  static async approveRegistration(req, res, next) {
    try {
      const { id } = req.params
      const result = await RegistrationService.approveRegistration(id)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async rejectRegistration(req, res, next) {
    try {
      const { id } = req.params
      const { reason } = req.body || {}
      const result = await RegistrationService.rejectRegistration(id, reason)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async getAdmins(req, res, next) {
    try {
      const data = await SuperadminService.getAdmins()
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }

  static async createAdmin(req, res, next) {
    try {
      const data = await SuperadminService.createAdmin(req.body)
      return res.status(201).json(data)
    } catch (error) {
      next(error)
    }
  }

  static async updateAdmin(req, res, next) {
    try {
      const { id } = req.params
      const data = await SuperadminService.updateAdmin(id, req.body)
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }

  static async getSettings(req, res, next) {
    try {
      const data = await SuperadminService.getSettings()
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const data = await SuperadminService.updateSettings(req.body)
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }

  // -------------------------------------------------------------
  // CLINIC CATEGORY CRUD
  // -------------------------------------------------------------

  static async getClinicCategories(req, res, next) {
    try {
      const { search, isActive } = req.query
      const activeFilter = isActive !== undefined ? isActive === 'true' : undefined
      const data = await SuperadminService.getClinicCategories({ search, isActive: activeFilter })
      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  static async getClinicCategoryById(req, res, next) {
    try {
      const { id } = req.params
      const data = await SuperadminService.getClinicCategoryById(id)
      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  static async createClinicCategory(req, res, next) {
    try {
      const { name, description, isActive } = req.body
      const data = await SuperadminService.createClinicCategory({
        name,
        description,
        isActive,
        actorId: req.user?.id,
      })
      return res.status(201).json({
        success: true,
        message: 'Clinic category created successfully',
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateClinicCategory(req, res, next) {
    try {
      const { id } = req.params
      const data = await SuperadminService.updateClinicCategory(id, {
        ...req.body,
        actorId: req.user?.id,
      })
      return res.status(200).json({
        success: true,
        message: 'Clinic category updated successfully',
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteClinicCategory(req, res, next) {
    try {
      const { id } = req.params
      const data = await SuperadminService.deleteClinicCategory(id, req.user?.id)
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }

  static async deleteAllClinicCategories(req, res, next) {
    try {
      const data = await SuperadminService.deleteAllClinicCategories(req.user?.id)
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }

  static async getCategoryRoleTemplates(req, res, next) {
    try {
      const { id } = req.params
      const data = await SuperadminService.getCategoryRoleTemplates(id)
      return res.status(200).json({
        success: true,
        data,
        templates: data,
      })
    } catch (error) {
      next(error)
    }
  }

  static async setCategoryRoleTemplates(req, res, next) {
    try {
      const { id } = req.params
      const templates = Array.isArray(req.body)
        ? req.body
        : (req.body.templates || (req.body.roleName ? [req.body] : []))

      const data = await SuperadminService.setCategoryRoleTemplates(
        id,
        { templates },
        req.user?.id
      )
      return res.status(200).json({
        success: true,
        message: 'Role templates updated successfully',
        data,
        templates: data,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default SuperadminController
