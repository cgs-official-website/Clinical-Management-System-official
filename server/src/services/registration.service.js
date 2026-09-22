import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')
const REG_FILE = path.join(DATA_DIR, 'registrations.json')

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(REG_FILE)) {
    fs.writeFileSync(REG_FILE, JSON.stringify({ pending: [], approved: [] }, null, 2))
  }
} catch (e) {
  logger.warn('Could not initialize local registration registry directory', e)
}

const readLocalRegistry = () => {
  try {
    if (fs.existsSync(REG_FILE)) {
      const content = fs.readFileSync(REG_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    logger.warn('Failed to read local registration registry', e)
  }
  return { pending: [], approved: [] }
}

const writeLocalRegistry = (data) => {
  try {
    fs.writeFileSync(REG_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    logger.error('Failed to write local registration registry', e)
  }
}

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

export class RegistrationService {
  /**
   * Register a new clinic tenant and administrator
   */
  static async registerClinic(input) {
    // 1. Validate input fields
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

    // Verify clinic category exists if DB reachable
    let verifiedCategory = null
    try {
      if (selectedCategoryId) {
        verifiedCategory = await prisma.clinicCategory.findFirst({
          where: { id: selectedCategoryId, isActive: true }
        })
      }
    } catch {}

    // 2. Check duplicate entry in local registry
    const registry = readLocalRegistry()
    const isEmailInPending = (registry.pending || []).some(
      (r) => (r.email || '').toLowerCase().trim() === normalizedEmail
    )
    const isEmailInApproved = (registry.approved || []).some(
      (r) => (r.email || '').toLowerCase().trim() === normalizedEmail
    )
    if (isEmailInPending || isEmailInApproved) {
      throw new ConflictError(
        `An account with email "${normalizedEmail}" already exists. If your registration is pending, please await administrator approval.`
      )
    }

    const isSubdomainInPending = (registry.pending || []).some(
      (r) => (r.subdomain || '').toLowerCase().trim() === cleanSubdomain
    )
    const isSubdomainInApproved = (registry.approved || []).some(
      (r) => (r.subdomain || '').toLowerCase().trim() === cleanSubdomain
    )
    if (isSubdomainInPending || isSubdomainInApproved) {
      throw new ConflictError(
        `The clinic subdomain "${cleanSubdomain}" is already in use. Please select a different subdomain.`
      )
    }

    // 3. Duplicate checks against PostgreSQL if database is reachable
    let dbConnected = false
    try {
      const dbCheckPromise = Promise.all([
        prisma.user.findUnique({ where: { email: normalizedEmail } }),
        prisma.tenant.findUnique({ where: { subdomain: cleanSubdomain } }),
      ])
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 8000)
      )

      const [existingUser, existingTenant] = await Promise.race([dbCheckPromise, timeoutPromise])
      dbConnected = true

      if (existingUser) {
        throw new ConflictError(`An account with email "${normalizedEmail}" already exists. Please log in or use a different email.`)
      }
      if (existingTenant) {
        throw new ConflictError(`The clinic subdomain "${cleanSubdomain}" is already registered. Please choose another.`)
      }
    } catch (err) {
      if (err instanceof ConflictError) throw err
      logger.warn(`PostgreSQL duplicate check skipped or timed out: ${err.message}`)
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    const regId = 'reg-' + Date.now()

    const registrationRecord = {
      id: regId,
      clinicName,
      subdomain: cleanSubdomain,
      adminName,
      email: normalizedEmail,
      passwordHash,
      phone,
      specialty: verifiedCategory?.name || specialty,
      clinicCategoryId: verifiedCategory?.id || selectedCategoryId || null,
      clinicCategoryName: verifiedCategory?.name || null,
      region,
      plan,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }

    // 5. Insert into database (Prisma / PostgreSQL) if reachable
    if (dbConnected) {
      try {
        const tenant = await prisma.tenant.create({
          data: {
            name: clinicName,
            subdomain: cleanSubdomain,
            domain: `${cleanSubdomain}.clinic.io`,
            plan,
            status: 'PENDING',
            region,
            contactEmail: normalizedEmail,
            clinicCategoryId: verifiedCategory?.id || selectedCategoryId || null,
          },
        })

        await prisma.user.create({
          data: {
            tenantId: tenant.id,
            email: normalizedEmail,
            passwordHash,
            fullName: adminName,
            phone,
            status: 'INVITED', // Pending Super Admin approval
            userType: 'ADMIN',
          },
        })

        registrationRecord.tenantId = tenant.id
        logger.info(`✅ Successfully inserted clinic registration into PostgreSQL database: ${tenant.id}`)
      } catch (dbErr) {
        logger.error(`Failed to insert into PostgreSQL: ${dbErr.message}`)
        if (dbErr.code === 'P2002') {
          throw new ConflictError('A record with this email or subdomain already exists in the database.')
        }
      }
    }

    // 6. Persist to local registry
    if (!registry.pending) registry.pending = []
    registry.pending.unshift(registrationRecord)
    writeLocalRegistry(registry)

    // 7. Create persistent PostgreSQL notification for Superadmin
    try {
      await NotificationService.createNotification({
        type: 'CLINIC_REGISTRATION_PENDING',
        title: `New Clinic Registration: ${clinicName}`,
        message: `${adminName} submitted a new clinic registration for "${clinicName}" (${cleanSubdomain}.clinic.io).`,
        entityType: 'REGISTRATION',
        entityId: registrationRecord.tenantId || regId,
        data: {
          id: regId,
          tenantId: registrationRecord.tenantId || null,
          clinicName,
          subdomain: cleanSubdomain,
          adminName,
          email: normalizedEmail,
          phone,
          submittedAt: registrationRecord.submittedAt,
        },
      })
    } catch (notifErr) {
      logger.warn('Failed to create DB notification during registration:', notifErr.message)
    }

    logger.info(`✅ Registration record stored successfully. ID: ${regId}`)

    return {
      success: true,
      message: 'Clinic registration submitted successfully and is awaiting Super Admin verification.',
      registrationId: regId,
      registration: {
        id: regId,
        clinicName,
        subdomain: cleanSubdomain,
        adminName,
        email: normalizedEmail,
        specialty,
        region,
        plan,
        status: 'pending',
        submittedAt: registrationRecord.submittedAt,
      },
    }
  }

  /**
   * Get public registration status by ID (supports pending, approved, and rejected)
   */
  static async getRegistrationStatus(id) {
    if (!id) throw new ValidationError('Registration ID is required')

    const cleanId = String(id).trim()
    const registry = readLocalRegistry()

    // 1. Try PostgreSQL lookup first for real-time status updates
    try {
      // Find tenant matching ID directly, or via registration tenantId, or subdomain, or contactEmail
      const matchedReg =
        (registry.pending || []).find((r) => r.id === cleanId || r.tenantId === cleanId) ||
        (registry.approved || []).find((r) => r.id === cleanId || r.tenantId === cleanId) ||
        (registry.rejected || []).find((r) => r.id === cleanId || r.tenantId === cleanId)

      const targetTenantId = matchedReg?.tenantId || cleanId
      const targetSubdomain = matchedReg?.subdomain || cleanId
      const targetEmail = matchedReg?.email ? matchedReg.email.toLowerCase() : cleanId.toLowerCase()

      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: targetTenantId },
            { subdomain: targetSubdomain },
            { contactEmail: targetEmail },
          ],
        },
        include: {
          users: true,
          clinicCategory: true,
        },
      })

      if (tenant) {
        const adminUser = tenant.users?.find((u) => u.userType === 'ADMIN') || tenant.users?.[0]

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
              clinicName: tenant.name,
              tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
              roles,
              permissions,
              effectivePermissions: permissions,
            }
          }

          return {
            status: 'approved',
            registration: {
              id: cleanId,
              tenantId: tenant.id,
              clinicName: tenant.name,
              subdomain: tenant.subdomain,
              adminName: adminUser?.fullName || 'Clinic Administrator',
              email: adminUser?.email || tenant.contactEmail,
              submittedAt: tenant.createdAt,
            },
            clinic: {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.subdomain,
            },
            user: userProfile,
            tokens,
          }
        }

        if (tenant.status === 'REJECTED') {
          return {
            status: 'rejected',
            rejectionReason: tenant.rejectionReason || 'Registration criteria not met',
            rejectedAt: tenant.updatedAt || new Date().toISOString(),
            registration: {
              id: cleanId,
              tenantId: tenant.id,
              clinicName: tenant.name,
              subdomain: tenant.subdomain,
              adminName: adminUser?.fullName || 'Clinic Administrator',
              email: adminUser?.email || tenant.contactEmail,
              submittedAt: tenant.createdAt,
            },
          }
        }

        if (tenant.status === 'PENDING') {
          return {
            status: 'pending',
            registration: {
              id: cleanId,
              tenantId: tenant.id,
              clinicName: tenant.name,
              subdomain: tenant.subdomain,
              adminName: adminUser?.fullName || 'Clinic Administrator',
              email: adminUser?.email || tenant.contactEmail,
              submittedAt: tenant.createdAt,
            },
          }
        }
      }
    } catch (e) {
      logger.warn(`PostgreSQL registration status check fallback: ${e.message}`)
    }

    // 2. Check local registry (offline / fallback)
    const approved = (registry.approved || []).find(
      (r) => r.id === cleanId || r.tenantId === cleanId || r.subdomain === cleanId || r.email?.toLowerCase() === cleanId.toLowerCase()
    )
    if (approved) {
      const mockTokens = approved.tokens || {
        accessToken: `jwt_token_admin_${Date.now()}`,
        refreshToken: `refresh_token_admin_${Date.now()}`,
        expiresIn: 900,
      }
      const mockUser = approved.user || {
        id: approved.tenantId || approved.id,
        email: approved.email,
        name: approved.adminName || 'Clinic Administrator',
        role: 'ADMIN',
        tenantId: approved.tenantId,
      }
      return {
        status: 'approved',
        registration: approved,
        tokens: mockTokens,
        user: mockUser,
        clinic: {
          id: approved.tenantId || approved.id,
          name: approved.clinicName,
          slug: approved.subdomain,
        },
      }
    }

    const rejected = (registry.rejected || []).find(
      (r) => r.id === cleanId || r.tenantId === cleanId || r.subdomain === cleanId || r.email?.toLowerCase() === cleanId.toLowerCase()
    )
    if (rejected) {
      return {
        status: 'rejected',
        rejectionReason: rejected.rejectionReason || 'Registration criteria not met',
        rejectedAt: rejected.rejectedAt || new Date().toISOString(),
        registration: {
          id: rejected.id,
          tenantId: rejected.tenantId,
          clinicName: rejected.clinicName,
          subdomain: rejected.subdomain,
          adminName: rejected.adminName,
          email: rejected.email,
          status: 'rejected',
          submittedAt: rejected.submittedAt,
        },
      }
    }

    const pending = (registry.pending || []).find(
      (r) => r.id === cleanId || r.tenantId === cleanId || r.subdomain === cleanId || r.email?.toLowerCase() === cleanId.toLowerCase()
    )
    if (pending) {
      return {
        status: 'pending',
        registration: {
          id: pending.id,
          tenantId: pending.tenantId,
          clinicName: pending.clinicName,
          subdomain: pending.subdomain,
          adminName: pending.adminName,
          email: pending.email,
          status: 'pending',
          submittedAt: pending.submittedAt,
        },
      }
    }

    throw new NotFoundError('Registration request not found')
  }

  /**
   * Get all pending registrations for Super Admin review (both local registry and PostgreSQL)
   */
  static async getPendingRegistrations() {
    const registry = readLocalRegistry()
    const pending = [...(registry.pending || [])]

    try {
      const pendingTenants = await prisma.tenant.findMany({
        where: { status: { in: ['PENDING', 'SUSPENDED'] } },
        include: { users: true, clinicCategory: true },
        take: 50,
      })

      for (const t of pendingTenants) {
        const adminUser = t.users.find((u) => u.userType === 'ADMIN') || t.users[0]
        const existsInLocal = pending.some((p) => p.subdomain === t.subdomain || p.tenantId === t.id || p.id === t.id)
        if (!existsInLocal) {
          pending.push({
            id: t.id,
            tenantId: t.id,
            clinicName: t.name,
            subdomain: t.subdomain,
            adminName: adminUser ? adminUser.fullName : 'Clinic Administrator',
            email: adminUser ? adminUser.email : (t.contactEmail || ''),
            phone: adminUser?.phone || '',
            specialty: t.clinicCategory?.name || 'Multispecialty & General Care',
            clinicCategoryName: t.clinicCategory?.name || null,
            clinicCategoryId: t.clinicCategoryId || null,
            region: t.region || 'Asia / India (INR ₹)',
            plan: t.plan || 'Professional',
            status: 'pending',
            submittedAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
          })
        }
      }
    } catch (e) {
      logger.warn('Could not query PostgreSQL for pending tenants:', e.message)
    }

    // Also sync pending registrations into PostgreSQL notifications table
    try {
      for (const item of pending) {
        const entityId = item.tenantId || item.id
        if (entityId) {
          const existingNotif = await prisma.notification.findFirst({
            where: { entityId },
          })
          if (!existingNotif) {
            await NotificationService.createNotification({
              type: 'CLINIC_REGISTRATION_PENDING',
              title: `New Clinic Registration: ${item.clinicName}`,
              message: `${item.adminName} submitted a new clinic registration for "${item.clinicName}" (${item.subdomain}.clinic.io).`,
              entityType: 'REGISTRATION',
              entityId,
              data: item,
            })
          }
        }
      }
    } catch (syncErr) {
      logger.warn('Could not sync pending registrations into PostgreSQL notifications:', syncErr.message)
    }

    return {
      registrations: pending,
      total: pending.length,
    }
  }

  /**
   * Approve a pending registration (Super Admin)
   */
  static async approveRegistration(id) {
    if (!id) throw new ValidationError('Registration ID is required')

    const registry = readLocalRegistry()
    const regIndex = (registry.pending || []).findIndex((r) => r.id === id || r.tenantId === id)

    let reg = null
    if (regIndex !== -1) {
      reg = registry.pending[regIndex]
      reg.status = 'approved'
      reg.approvedAt = new Date().toISOString()

      registry.pending.splice(regIndex, 1)
      if (!registry.approved) registry.approved = []
      registry.approved.unshift(reg)
      writeLocalRegistry(registry)
    }

    // Synchronize or activate in PostgreSQL via transaction
    try {
      const targetTenantId = reg?.tenantId || id
      const existingTenant = await prisma.tenant.findUnique({
        where: { id: targetTenantId },
      })

      if (existingTenant) {
        await SuperadminService.approveTenantTransaction(targetTenantId)
      } else if (reg) {
        // Provision directly into PostgreSQL if not yet created
        const newTenant = await prisma.tenant.create({
          data: {
            name: reg.clinicName,
            subdomain: reg.subdomain,
            domain: `${reg.subdomain}.clinic.io`,
            plan: reg.plan || 'Professional',
            status: 'PENDING',
            region: reg.region || 'Asia / India (INR ₹)',
            contactEmail: reg.email,
            clinicCategoryId: reg.clinicCategoryId || null,
          },
        })

        await prisma.user.create({
          data: {
            tenantId: newTenant.id,
            email: reg.email,
            passwordHash: reg.passwordHash,
            fullName: reg.adminName,
            phone: reg.phone,
            status: 'INVITED',
            userType: 'ADMIN',
          },
        })

        reg.tenantId = newTenant.id
        writeLocalRegistry(registry)
        await SuperadminService.approveTenantTransaction(newTenant.id)
      }
    } catch (e) {
      logger.warn('Could not update PostgreSQL tenant status upon approval:', e.message)
    }

    const clinicName = reg ? reg.clinicName : 'Clinic'
    return {
      success: true,
      message: `Registration for "${clinicName}" approved and workspace activated!`,
      registration: reg || { id, status: 'approved' },
    }
  }

  /**
   * Reject a pending registration (Super Admin)
   */
  static async rejectRegistration(id, reason = 'Registration criteria not met') {
    if (!id) throw new ValidationError('Registration ID is required')

    const registry = readLocalRegistry()
    const regIndex = (registry.pending || []).findIndex((r) => r.id === id || r.tenantId === id)

    let reg = null
    if (regIndex !== -1) {
      reg = registry.pending[regIndex]
      reg.status = 'rejected'
      reg.rejectedAt = new Date().toISOString()
      reg.rejectionReason = reason

      registry.pending.splice(regIndex, 1)
      if (!registry.rejected) registry.rejected = []
      registry.rejected.unshift(reg)
      writeLocalRegistry(registry)
    }

    try {
      const targetTenantId = reg?.tenantId || id
      await SuperadminService.rejectTenant(targetTenantId, reason)
    } catch (e) {
      logger.warn('Could not update PostgreSQL tenant status upon rejection:', e.message)
    }

    const clinicName = reg ? reg.clinicName : 'Clinic'
    return {
      success: true,
      message: `Registration for "${clinicName}" has been rejected.`,
      registration: reg || { id, status: 'rejected', rejectionReason: reason },
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
          tenantId: tenant?.id || null,
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
          }).catch(() => {})
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
