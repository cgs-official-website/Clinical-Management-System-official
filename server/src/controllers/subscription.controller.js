import { SubscriptionService } from '../services/subscription.service.js'
import { ValidationError, UnauthorizedError } from '../utils/errors.js'

export class SubscriptionController {
  /**
   * Public: List all active Operational Scale Plans
   */
  static async getPublicPlans(req, res, next) {
    try {
      const plans = await SubscriptionService.getPlans()
      return res.status(200).json({
        success: true,
        data: plans,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Clinic Admin: Get current clinic's subscription & invoice details
   */
  static async getMySubscription(req, res, next) {
    try {
      const tenantId = req.user?.tenantId
      if (!tenantId) {
        throw new UnauthorizedError('User is not associated with any clinic tenant')
      }

      const data = await SubscriptionService.getTenantSubscription(tenantId)
      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Clinic Admin: Get specific subscription invoice
   */
  static async getMyInvoice(req, res, next) {
    try {
      const tenantId = req.user?.tenantId
      const { id } = req.params
      const isSuperadmin = req.user?.isSuperadmin || req.user?.userType === 'SUPERADMIN'

      const data = await SubscriptionService.getSubscriptionInvoiceById(tenantId, id, isSuperadmin)
      return res.status(200).json({
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Superadmin: Monitor all clinic subscriptions & invoices
   */
  static async getSuperadminInvoices(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 50
      const { search, plan, status } = req.query

      const result = await SubscriptionService.getAllSubscriptions({ page, limit, search, plan, status })
      return res.status(200).json({
        success: true,
        data: result.data,
        companySettings: result.companySettings,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Superadmin: Get database-backed Company / Organization settings
   */
  static async getCompanySettings(req, res, next) {
    try {
      const settings = await SubscriptionService.getCompanySettings()
      return res.status(200).json({
        success: true,
        data: settings,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Superadmin: Update database-backed Company / Organization settings
   */
  static async updateCompanySettings(req, res, next) {
    try {
      const updated = await SubscriptionService.updateCompanySettings(req.body)
      return res.status(200).json({
        success: true,
        message: 'Organization & legal company billing settings updated successfully',
        data: updated,
      })
    } catch (error) {
      next(error)
    }
  }
}
