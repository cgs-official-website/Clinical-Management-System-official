import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'
import { amountToWordsINR } from '../utils/numberToWords.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

export class SubscriptionService {
  /**
   * Get all active subscription plans from the database
   */
  static async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceINR: 'asc' },
    })
  }

  /**
   * Find a plan by ID, Code, or Name
   */
  static async findPlan(identifier) {
    if (!identifier) return null

    // Try finding by UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    if (isUuid) {
      const byId = await prisma.subscriptionPlan.findUnique({ where: { id: identifier } })
      if (byId) return byId
    }

    // Try finding by code
    const byCode = await prisma.subscriptionPlan.findUnique({
      where: { code: identifier.toUpperCase().trim() },
    })
    if (byCode) return byCode

    // Try fuzzy match on name or code
    const all = await prisma.subscriptionPlan.findMany()
    const cleanId = identifier.toLowerCase().replace(/[^a-z0-9]/g, '')

    return all.find((p) => {
      const pName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const pCode = p.code.toLowerCase().replace(/[^a-z0-9]/g, '')
      return (
        pName === cleanId ||
        pCode === cleanId ||
        pName.includes(cleanId) ||
        cleanId.includes(pName) ||
        (cleanId.includes('starter') && pCode === 'starter') ||
        (cleanId.includes('pro') && pCode === 'pro') ||
        ((cleanId.includes('hospital') || cleanId.includes('enterprise')) && pCode === 'enterprise')
      )
    }) || null
  }

  /**
   * Get database-backed Company / Organization settings
   */
  static async getCompanySettings() {
    let settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          id: 'default',
          legalCompanyName: 'Zuna Healthcare Technologies Private Limited',
          tradeName: 'Zuna Clinical ERP',
          address: 'Building 4A, Tech Park, Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          country: 'India',
          gstin: '29AAAAZ0000A1Z5',
          pan: 'AAAAZ0000A',
          cin: 'U72200KA2026PTC123456',
          sacCode: '998313',
          contactEmail: 'billing@zuna.io',
          phone: '+91 80 4567 8900',
          website: 'https://zuna.io',
          bankName: 'HDFC Bank',
          accountName: 'Zuna Healthcare Technologies Pvt Ltd',
          accountNumber: '50200012345678',
          ifsc: 'HDFC0001234',
          branch: 'Koramangala, Bengaluru',
          upiId: 'zunaerp@hdfcbank',
          invoiceTerms: 'Payment is due within 15 days of invoice issue. Subscription renews automatically unless cancelled 7 days prior to billing cycle end.',
        },
      })
    }

    return settings
  }

  /**
   * Update database-backed Company / Organization settings
   */
  static async updateCompanySettings(data) {
    const { id, createdAt, updatedAt, ...updatable } = data || {}

    return prisma.companySettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...updatable,
      },
      update: updatable,
    })
  }

  /**
   * Generate an official Zuna Subscription Invoice for a clinic tenant
   */
  static async createInvoiceForTenant(tenantId, planIdentifier = null, options = {}) {
    if (!tenantId) throw new ValidationError('Tenant ID is required for invoice creation')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { planRelation: true },
    })

    if (!tenant) throw new NotFoundError('Clinic tenant not found')

    // Resolve target plan from parameter, tenant.planId, or tenant.plan
    let plan = null
    if (planIdentifier) {
      plan = await this.findPlan(planIdentifier)
    }
    if (!plan && tenant.planId) {
      plan = await prisma.subscriptionPlan.findUnique({ where: { id: tenant.planId } })
    }
    if (!plan && tenant.plan) {
      plan = await this.findPlan(tenant.plan)
    }
    if (!plan) {
      // Fallback to default active plan
      plan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
        orderBy: { priceINR: 'asc' },
      })
    }

    if (!plan) {
      throw new Error('No active subscription plans available in the database')
    }

    // Ensure tenant is linked to the plan in the database
    if (tenant.planId !== plan.id || tenant.plan !== plan.name) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planId: plan.id,
          plan: plan.name,
        },
      })
    }

    // Retrieve company settings for terms & defaults
    const company = await this.getCompanySettings()

    // Financial calculations: Base + 18% GST (9% CGST + 9% SGST)
    const baseAmount = Number(plan.priceINR)
    const taxRate = 18.0
    const cgstAmount = Math.round(baseAmount * 0.09 * 100) / 100
    const sgstAmount = Math.round(baseAmount * 0.09 * 100) / 100
    const igstAmount = 0
    const totalAmount = Math.round((baseAmount + cgstAmount + sgstAmount) * 100) / 100
    const amountInWords = amountToWordsINR(totalAmount)

    // Sequential invoice numbering: INV-ZUNA-YYYY-XXXX
    const currentYear = new Date().getFullYear()
    const invoiceCount = await prisma.subscriptionInvoice.count()
    const invoiceNumber = `INV-ZUNA-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`

    const periodStart = options.periodStart ? new Date(options.periodStart) : new Date()
    const periodEnd = options.periodEnd
      ? new Date(options.periodEnd)
      : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000)
    const dueDate = options.dueDate
      ? new Date(options.dueDate)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    const invoice = await prisma.subscriptionInvoice.create({
      data: {
        invoiceNumber,
        tenantId,
        planId: plan.id,
        status: options.status || 'PENDING',
        currency: 'INR',
        billingPeriod: options.billingPeriod || 'Monthly',
        periodStart,
        periodEnd,
        invoiceDate: new Date(),
        dueDate,
        baseAmount,
        taxRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        amountInWords,
        sacCode: company.sacCode || '998313',
        paymentMethod: options.paymentMethod || 'Awaiting Payment',
        paymentReference: options.paymentReference || null,
        terms: company.invoiceTerms,
        notes: options.notes || `Subscription invoice issued for ${tenant.name}. Awaiting payment settlement.`,
      },
      include: {
        plan: true,
        tenant: true,
      },
    })

    logger.info(`✅ Generated Subscription Invoice ${invoice.invoiceNumber} for tenant ${tenant.name} (${plan.name} - ₹${totalAmount})`)

    return invoice
  }

  /**
   * Get clinic's current subscription & invoices (Clinic Admin view)
   */
  static async getTenantSubscription(tenantId) {
    if (!tenantId) throw new ValidationError('Tenant ID is required')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        planRelation: true,
      },
    })

    if (!tenant) throw new NotFoundError('Clinic tenant not found')

    // Find all subscription invoices for this tenant
    const invoices = await prisma.subscriptionInvoice.findMany({
      where: { tenantId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    // If tenant has no subscription invoices yet, generate their initial invoice automatically
    let latestInvoice = invoices[0] || null
    if (!latestInvoice) {
      latestInvoice = await this.createInvoiceForTenant(tenantId, tenant.planId || tenant.plan)
      invoices.unshift(latestInvoice)
    }

    const company = await this.getCompanySettings()

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        status: tenant.status,
        region: tenant.region,
        contactEmail: tenant.contactEmail,
        createdAt: tenant.createdAt,
      },
      currentPlan: tenant.planRelation || latestInvoice?.plan || {
        name: tenant.plan,
        priceINR: latestInvoice?.baseAmount || 0,
        billingPeriod: 'monthly',
      },
      latestInvoice,
      invoices,
      companySettings: company,
    }
  }

  /**
   * Get a specific subscription invoice by ID, scoped to tenant
   */
  static async getSubscriptionInvoiceById(tenantId, invoiceId, isSuperadmin = false) {
    const where = { id: invoiceId }
    if (!isSuperadmin && tenantId) {
      where.tenantId = tenantId
    }

    const invoice = await prisma.subscriptionInvoice.findFirst({
      where,
      include: {
        plan: true,
        tenant: true,
      },
    })

    if (!invoice) throw new NotFoundError('Subscription invoice not found')

    const company = await this.getCompanySettings()

    return {
      invoice,
      companySettings: company,
    }
  }

  /**
   * Get all subscription invoices across all tenants (Superadmin view)
   */
  static async getAllSubscriptions({ page = 1, limit = 50, search = '', plan = '', status = '' } = {}) {
    const where = {}

    if (status) {
      where.status = status.toUpperCase()
    }

    if (plan) {
      where.plan = { code: plan.toUpperCase() }
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { tenant: { name: { contains: search, mode: 'insensitive' } } },
        { tenant: { subdomain: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.subscriptionInvoice.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              domain: true,
              contactEmail: true,
              status: true,
              region: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriptionInvoice.count({ where }),
    ])

    const company = await this.getCompanySettings()

    return {
      data: invoices,
      companySettings: company,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }
}
