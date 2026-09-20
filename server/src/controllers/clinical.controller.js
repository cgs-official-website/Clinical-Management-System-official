import { ClinicalService } from '../services/clinical.service.js'
import { RbacService } from '../services/rbac.service.js'

export class ClinicalController {
  /* =========================================================================
   * PATIENTS
   * ========================================================================= */
  static async getPatients(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const { search, gender, status } = req.query

      const result = await ClinicalService.getPatients({
        tenantId: req.user.tenantId,
        page,
        limit,
        search,
        gender,
        status
      })

      return res.status(200).json({
        success: true,
        patients: result.data,
        data: result.data,
        total: result.pagination?.total || result.data?.length,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async getPatientById(req, res, next) {
    try {
      const patient = await ClinicalService.getPatientById(req.params.id, req.user.tenantId)
      return res.status(200).json({
        success: true,
        data: patient
      })
    } catch (error) {
      next(error)
    }
  }

  static async createPatient(req, res, next) {
    try {
      const patient = await ClinicalService.createPatient(req.body, req.user.tenantId, req.user.id)
      return res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: patient
      })
    } catch (error) {
      next(error)
    }
  }

  static async updatePatient(req, res, next) {
    try {
      const patient = await ClinicalService.updatePatient(req.params.id, req.body, req.user.tenantId, req.user.id)
      return res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: patient
      })
    } catch (error) {
      next(error)
    }
  }

  static async deletePatient(req, res, next) {
    try {
      const result = await ClinicalService.deletePatient(req.params.id, req.user.tenantId, req.user.id)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * APPOINTMENTS
   * ========================================================================= */
  static async getAppointments(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const { doctorId, status, date } = req.query

      const result = await ClinicalService.getAppointments({
        tenantId: req.user.tenantId,
        page,
        limit,
        doctorId,
        status,
        date
      })

      return res.status(200).json({
        success: true,
        appointments: result.data,
        data: result.data,
        total: result.pagination?.total || result.data?.length,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async createAppointment(req, res, next) {
    try {
      const appointment = await ClinicalService.createAppointment(req.body, req.user.tenantId, req.user.id)
      return res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment,
        ...appointment
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateAppointment(req, res, next) {
    try {
      const appointment = await ClinicalService.updateAppointment(req.params.id, req.body, req.user.tenantId, req.user.id)
      return res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment,
        ...appointment
      })
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * PRESCRIPTIONS
   * ========================================================================= */
  static async getPrescriptions(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const { patientId, doctorId } = req.query

      const result = await ClinicalService.getPrescriptions({
        tenantId: req.user.tenantId,
        page,
        limit,
        patientId,
        doctorId
      })

      return res.status(200).json({
        success: true,
        prescriptions: result.data,
        data: result.data,
        total: result.pagination?.total || result.data?.length,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async createPrescription(req, res, next) {
    try {
      const prescription = await ClinicalService.createPrescription(req.body, req.user.tenantId, req.user.id)
      return res.status(201).json({
        success: true,
        message: 'Prescription issued successfully',
        data: prescription,
        ...prescription
      })
    } catch (error) {
      next(error)
    }
  }

  static async fulfillPrescription(req, res, next) {
    try {
      const result = await ClinicalService.fulfillPrescription(req.params.id, req.body, req.user.tenantId, req.user.id)
      return res.status(200).json({
        success: true,
        message: 'Prescription fulfilled and medications dispensed',
        data: result,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  static async updatePrescription(req, res, next) {
    try {
      const result = await ClinicalService.updatePrescription(req.params.id, req.body, req.user.tenantId, req.user.id)
      return res.status(200).json({
        success: true,
        message: 'Prescription updated successfully',
        data: result,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * OUTPATIENT TRIAGE & TOKEN QUEUE (RECEPTION -> DOCTOR -> PHARMACY)
   * ========================================================================= */
  static async recordTriage(req, res, next) {
    try {
      const result = await ClinicalService.recordTriage(req.body, req.user.tenantId, req.user.id)
      return res.status(201).json({
        success: true,
        message: result.message,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  static async getTriageQueue(req, res, next) {
    try {
      const result = await ClinicalService.getTriageQueue({
        tenantId: req.user.tenantId
      })
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * BILLING & INVOICES (INR ₹)
   * ========================================================================= */
  static async getInvoices(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const { paymentStatus, search } = req.query

      const result = await ClinicalService.getInvoices({
        tenantId: req.user.tenantId,
        page,
        limit,
        paymentStatus,
        search
      })

      return res.status(200).json({
        success: true,
        invoices: result.data,
        data: result.data,
        total: result.pagination?.total || result.data?.length,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async createInvoice(req, res, next) {
    try {
      const invoice = await ClinicalService.createInvoice(req.body, req.user.tenantId, req.user.id)
      return res.status(201).json({
        success: true,
        message: 'Invoice generated successfully',
        data: invoice,
        ...invoice
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateInvoiceStatus(req, res, next) {
    try {
      const { paymentStatus, paymentMethod } = req.body
      const invoice = await ClinicalService.updateInvoiceStatus(
        req.params.id,
        paymentStatus,
        paymentMethod,
        req.user.tenantId,
        req.user.id
      )
      return res.status(200).json({
        success: true,
        message: 'Invoice payment status updated',
        data: invoice,
        ...invoice
      })
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * INVENTORY
   * ========================================================================= */
  static async getInventory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const { search, category, lowStockOnly } = req.query

      const result = await ClinicalService.getInventory({
        tenantId: req.user.tenantId,
        page,
        limit,
        search,
        category,
        lowStockOnly: lowStockOnly === 'true'
      })

      return res.status(200).json({
        success: true,
        inventory: result.data,
        data: result.data,
        total: result.pagination?.total || result.data?.length,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  static async createInventoryItem(req, res, next) {
    try {
      const item = await ClinicalService.createInventoryItem(req.body, req.user.tenantId, req.user.id)
      return res.status(201).json({
        success: true,
        message: 'Inventory item added successfully',
        data: item
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateInventoryItem(req, res, next) {
    try {
      const item = await ClinicalService.updateInventoryItem(req.params.id, req.body, req.user.tenantId, req.user.id)
      return res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully',
        data: item
      })
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * REPORTS & PERSONAL METRICS
   * ========================================================================= */
  static async getStaffReports(req, res, next) {
    try {
      const reports = await ClinicalService.getStaffReports(req.user?.tenantId, req.user?.id, req.user?.role)
      return res.status(200).json({
        success: true,
        data: reports,
        ...reports
      })
    } catch (error) {
      next(error)
    }
  }

  /* =========================================================================
   * STAFF SELF-SERVICE PERMISSIONS TRANSPARENCY
   * ========================================================================= */
  static async getMyPermissions(req, res, next) {
    try {
      const result = await RbacService.getEffectivePermissions(req.user?.id, req.user?.email)
      return res.status(200).json({
        success: true,
        data: {
          userId: req.user.id,
          roles: result.roles,
          effectivePermissions: result.permissions
        }
      })
    } catch (error) {
      next(error)
    }
  }
}

export default ClinicalController
