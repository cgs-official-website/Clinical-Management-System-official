import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'
import { AdminService } from './admin.service.js'
import { SuperadminService } from './superadmin.service.js'
import { AuthService } from './auth.service.js'
import { RbacService } from './rbac.service.js'
import { NotificationService } from './notification.service.js'
import { ConflictError, ValidationError, NotFoundError, DatabaseConnectionError } from '../utils/errors.js'

/**
 * All clinic registrations are stored ONLY in PostgreSQL
 * (tenants table = clinic, users table = admin with status INVITED).
 * No JSON file is used any more.
 */

export const registerClinicSchema = z
  .object({
    clinicName: z.string().min(2, 'Clinic name must be at least 2 characters'),
    subdomain: z
      .string()
      .min(2, 'Subdomain must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
    adminName: z.string().min(2, 'Administrator name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(8, 'Valid phone number is required'),
    specialty: z.string().optional().default('General Medicine'),
    region: z.string().optional().default('Asia / India (INR ₹)'),
    plan: z.string().optional().default('Professional'),
    clinic_category_id: z.string().optional(),
    clinicCategoryId: z.string().optional(),
  })
  .refine((data) => !!(data.clinic_category_id || data.clinicCategoryId), {
    message: 'Please select a clinic category',
    path: ['clinic_category_id'],
  })

const toRegistrationDto = (tenant, adminUser, status) => ({
  id: tenant.id,
  tenantId: tenant.id,
  clinicName: tenant.name,
  subdomain: tenant.subdomain,
  adminName: adminUser?.fullName || 'Clinic Administrator',
  email: adminUser?.email || tenant.contactEmail || '',
  phone: adminUser?.phone || '',
  specialty: tenant.clinicCategory?.name || 'Multispecialty & General Care',
  clinicCategoryId: tenant.clinicCategoryId || null,
  clinicCategoryName: tenant.clinicCategory?.name || null,
  region: tenant.region || 'Asia / India (INR ₹)',
  plan: tenant.plan || 'Professional',
  status,
  submittedAt: tenant.createdAt,
  ...(status === 'rejected' ? { rejectedAt: tenant.updatedAt, rejectionReason: tenant.rejectionReason } : {}),
  ...(status === 'approved' ? { approvedAt: tenant.updatedAt } : {}),
})

export class RegistrationService {
  /**
   * Register a new clinic tenant and administrator (PostgreSQL only)
   */
  static async registerClinic(input) {
    const parsed = registerClinicSchema.safeParse(input)
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      throw new ValidationError(details[0]?.message || 'Invalid registration details', details)
    }

    const { clinicName, subdomain, adminName, email, password, phone, specialty, region, plan } = parsed.data
    const selectedCategoryId = parsed.data.clinic_category_id || parsed.data.clinicCategoryId
    const normalizedEmail = email.toLowerCase().trim()
    const cleanSubdomain = subdomain.toLowerCase().trim()

    let tenant
    try {
      const category = await prisma.clinicCategory.findFirst({
        where: { id: selectedCategoryId, isActive: true },
      })
      if (!category) {
        throw new ValidationError('Selected clinic category is not available. Please choose another.')
      }

      const [existingUser, existingTenant] = await Promise.all([
        prisma.user.findUnique({ where: { email: normalizedEmail } }),
        prisma.tenant.findUnique({ where: { subdomain: cleanSubdomain } }),
      ])
      if (existingUser) {
        throw new ConflictError(
          `An account with email "${normalizedEmail}" already exists. If your registration is pending, please await administrator approval.`
        )
      }
      if (existingTenant) {
        throw new ConflictError(
          `The clinic subdomain "${cleanSubdomain}" is already in use. Please select a different subdomain.`
        )
      }

      const passwordHash = await bcrypt.hash(password, 12)

      // Tenant + admin user are created together or not at all
      tenant = await prisma.$transaction(async (tx) => {
        const t = await tx.tenant.create({
          data: {
            name: clinicName,
            subdomain: cleanSubdomain,
            domain: `${cleanSubdomain}.clinic.io`,
            plan,
            status: 'PENDING',
            region,
            contactEmail: normalizedEmail,
            clinicCategoryId: category.id,
          },
        })
        await tx.user.create({
          data: {
            tenantId: t.id,
            email: normalizedEmail,
            passwordHash,
            fullName: adminName,
            phone,
            status: 'INVITED', // Pending Super Admin approval
            userType: 'ADMIN',
          },
        })
        return t
      })
      logger.info(`✅ Clinic registration saved to PostgreSQL: ${tenant.id}`)
    } catch (err) {
      if (err instanceof ConflictError || err instanceof ValidationError) throw err
      if (err.code === 'P2002') {
        throw new ConflictError('A record with this email or subdomain already exists.')
      }
      logger.error(`Registration failed (PostgreSQL): ${err.message}`)
      throw new DatabaseConnectionError(
        'Could not save your registration to the database. Please try again shortly.'
      )
    }

    try {
      await NotificationService.createNotification({
        notificationType: 'CLINIC_REGISTRATION_PENDING',
        title: `New Clinic Registration: ${clinicName}`,
        message: `${adminName} submitted a new clinic registration for "${clinicName}" (${cleanSubdomain}.clinic.io).`,
        entityType: 'REGISTRATION',
        entityId: tenant.id,
        data: {
          id: tenant.id,
          tenantId: tenant.id,
          clinicName,
          subdomain: cleanSubdomain,
          adminName,
          email: normalizedEmail,
          phone,
          submittedAt: tenant.createdAt,
        },
      })
    } catch (notifErr) {
      logger.warn('Failed to create DB notification during registration:', notifErr.message)
    }

    return {
      success: true,
      message: 'Clinic registration submitted successfully and is awaiting Super Admin verification.',
      registrationId: tenant.id,
      registration: {
        id: tenant.id,
        clinicName,
        subdomain: cleanSubdomain,
        adminName,
        email: normalizedEmail,
        specialty,
        region,
        plan,
        status: 'pending',
        submittedAt: tenant.createdAt,
      },
    }
  }

  /**
   * Public registration status by registration ID (tenant id), subdomain or email
   */
  static async getRegistrationStatus(id) {
    if (!id) throw new ValidationError('Registration ID is required')
    const cleanId = String(id).trim()

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { subdomain: cleanId.toLowerCase() },
          { contactEmail: cleanId.toLowerCase() },
        ],
      },
      include: { users: true, clinicCategory: true },
    })
    if (!tenant) throw new NotFoundError('Registration request not found')

    const adminUser = tenant.users?.find((u) => u.userType === 'ADMIN') || tenant.users?.[0]
    const registration = {
      ...toRegistrationDto(tenant, adminUser, tenant.status.toLowerCase()),
      clinicId: tenant.id,
    }

    if (tenant.status === 'ACTIVE') {
      let tokens = null
      let userProfile = null
      if (adminUser) {
        const accessToken = AuthService.generateAccessToken(adminUser)
        const { rawToken: refreshToken } = await AuthService.generateRefreshToken(adminUser)
        tokens = { accessToken, refreshToken, expiresIn: 900 }
        const { permissions, roles } = await RbacService.getEffectivePermissions(adminUser.id)
        userProfile = {
          id: adminUser.id,
          name: adminUser.fullName,
          fullName: adminUser.fullName,
          email: adminUser.email,
          role: 'ADMIN',
          userType: 'ADMIN',
          isAdmin: true,
          isSuperadmin: false,
          tenantId: tenant.id,
          clinicId: tenant.id,
          clinicName: tenant.name,
          tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
          roles,
          permissions,
          effectivePermissions: permissions,
        }
      }
      return {
        status: 'approved',
        registration,
        clinic: { id: tenant.id, name: tenant.name, slug: tenant.subdomain },
        user: userProfile,
        tokens,
      }
    }

    if (tenant.status === 'REJECTED') {
      return {
        status: 'rejected',
        rejectionReason: tenant.rejectionReason || 'Registration criteria not met',
        rejectedAt: tenant.updatedAt,
        registration,
      }
    }

    return { status: 'pending', registration }
  }

  /**
   * All pending registrations for Super Admin review (from PostgreSQL)
   */
  static async getPendingRegistrations() {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'PENDING' },
      include: { users: true, clinicCategory: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const pending = tenants.map((t) => {
      const adminUser = t.users.find((u) => u.userType === 'ADMIN') || t.users[0]
      return toRegistrationDto(t, adminUser, 'pending')
    })

    return { registrations: pending, total: pending.length }
  }

  /**
   * Approve a pending registration (Super Admin)
   */
  static async approveRegistration(id) {
    if (!id) throw new ValidationError('Registration ID is required')

    const tenant = await prisma.tenant.findUnique({ where: { id } })
    if (!tenant) throw new NotFoundError('Registration not found')

    await SuperadminService.approveTenantTransaction(id)

    return {
      success: true,
      message: `Registration for "${tenant.name}" approved and workspace activated!`,
      registration: { id, tenantId: id, clinicName: tenant.name, status: 'approved' },
    }
  }

  /**
   * Reject a pending registration (Super Admin)
   */
  static async rejectRegistration(id, reason = 'Registration criteria not met') {
    if (!id) throw new ValidationError('Registration ID is required')

    const tenant = await prisma.tenant.findUnique({ where: { id } })
    if (!tenant) throw new NotFoundError('Registration not found')

    await SuperadminService.rejectTenant(id, reason)

    return {
      success: true,
      message: `Registration for "${tenant.name}" has been rejected.`,
      registration: { id, tenantId: id, clinicName: tenant.name, status: 'rejected', rejectionReason: reason },
    }
  }

  /**
   * Complete staff onboarding and set account password
   */
  static async registerStaff({ staffId, email, name, password, role, department, specialty, clinicName }) {
    const cleanEmail = (email || '').toLowerCase().trim()
    if (!cleanEmail) throw new ValidationError('Staff email address is required')
    if (!password || password.length < 6) throw new ValidationError('Password must be at least 6 characters')

    // Find the invited staff user in PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(staffId ? [{ id: staffId }] : []),
          { email: cleanEmail }
        ]
      },
      include: {
        tenant: true,
        userRoles: { include: { role: true } },
        staffProfile: true
      }
    })

    const passwordHash = await bcrypt.hash(password, 12)

    if (user) {
      // Update existing invited staff member
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          ...(name ? { fullName: name.trim() } : {}),
          status: 'ACTIVE'
        },
        include: {
          tenant: true,
          userRoles: { include: { role: true } },
          staffProfile: true
        }
      })
    } else {
      // Find tenant if clinicName or default
      const tenant = await prisma.tenant.findFirst({
        where: clinicName ? { name: { contains: clinicName, mode: 'insensitive' } } : {}
      })
      user = await prisma.user.create({
        data: {
          ...(tenant?.id ? { tenant: { connect: { id: tenant.id } } } : {}),
          fullName: name ? name.trim() : 'Staff Member',
          email: cleanEmail,
          passwordHash,
          status: 'ACTIVE',
          userType: 'STAFF'
        },
        include: {
          tenant: true,
          userRoles: { include: { role: true } },
          staffProfile: true
        }
      })
    }

    // Ensure role assignment if specified
    if (role && user.tenantId) {
      const resolvedRole = await AdminService.resolveRoleForTenant(role, user.tenantId)
      if (resolvedRole) {
        const hasRole = await prisma.userRole.findFirst({
          where: { userId: user.id, roleId: resolvedRole.id }
        })
        if (!hasRole) {
          await prisma.userRole.create({
            data: { userId: user.id, roleId: resolvedRole.id }
          }).catch(() => { })
        }
      }
    }

    // Refresh permissions and issue session tokens
    const { permissions, roles } = await RbacService.getEffectivePermissions(user.id)
    const accessToken = AuthService.generateAccessToken(user)
    const { rawToken: refreshToken } = await AuthService.generateRefreshToken(user)

    const isSuperadmin = user.userType === 'SUPERADMIN' || roles.includes('SUPERADMIN')
    const isAdmin = isSuperadmin || user.userType === 'ADMIN' || roles.includes('ADMIN')
    const primaryRole = isSuperadmin ? 'SUPERADMIN' : (isAdmin ? 'ADMIN' : (roles[0] || 'STAFF'))

    const userProfile = {
      id: user.id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      userType: user.userType,
      role: primaryRole,
      roleTitle: roles[0] || primaryRole,
      isSuperadmin,
      isAdmin,
      tenantId: user.tenantId,
      clinicName: user.tenant ? user.tenant.name : 'Active Workspace',
      tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name, subdomain: user.tenant.subdomain } : null,
      roles,
      permissions,
      effectivePermissions: permissions
    }

    return {
      success: true,
      message: 'Staff account activated successfully',
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900
      }
    }
  }
}

export { RegistrationService as registrationService }
export default RegistrationService
