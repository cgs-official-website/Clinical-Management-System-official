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
            priceINR: 65000,
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
      return res.status(200).json({
        success: true,
        data: categories
      })
    } catch (error) {
      next(error)
    }
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
      }).catch(() => {})

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
    return res.status(200).json({
      status: 'healthy',
      service: 'clinic-api',
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
}

export default PublicController
