import React, { useState, useEffect, useRef } from 'react'
import {
  FileImage,
  Upload,
  ZoomIn,
  Sliders,
  Calendar,
  Eye,
  CheckCircle,
  FileText,
  Scan,
  Download,
  Trash2,
  X,
  Plus,
  User,
  AlertCircle
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'
import { api } from '../../lib/api'

export const XrayRecordsPage = () => {
  const [scans, setScans] = useState([])
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedScanIndex, setSelectedScanIndex] = useState(0)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileUrlMap, setFileUrlMap] = useState({})

  // Form State
  const [patientId, setPatientId] = useState('')
  const [type, setType] = useState('Digital Panoramic (OPG)')
  const [region, setRegion] = useState('Full Maxillofacial Arch')
  const [acquisitionDate, setAcquisitionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [radiologist, setRadiologist] = useState('Dr. Neha Sharma, MDS')
  const [findings, setFindings] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const fileInputRef = useRef(null)

  // Fetch X-Ray Records & Patients list
  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/api/dental/xrays')
      const records = res.data?.data || []
      setScans(records)
      if (records.length > 0 && selectedScanIndex >= records.length) {
        setSelectedScanIndex(0)
      }
    } catch (err) {
      console.error('Failed to load X-ray records:', err)
      notify.error(err.response?.data?.message || 'Failed to load X-ray records')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await api.get('/api/staff/patients')
      setPatients(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to fetch patients:', err)
    }
  }

  useEffect(() => {
    fetchRecords()
    fetchPatients()
  }, [])

  const current = scans[selectedScanIndex]

  // Load preview blob URL for current selected scan
  useEffect(() => {
    if (current?.id && !fileUrlMap[current.id]) {
      api
        .get(`/api/dental/xrays/${current.id}/file`, { responseType: 'blob' })
        .then((res) => {
          const url = URL.createObjectURL(res.data)
          setFileUrlMap((prev) => ({ ...prev, [current.id]: url }))
        })
        .catch((err) => {
          console.error('Error fetching scan file blob:', err)
        })
    }
  }, [current?.id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 50MB size check
    if (file.size > 50 * 1024 * 1024) {
      notify.error('File size exceeds the 50 MB limit.')
      return
    }

    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'dcm']
    if (!allowed.includes(ext)) {
      notify.error('Invalid file format. Allowed: PDF, PNG, JPG, JPEG, DICOM (.dcm)')
      return
    }

    setSelectedFile(file)
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      notify.error('Please select an X-Ray radiograph file.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('patientId', patientId)
      formData.append('type', type)
      formData.append('region', region)
      formData.append('acquisitionDate', acquisitionDate)
      formData.append('radiologist', radiologist)
      formData.append('findings', findings)

      await api.post('/api/dental/xrays', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      notify.success('Radiograph uploaded successfully!')
      setShowUploadModal(false)
      // Reset form
      setSelectedFile(null)
      setFindings('')
      fetchRecords()
    } catch (err) {
      console.error('Upload failed:', err)
      notify.error(err.response?.data?.message || 'Failed to upload radiograph')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async (record) => {
    if (!record) return
    try {
      notify.info('Preparing download...')
      const res = await api.get(`/api/dental/xrays/${record.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', record.fileName || `XRay-${record.code}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify.success('Download started')
    } catch (err) {
      console.error('Download error:', err)
      notify.error('Failed to download original file')
    }
  }

  const handleOpenFull = async (record) => {
    if (!record) return
    try {
      if (fileUrlMap[record.id]) {
        window.open(fileUrlMap[record.id], '_blank')
      } else {
        const res = await api.get(`/api/dental/xrays/${record.id}/file`, {
          responseType: 'blob',
        })
        const url = URL.createObjectURL(res.data)
        setFileUrlMap((prev) => ({ ...prev, [record.id]: url }))
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('View file error:', err)
      notify.error('Failed to open file viewer')
    }
  }

  const handleDelete = async (record) => {
    if (!record) return
    if (!window.confirm(`Are you sure you want to delete scan ${record.code}?`)) {
      return
    }

    try {
      await api.delete(`/api/dental/xrays/${record.id}`)
      notify.success(`Scan ${record.code} deleted successfully.`)
      fetchRecords()
    } catch (err) {
      console.error('Delete error:', err)
      notify.error(err.response?.data?.message || 'Failed to delete scan record')
    }
  }

  const renderFilePreview = (record) => {
    if (!record) return null
    const mime = (record.fileMime || '').toLowerCase()
    const name = (record.fileName || '').toLowerCase()
    const isImage =
      mime.startsWith('image/') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg')
    const isPdf = mime.includes('pdf') || name.endsWith('.pdf')
    const isDicom = name.endsWith('.dcm') || mime.includes('dicom')

    const fileBlobUrl = fileUrlMap[record.id]

    if (isImage && fileBlobUrl) {
      return (
        <img
          src={fileBlobUrl}
          alt={record.type}
          className="w-full h-full object-contain rounded-xl max-h-[300px]"
        />
      )
    }

    if (isPdf && fileBlobUrl) {
      return (
        <iframe
          src={fileBlobUrl}
          title={record.fileName || 'X-Ray Document'}
          className="w-full h-full rounded-xl border-0"
        />
      )
    }

    if (isDicom) {
      return (
        <div className="relative z-10 flex flex-col items-center justify-center space-y-3 p-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <FileText className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-white uppercase tracking-widest block">
              DICOM MEDICAL RADIOGRAPH • {record.code}
            </span>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              File: {record.fileName} ({Math.round((record.fileSize || 0) / 1024)} KB)
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 block font-mono">
              DICOM Standard Storage • High Resolution 300+ DPI
            </span>
          </div>
        </div>
      )
    }

    // Default visualization preview
    return (
      <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Scan className="w-10 h-10 animate-pulse" />
        </div>
        <div className="text-center">
          <span className="font-mono text-xs font-bold text-white uppercase tracking-widest block">
            DIGITAL RADIOGRAPH FEED • {record.code}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Format: {record.fileName} • {record.fileMime || 'Medical Image'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Digital Dental X-Ray & Imaging
            </h1>
            <Badge variant="primary" size="sm">
              DICOM & Radiographic Vault
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Digital Panoramic (OPG), Intraoral Periapical (IOPA), Bitewings & 3D CBCT Imaging
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setShowUploadModal(true)}
          >
            Upload New Radiograph
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scans List */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft space-y-3">
          <h3 className="font-heading font-bold text-sm text-text-primary mb-3 flex items-center justify-between">
            <span>Radiographic Archive</span>
            <span className="text-xs font-normal text-text-secondary">
              ({scans.length} Scans)
            </span>
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-text-secondary">
              Loading radiograph records...
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-secondary border border-dashed border-border rounded-xl">
              No X-Ray records found. Click "Upload New Radiograph" to add one.
            </div>
          ) : (
            scans.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedScanIndex(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedScanIndex === idx
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold text-text-primary shadow-sm'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-primary">{s.code}</span>
                  <span className="text-[10px] text-text-secondary flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {s.acquisitionDate
                      ? new Date(s.acquisitionDate).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : s.date || 'N/A'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-text-primary truncate">{s.type}</h4>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-text-secondary truncate">{s.region}</p>
                  {s.patient?.fullName && (
                    <span className="text-[10px] text-primary/80 font-medium truncate ml-2">
                      {s.patient.fullName}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Radiograph Viewer & Diagnosis */}
        <div className="xl:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
          {current ? (
            <>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-text-primary">
                      {current.type}
                    </h3>
                    <span className="font-mono text-xs font-bold text-primary">[{current.code}]</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Acquired on{' '}
                    {current.acquisitionDate
                      ? new Date(current.acquisitionDate).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : current.date}{' '}
                    • {current.region}
                    {current.patient?.fullName && (
                      <span className="ml-2 font-medium text-text-primary">
                        (Patient: {current.patient.fullName})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">
                    {current.status || 'Verified & Signed'}
                  </Badge>
                </div>
              </div>

              {/* Radiographic Image / Document Viewer Box */}
              <div className="relative w-full h-80 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col items-center justify-center p-4 text-neutral-300">
                {/* Grid line background overlay */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#26A689_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Dynamic File Rendering */}
                {renderFilePreview(current)}

                {/* Viewer Controls Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-300">
                  <span className="font-mono text-[10px] text-neutral-400 truncate max-w-[200px]">
                    {current.fileName} ({Math.round((current.fileSize || 0) / 1024)} KB)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenFull(current)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] flex items-center gap-1 text-white transition-colors"
                      title="View / Open File"
                    >
                      <Eye className="w-3 h-3 text-primary" /> View / Open
                    </button>
                    <button
                      onClick={() => handleDownload(current)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] flex items-center gap-1 text-white transition-colors"
                      title="Download Original File"
                    >
                      <Download className="w-3 h-3 text-emerald-400" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(current)}
                      className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-[11px] flex items-center gap-1 text-rose-300 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Diagnostic Findings */}
              <div className="p-4 rounded-xl bg-surface-hover/30 border border-border space-y-2">
                <span className="text-xs font-semibold text-text-secondary block">
                  Radiologist / Clinician Evaluation:
                </span>
                <p className="text-xs text-text-primary leading-relaxed">
                  {current.findings || 'No specific diagnostic findings recorded for this radiograph.'}
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                  <span>
                    Interpreting Clinician:{' '}
                    <strong className="text-text-primary">
                      {current.radiologist || 'Dr. Neha Sharma, MDS'}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                    <CheckCircle className="w-3 h-3" /> Electronically Signed
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center text-xs text-text-secondary border border-dashed border-border rounded-xl">
              Select a scan from the archive to view details.
            </div>
          )}
        </div>
      </div>

      {/* Upload New Radiograph Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover/20">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-base text-text-primary">
                  Upload New Radiograph
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Select Patient (Optional) --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.name} ({p.patientCode || p.phone || 'Patient'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Radiograph Type */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    X-Ray Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    <option value="Digital Panoramic (OPG)">Digital Panoramic (OPG)</option>
                    <option value="Periapical (IOPA) Radiograph">Periapical (IOPA) Radiograph</option>
                    <option value="Bitewing Series (Bite-wing R & L)">Bitewing Series</option>
                    <option value="Lateral Cephalometric Scan">Lateral Cephalometric</option>
                    <option value="CBCT 3D Maxillofacial Scan">CBCT 3D Scan</option>
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Anatomical Region <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Full Arch, Tooth #19"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Acquisition Date */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Acquisition Date
                  </label>
                  <input
                    type="date"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Radiologist */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Interpreting Radiologist
                  </label>
                  <input
                    type="text"
                    value={radiologist}
                    onChange={(e) => setRadiologist(e.target.value)}
                    placeholder="e.g. Dr. Neha Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Radiograph File (PDF, PNG, JPG, JPEG, .DCM max 50MB){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-border hover:border-primary/50 bg-surface-hover/20 p-4 rounded-xl text-center transition-all"
                >
                  <Upload className="w-6 h-6 text-primary mx-auto mb-1" />
                  {selectedFile ? (
                    <div className="text-xs text-text-primary font-semibold">
                      {selectedFile.name}{' '}
                      <span className="text-text-secondary font-normal">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-text-secondary">
                      Click to choose file or drag & drop here
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dcm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Findings */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Clinical Findings & Evaluation
                </label>
                <textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows={3}
                  placeholder="Enter diagnostic notes or radiological findings..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Save Radiograph
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default XrayRecordsPage

