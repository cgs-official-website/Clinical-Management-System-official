import { prisma } from '../src/config/prisma.js'

async function runAudit() {
  const startOfYesterday = new Date('2026-09-15T00:00:00.000Z')
  const endOfYesterday = new Date('2026-09-15T23:59:59.999Z')

  console.log('=================================================================')
  console.log(' DATABASE AUDIT REPORT: DATA CREATED / USED YESTERDAY (2026-09-15)')
  console.log('=================================================================\n')

  // 1. Patients
  const patients = await prisma.patient.findMany({
    where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
    include: { tenant: { select: { name: true, subdomain: true } } },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`[1] PATIENTS CREATED YESTERDAY (${patients.length} records):`)
  patients.forEach((p, idx) => {
    console.log(`  ${idx + 1}. Name: "${p.fullName}" | MRN: ${p.mrn} | Phone: ${p.phone}`)
    console.log(`     Tenant/Clinic: "${p.tenant?.name}" (ID: ${p.tenantId})`)
    console.log(`     Created At: ${p.createdAt.toISOString()}`)
  })

  // 2. Appointments
  const appointments = await prisma.appointment.findMany({
    where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
    include: {
      patient: { select: { fullName: true } },
      tenant: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`\n[2] APPOINTMENTS CREATED YESTERDAY (${appointments.length} records):`)
  appointments.forEach((a, idx) => {
    console.log(`  ${idx + 1}. Patient: "${a.patient?.fullName}" | Reason: "${a.reason}" | Status: ${a.status}`)
    console.log(`     Tenant/Clinic: "${a.tenant?.name}" (ID: ${a.tenantId})`)
    console.log(`     Scheduled For: ${a.scheduledAt?.toISOString()} | Created At: ${a.createdAt.toISOString()}`)
  })

  // 3. Roles
  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
        { updatedAt: { gte: startOfYesterday, lte: endOfYesterday } }
      ]
    },
    include: { tenant: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' }
  })
  console.log(`\n[3] ROLES CREATED OR UPDATED YESTERDAY (${roles.length} records):`)
  roles.forEach((r, idx) => {
    console.log(`  ${idx + 1}. Role: "${r.name}" | Clinic: "${r.tenant?.name}" (ID: ${r.tenantId}) | Updated: ${r.updatedAt.toISOString()}`)
  })

  // 4. Audit Trail
  const logs = await prisma.auditLog.findMany({
    where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
    include: {
      actor: { select: { fullName: true, email: true } },
      tenant: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`\n[4] AUDIT LOG ENTRIES YESTERDAY (${logs.length} operations):`)
  logs.forEach((l, idx) => {
    console.log(`  ${idx + 1}. [${l.createdAt.toISOString()}] Action: ${l.action} | Entity: ${l.entityType}`)
    console.log(`     Actor: ${l.actor?.fullName} (${l.actor?.email}) | Clinic: "${l.tenant?.name}"`)
  })

  console.log('\n=================================================================')
  console.log(' AUDIT CONCLUSION & ROOT CAUSE IDENTIFICATION')
  console.log('=================================================================')
}

runAudit()
  .catch((err) => {
    console.error('Audit failed:', err)
  })
  .finally(() => {
    process.exit(0)
  })
