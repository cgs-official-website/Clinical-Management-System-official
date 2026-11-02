// Deletes the 4 dummy test users (password_hash = 'dummy', email ends with @clinic.local)
// TOGETHER with the rows that block their deletion (e.g. clinical_orders.ordered_by_id -> users).
//
// Why: deleting such a user fails with
//   'violates RESTRICT setting of foreign key constraint "clinical_orders_ordered_by_id_fkey"'
// because orders still point to the user. This script finds every table that points to the users
// (and the tables pointing to those rows, recursively), lists them, and removes them children-first
// inside ONE transaction (all or nothing).
//
// SAFE BY DEFAULT: prints the plan only. Add --apply to really delete.
//
// Usage (server folder):
//   node scripts/deleteDummyUsers.js            -> dry run (nothing deleted)
//   node scripts/deleteDummyUsers.js --apply    -> delete
import { prisma } from '../src/config/prisma.js'

const APPLY = process.argv.includes('--apply')
const q = (sql, ...params) => prisma.$queryRawUnsafe(sql, ...params)

console.log(APPLY ? '*** APPLY MODE: rows WILL be deleted ***\n' : '--- DRY RUN: nothing will be deleted (add --apply) ---\n')

// 1. which users? (only the obvious dummies, never a real bcrypt password)
const users = await q(
    `SELECT id::text AS id, email, full_name FROM users
     WHERE password_hash = 'dummy' AND email LIKE '%@clinic.local' ORDER BY email`
)
console.log(`Dummy users found: ${users.length}`)
users.forEach((u) => console.log(`   ${u.email.padEnd(40)} ${u.full_name}`))
if (!users.length) {
    await prisma.$disconnect()
    console.log('\nNothing to delete.')
    process.exit(0)
}
if (users.length > 20) {
    console.log('\nToo many matches (>20). Aborting for safety.')
    await prisma.$disconnect()
    process.exit(1)
}

// 2. find every row that depends on them (recursively)
const childFks = (table) =>
    q(
        `SELECT c.conrelid::regclass::text AS child, a.attname AS col
         FROM pg_constraint c
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
         WHERE c.contype = 'f' AND c.confrelid = $1::regclass
           AND array_length(c.conkey, 1) = 1
           AND c.confdeltype IN ('a', 'r', 'c')`, // no action / restrict / cascade (set null & set default never block)
        table
    )
const hasIdColumn = async (table) =>
    (await q(`SELECT 1 FROM pg_attribute WHERE attrelid = $1::regclass AND attname = 'id' AND NOT attisdropped`, table)).length > 0

const plan = new Map() // table -> { ids:Set, depth, col, byCol }
const visited = new Set(users.map((u) => `users:${u.id}`))

async function collect(table, ids, depth) {
    for (const fk of await childFks(table)) {
        if (fk.child === table && table === 'users') continue
        if (await hasIdColumn(fk.child)) {
            const rows = await q(
                `SELECT id::text AS id FROM ${fk.child} WHERE "${fk.col}"::text = ANY($1::text[])`,
                ids
            )
            const fresh = rows.map((r) => r.id).filter((id) => !visited.has(`${fk.child}:${id}`))
            if (!fresh.length) continue
            fresh.forEach((id) => visited.add(`${fk.child}:${id}`))
            const entry = plan.get(fk.child) || { ids: new Set(), depth: 0 }
            fresh.forEach((id) => entry.ids.add(id))
            entry.depth = Math.max(entry.depth, depth)
            plan.set(fk.child, entry)
            await collect(fk.child, fresh, depth + 1)
        } else {
            // table without an "id" column: delete by the foreign-key column (leaf only)
            const key = `${fk.child}.${fk.col}`
            const rows = await q(`SELECT 1 FROM ${fk.child} WHERE "${fk.col}"::text = ANY($1::text[])`, ids)
            if (!rows.length) continue
            const entry = plan.get(key) || { ids: new Set(), depth, byCol: { table: fk.child, col: fk.col } }
            ids.forEach((id) => entry.ids.add(id))
            entry.count = (entry.count || 0) + rows.length
            entry.depth = Math.max(entry.depth, depth)
            plan.set(key, entry)
        }
    }
}
await collect('users', users.map((u) => u.id), 1)

const ordered = [...plan.entries()].sort((a, b) => b[1].depth - a[1].depth) // deepest children first
console.log('\nRows that depend on these users (will be deleted first):')
if (!ordered.length) console.log('   (none)')
ordered.forEach(([name, e]) => console.log(`   ${name.padEnd(40)} ${e.byCol ? e.count : e.ids.size} row(s)`))

// 3. delete (children first, users last) in one transaction
if (APPLY) {
    await prisma.$transaction(
        async (tx) => {
            for (const [name, e] of ordered) {
                if (e.byCol) {
                    await tx.$executeRawUnsafe(`DELETE FROM ${e.byCol.table} WHERE "${e.byCol.col}"::text = ANY($1::text[])`, [...e.ids])
                } else {
                    await tx.$executeRawUnsafe(`DELETE FROM ${name} WHERE id::text = ANY($1::text[])`, [...e.ids])
                }
            }
            const n = await tx.$executeRawUnsafe(`DELETE FROM users WHERE id::text = ANY($1::text[])`, users.map((u) => u.id))
            console.log(`\nDeleted ${n} user(s).`)
        },
        { timeout: 60000 }
    )
}

await prisma.$disconnect()
console.log(APPLY ? '\nDone. Refresh the Railway table.' : '\nDry run finished. If the lists look right, run again with --apply.')