import fs from 'fs'
import path from 'path'
import { prisma } from '../config/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

export class DentalService {
  /**
   * List X-Ray records for current tenant
   */
  static async getXrayRecords(tenantId, { patientId, search } = {}) {
    const where = { tenantId }

    if (patientId) {
      where.patientId = patientId
    }

    if (search && search.trim()) {
      const q = search.trim()
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
        { region: { contains: q, mode: 'insensitive' } },
        { findings: { contains: q, mode: 'insensitive' } },
        { radiologist: { contains: q, mode: 'insensitive' } },
        { patient: { fullName: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const records = await prisma.xrayRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, mrn: true, fullName: true },
        },
      },
    })

    return records.map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      date: new Date(r.acquisitionDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      rawDate: r.acquisitionDate,
      region: r.region || 'Full Maxillofacial Arch',
      radiologist: r.radiologist || 'Staff Radiologist',
      findings: r.findings || 'No abnormal radiolucency noted.',
      status: r.status || 'Verified & Signed',
      aspect: r.aspect || 'Panoramic 16:9',
      fileName: r.fileName,
      fileMime: r.fileMime,
      fileSize: r.fileSize,
      patientId: r.patientId,
      patientName: r.patient?.fullName || 'General Patient',
      hasBuffer: Boolean(r.fileData || r.filePath),
    }))
  }

  /**
   * Get single X-Ray record metadata by ID
   */
  static async getXrayRecordById(tenantId, id) {
    const record = await prisma.xrayRecord.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: { id: true, mrn: true, fullName: true },
        },
      },
    })

    if (!record) {
      throw new NotFoundError('X-Ray record not found')
    }

    return record
  }

  /**
   * Create X-Ray record with uploaded file (Stores in Railway PostgreSQL as Bytes)
   */
  static async createXrayRecord(tenantId, createdById, { patientId, type, region, acquisitionDate, radiologist, findings, status, aspect }, file) {
    if (!file) {
      throw new ValidationError('File upload is required (.dcm, .png, .jpg, .jpeg, .pdf)')
    }

    if (!type || !type.trim()) {
      throw new ValidationError('Radiograph type is required')
    }

    // Auto-generate code (XR-XXXX)
    const count = await prisma.xrayRecord.count({ where: { tenantId } })
    const code = `XR-${String(9000 + count + 1).padStart(4, '0')}`

    const record = await prisma.xrayRecord.create({
      data: {
        tenantId,
        patientId: patientId || null,
        code,
        type: type.trim(),
        region: region ? region.trim() : 'Full Maxillofacial Arch',
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
        radiologist: radiologist ? radiologist.trim() : 'Staff Radiologist',
        findings: findings ? findings.trim() : 'Radiographic scan acquired and filed.',
        status: status || 'Verified & Signed',
        aspect: aspect || 'Panoramic 16:9',
        fileName: file.originalname,
        fileMime: file.mimetype || 'application/octet-stream',
        fileSize: file.size,
        fileData: file.buffer, // Persisted directly in Railway PostgreSQL bytea column
        filePath: file.path || null,
        createdById,
      },
    })

    return record
  }

  /**
   * Delete X-Ray record
   */
  static async deleteXrayRecord(tenantId, id) {
    const record = await prisma.xrayRecord.findFirst({
      where: { id, tenantId },
    })

    if (!record) {
      throw new NotFoundError('X-Ray record not found')
    }

    if (record.filePath && fs.existsSync(record.filePath)) {
      try {
        fs.unlinkSync(record.filePath)
      } catch (e) {
        // Log & ignore disk cleanup failure
      }
    }

    await prisma.xrayRecord.delete({
      where: { id },
    })

    return { success: true, id }
  }
}
