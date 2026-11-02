// Cleans junk from the Super Admin portal:
//   1. junk rows in `notifications` (e.g. "Low Stock Alert"). Real clinic-registration notifications are kept
//      unless you pass --all-notifications
//   2. test clinics (name starts with "Test " or subdomain starts with "test-")
//
// SAFE BY DEFAULT: without --apply it only PRINTS what it would delete.
//
// Usage (from the server folder):
//   node scripts/cleanupTestData.js                      -> dry run, deletes nothing
//   node scripts/cleanupTestData.js --apply              -> really deletes
//   node scripts/cleanupTestData.js --also=abc,none      -> also treat these subdomains as test clinics
//   node scripts/cleanupTestData.js --keep=gh,kmch       -> never touch these subdomains (always safe-listed)
//   node scripts/cleanupTestData.js --notifications-only | --tenants-only
//   node scripts/cleanupTestData.js --all-notifications  -> also delete real registration notifications
//
// Deleting a clinic removes ALL its data (users, patients, invoices, dental records ...).
// That is the same as clicking the trash icon on the Clinic Tenants page.
import { prisma } from '../src/config/prisma.js'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const list = (name) => {
    const a = args.find((x) => x.startsWith(`--${name}=`))
    return a ? a.split('=')[1].split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : []
}

const APPLY = flag('apply')
const ALSO = list('also')
const KEEP = new Set(['gh', 'kmch', ...list('keep')]) // always protected
const ALL_NOTIFS = flag('all-notifications')
const DO_NOTIFS = !flag('tenants-only')
const DO_TENANTS = !flag('notifications-only')

console.log(APPLY ? '*** APPLY MODE: data WILL be deleted ***\n' : '--- DRY RUN: nothing will be deleted (add --apply to delete) ---\n')

/* ---------------------------- 1. notifications ---------------------------- */
if (DO_NOTIFS) {
    const isRegistration = (n) => String(n.title || '').startsWith('New Clinic Registration')
    const notifs = await prisma.notification.findMany({ select: { id: true, type: true, title: true, isRead: true, userId: true } })
    const junk = ALL_NOTIFS ? notifs : notifs.filter((n) => !isRegistration(n))
    const summary = {}
    for (const n of junk) {
        const k = `${n.type} | ${String(n.title).slice(0, 60)}`
        summary[k] = (summary[k] || 0) + 1
    }
    console.log(`Notifications in DB: ${notifs.length} (real registration ones: ${notifs.filter(isRegistration).length})`)
    console.log(`Will delete: ${junk.length}`)
    Object.entries(summary).slice(0, 25).forEach(([k, c]) => console.log(`   ${String(c).padStart(4)} x ${k}`))
    if (APPLY && junk.length) {
        const r = await prisma.notification.deleteMany({ where: { id: { in: junk.map((n) => n.id) } } })
        console.log(`   -> deleted ${r.count} notifications\n`)
    } else console.log('')
}

/* -------------------------------- 2. tenants ------------------------------ */
if (DO_TENANTS) {
    const tenants = await prisma.tenant.findMany({
        include: {
            clinicCategory: { select: { name: true } },
            _count: { select: { patients: true, users: true } },
        },
        orderBy: { createdAt: 'asc' },
    })

    const isTest = (t) =>
        /^test\b/i.test(t.name || '') || /^test-/i.test(t.subdomain || '') || ALSO.includes((t.subdomain || '').toLowerCase())

    const targets = tenants.filter((t) => isTest(t) && !KEEP.has((t.subdomain || '').toLowerCase()))
    const kept = tenants.filter((t) => !targets.includes(t))

    console.log(`Clinics in DB: ${tenants.length}`)
    console.log('\nWILL BE KEPT:')
    kept.forEach((t) =>
        console.log(`   ${t.name.padEnd(32)} ${String(t.subdomain).padEnd(34)} ${t.status.padEnd(10)} ${t.clinicCategory?.name || '-'} (patients ${t._count.patients}, users ${t._count.users})`)
    )
    console.log('\nWILL BE DELETED:')
    if (!targets.length) console.log('   (none)')
    targets.forEach((t) =>
        console.log(`   ${t.name.padEnd(32)} ${String(t.subdomain).padEnd(34)} ${t.status.padEnd(10)} ${t.clinicCategory?.name || '-'} (patients ${t._count.patients}, users ${t._count.users})`)
    )

    if (APPLY) {
        for (const t of targets) {
            try {
                await prisma.tenant.delete({ where: { id: t.id } })
                console.log(`   deleted  ${t.subdomain}`)
            } catch (e) {
                // same fallback the trash icon uses: hide it from the active list
                await prisma.tenant.update({ where: { id: t.id }, data: { status: 'DECOMMISSIONED' } })
                console.log(`   could not hard-delete ${t.subdomain} (${e.code || e.message}); marked DECOMMISSIONED instead`)
            }
        }
    }
}

await prisma.$disconnect()
console.log(APPLY ? '\nDone. Refresh the Super Admin page.' : '\nDry run finished. If the lists look right, run again with --apply.')
