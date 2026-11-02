import { prisma } from '../src/config/prisma.js'

async function removeImplantRegistry() {
  try {
    const deleted = await prisma.module.deleteMany({
      where: { key: 'implant_registry' },
    })
    console.log(`Successfully removed implant_registry module (${deleted.count} record(s) deleted).`)
  } catch (error) {
    console.error('Error removing implant_registry module:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

removeImplantRegistry()

