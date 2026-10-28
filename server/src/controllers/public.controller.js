import { prisma } from '../config/prisma.js'
import { RegistrationService } from '../services/registration.service.js'

export class PublicController {
  static async getSiteContent(req, res, next) {
    try {
      const records = await prisma.publicSiteContent.findMany().catch(() => [])

      // Fallback content in INR if DB is empty
      const defaultContent = {
        hero: {
          badge: 'Next-Generation Clinical OS 2026',
          headline: 'Intelligent Clinical Operating System',
          subheadline: 'Unified EHR, automated AI charting, role-based workflows, and seamless clinic operations.',
          stats: [
            { label: 'Active Clinicians', value: '14,200+' },
            { label: 'Patient Encounters', value: '2.4M+' },
            { label: 'Clinical Uptime', value: '99.99%' },
            { label: 'Billing Speed', value: '4x Faster' }
          ]
        },
        pricing: [
          {
            plan: 'STARTER',
            title: 'Starter Clinic',
            priceINR: 12500,
            period: 'per month',
            description: 'Essential EHR & scheduling for private practices up to 5 doctors.',
            features: ['Up to 5 Doctors', 'Full EHR & Prescriptions', 'Basic Billing (INR)', 'Standard Support']
          },
          {
            plan: 'PRO',
            title: 'Multi-Specialty Center',
            priceINR: 28500,
            period: 'per month',
            popular: true,
            description: 'Comprehensive operational suite with dynamic RBAC, inventory & analytics.',
            features: ['Up to 25 Practitioners', 'Dynamic Roles & Permissions', 'Pharmacy Inventory & Billing', 'Priority SLA']
          },
          {
            plan: 'ENTERPRISE',
            title: 'Hospital Network',
            priceINR: 65001,
            period: 'per month',
            description: 'Dedicated multi-tenant infrastructure, custom audit feeds, and 24/7 dedicated support.',
            features: ['Unlimited Staff & Tenants', 'Custom Modules & Workflows', 'Dedicated Redis Cluster', '24/7 Phone & On-Site Support']
          }
        ]
      }

      const responseMap = { ...defaultContent }
      records.forEach(r => {
        responseMap[r.sectionKey] = r.content
      })

      return res.status(200).json({
        success: true,
        data: responseMap
      })
    } catch (error) {
      next(error)
    }
  }

  static async getClinicCategories(req, res, next) {
    try {
      const categories = await prisma.clinicCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true
        }
      })
      if (categories && categories.length > 0) {
        return res.status(200).json({
          success: true,
          data: categories
        })
      }
    } catch (error) {
      logger.warn(`Public clinic categories DB query failed: ${error.message}. Returning fallback.`)
    }

    return res.status(200).json({
      success: true,
      data: [
        {
          id: 'a0d89e89-b1b4-48be-9698-779bb711e240',
          name: 'Cardiology',
          description: 'Specialized cardiovascular diagnostics, heart health, arrhythmia and vascular medicine.',
          isActive: true
        },
        {
          id: 'f62ee8b5-40c5-4fde-a912-722c7dae86aa',
          name: 'Dental Care',
          description: 'Comprehensive oral healthcare, restorative dentistry, orthodontic and dental hygiene services.',
          isActive: true
        },
        {
          id: '15953f71-8e1e-42dd-8964-591794e1b293',
          name: 'Physiotherapy',
          description: 'Physical rehabilitation, musculoskeletal therapy, sports injury recovery and mobility care.',
          isActive: true
        }
      ]
    })
  }

  static async subscribeNewsletter(req, res, next) {
    try {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'EMAIL_REQUIRED', message: 'Email address is required' }
        })
      }

      await prisma.newsletterSubscription.upsert({
        where: { email: email.toLowerCase() },
        update: { isActive: true },
        create: { email: email.toLowerCase() }
      }).catch(() => { })

      return res.status(200).json({
        success: true,
        message: 'Successfully subscribed to clinical innovations newsletter'
      })
    } catch (error) {
      next(error)
    }
  }

  static async requestDemo(req, res, next) {
    try {
      const { name, email, phone, clinicName, doctorCount } = req.body
      const record = await prisma.demoRequest.create({
        data: {
          name,
          email: email.toLowerCase(),
          phone,
          clinicName,
          doctorCount: parseInt(doctorCount, 10) || 1
        }
      }).catch(() => ({ id: 'demo-' + Date.now() }))

      return res.status(201).json({
        success: true,
        message: 'Demo request received. Our clinical onboarding specialist will contact you shortly.',
        data: record
      })
    } catch (error) {
      next(error)
    }
  }

  static async getHealth(req, res) {
    let dbStatus = 'disconnected'
    let dbLatencyMs = null
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatencyMs = Date.now() - start
      dbStatus = 'connected'
    } catch (err) {
      dbStatus = 'error: ' + err.message
    }

    const isHealthy = dbStatus === 'connected'

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'clinic-api',
      database: {
        status: dbStatus,
        provider: 'PostgreSQL',
        latencyMs: dbLatencyMs,
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    })
  }

  static async registerClinic(req, res, next) {
    try {
      const result = await RegistrationService.registerClinic(req.body)
      return res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async getRegistrationStatus(req, res, next) {
    try {
      const { id } = req.params
      const result = await RegistrationService.getRegistrationStatus(id)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async registerStaff(req, res, next) {
    try {
      const result = await RegistrationService.registerStaff(req.body)
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async getStaffInviteStatus(req, res, next) {
    try {
      const { email, staffId } = req.query
      const result = await RegistrationService.getStaffInviteStatus({ email, staffId })
      return res.status(200).json({ success: true, data: result, ...result })
    } catch (error) {
      next(error)
    }
  }

  static async accessStaffPortal(req, res, next) {
    try {
      const { email, staffId } = req.body
      const result = await RegistrationService.accessStaffPortal({ email, staffId })
      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default PublicController
