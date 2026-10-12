import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Info,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { notify } from '../../../components/ui/Toast'
import { api } from '../../../lib/api'

export const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [createNewBatch, setCreateNewBatch] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'valid' | 'errors' | 'warnings'
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef(null)

  // Reset state when closing or resetting
  const handleReset = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setImportResult(null)
    setIsValidating(false)
    setIsImporting(false)
    setActiveFilter('all')
    setSearchTerm('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // 1. DOWNLOAD IMPORT TEMPLATE
  const handleDownloadTemplate = async () => {
    try {
      notify.info('Preparing Pharmacy Inventory template...')
      const res = await api.get('/api/pharmacy/inventory/import-template', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Pharmacy_Inventory_Import_Template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      notify.success('Template downloaded successfully!')
    } catch (err) {
      console.error('Template download error:', err)
      notify.error('Failed to download template. Please try again.')
    }
  }

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0])
    }
  }

  const handleFileSelected = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileName = file.name.toLowerCase()
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValidExt) {
      notify.error('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('File exceeds maximum size limit of 5MB.')
      return
    }

    setSelectedFile(file)
    // Automatically trigger validation preview
    runValidationPreview(file, createNewBatch)
  }

  // 2. UPLOAD & PARSE (DRY-RUN VALIDATION)
  const runValidationPreview = async (file, isNewBatch) => {
    setIsValidating(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('action', 'preview')
    formData.append('createNewBatch', isNewBatch ? 'true' : 'false')

    try {
      const res = await api.post(
        `/api/pharmacy/inventory/bulk-import?dryRun=true&createNewBatch=${isNewBatch}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      if (res.data && res.data.summary) {
        setPreviewData(res.data)
        if (res.data.summary.errorRowsCount > 0) {
          notify.warning(
            `Found ${res.data.summary.validRowsCount} valid rows and ${res.data.summary.errorRowsCount} rows with errors.`
          )
        } else {
          notify.success(`All ${res.data.summary.validRowsCount} rows validated successfully!`)
        }
      }
    } catch (err) {
      console.error('Validation error:', err)
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || 'Failed to parse and validate spreadsheet.'
      notify.error(errorMsg)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setIsValidating(false)
    }
  }

  // 3. COMMIT IMPORT VALID ROWS
  const handleCommitImport = async () => {
    if (!previewData || !previewData.validRows || previewData.validRows.length === 0) {
      notify.error('No valid rows available to import.')
      return
    }

    setIsImporting(true)
    try {
      const payload = {
        commit: true,
        validRows: previewData.validRows,
        createNewBatch
      }

      const res = await api.post('/api/pharmacy/inventory/bulk-import', payload)
      if (res.data && res.data.success) {
        setImportResult(res.data)
        notify.success(
          `${res.data.importedCount} drugs imported successfully (${res.data.createdCount} new, ${res.data.updatedCount} updated).`
        )
        if (previewData.summary.errorRowsCount > 0) {
          notify.info(`${previewData.summary.errorRowsCount} rows were skipped due to compliance errors.`)
        }
        if (onSuccess) {
          onSuccess(res.data)
        }
      }
    } catch (err) {
      console.error('Commit import error:', err)
      const errorMsg = err.response?.data?.message || 'Failed to commit bulk import to database.'
      notify.error(errorMsg)
    } finally {
      setIsImporting(false)
    }
  }

  // 4. DOWNLOAD ERROR REPORT
  const handleDownloadErrorReport = async () => {
    if (!previewData || !previewData.rows) return
    const failedRows = previewData.rows.filter((r) => !r.isValid)
    if (failedRows.length === 0) {
      notify.info('There are no failed rows to report.')
      return
    }

    try {
      notify.info('Generating Error Report...')
      const res = await api.post(
        '/api/pharmacy/inventory/error-report',
        { failedRows },
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Pharmacy_Import_Errors_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      notify.success('Error Report downloaded!')
    } catch (err) {
      console.error('Error report download failed:', err)
      notify.error('Failed to download error report.')
    }
  }

  // Filter rows for preview table
  const filteredRows = (previewData?.rows || []).filter((r) => {
    // Filter by tab
    if (activeFilter === 'valid' && !r.isValid) return false
    if (activeFilter === 'errors' && r.isValid) return false
    if (activeFilter === 'warnings' && (!r.warnings || r.warnings.length === 0)) return false

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const d = r.data || {}
      const matchesSearch =
        (d.name && d.name.toLowerCase().includes(term)) ||
        (d.brandName && d.brandName.toLowerCase().includes(term)) ||
        (d.batchNumber && d.batchNumber.toLowerCase().includes(term)) ||
        (d.schedule && d.schedule.toLowerCase().includes(term)) ||
        (r.errors && r.errors.some((e) => e.toLowerCase().includes(term))) ||
        (r.warnings && r.warnings.some((w) => w.toLowerCase().includes(term)))

      if (!matchesSearch) return false
    }

    return true
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Pharmacy Stock & Medications"
      description="Upload pre-formatted Excel (.xlsx) or CSV files with India D&C Act & Schedule verification"
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5">
        {/* TOP COMPLIANCE NOTICE & TEMPLATE LINK */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-text-primary">India D&C Act & DPCO Compliant Import</span>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Checks expiry dates (Section 27), Schedule H/H1/X compliance, duplicate batches, and ceiling prices.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={handleDownloadTemplate}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="shrink-0 font-medium"
          >
            Download Import Template
          </Button>
        </div>

        {/* STEP 1: FILE UPLOAD ZONE (WHEN NO PREVIEW OR VALIDATING) */}
        {!previewData && !importResult && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-primary bg-primary/10 scale-[0.99]'
                  : 'border-border hover:border-primary/50 hover:bg-surface/60 bg-surface/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  {isValidating ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-primary" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {isValidating
                      ? 'Parsing and verifying spreadsheet compliance...'
                      : 'Drag and drop your spreadsheet here, or browse'}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Supports <span className="font-mono text-text-primary font-bold">.xlsx</span>,{' '}
                    <span className="font-mono text-text-primary font-bold">.csv</span> up to 5MB (Max 5,000 rows)
                  </p>
                </div>

                {!isValidating && (
                  <Button size="sm" variant="primary" className="mt-2 pointer-events-none">
                    Select File
                  </Button>
                )}
              </div>
            </div>

            {/* BATCH DUPLICATE BEHAVIOR TOGGLE */}
            <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-text-secondary shrink-0" />
                <div>
                  <span className="font-medium text-text-primary">Duplicate Batch Handling</span>
                  <p className="text-[11px] text-text-secondary">
                    When a matching Drug Name + Batch Number already exists in your inventory:
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="batchHandling"
                    checked={!createNewBatch}
                    onChange={() => setCreateNewBatch(false)}
                    className="text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="text-text-primary font-medium">Update & Add Stock (Default)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="batchHandling"
                    checked={createNewBatch}
                    onChange={() => setCreateNewBatch(true)}
                    className="text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="text-text-primary font-medium">Create as New Batch</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW TABLE & VERIFICATION SUMMARY */}
        {previewData && !importResult && (
          <div className="space-y-4">
            {/* METRICS SUMMARY CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-border bg-surface/50">
                <div className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">
                  Total Processed
                </div>
                <div className="text-xl font-extrabold text-text-primary mt-0.5">
                  {previewData.summary.totalRows}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid Rows
                </div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {previewData.summary.validRowsCount}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
                <div className="text-[11px] text-rose-600 dark:text-rose-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Errors (Skipped)
                </div>
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                  {previewData.summary.errorRowsCount}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Warnings
                </div>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {previewData.summary.warningRowsCount}
                </div>
              </div>
            </div>

            {/* FILTER TABS & SEARCH BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  All Rows ({previewData.summary.totalRows})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('valid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'valid'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-text-secondary hover:text-emerald-600 hover:bg-emerald-500/10'
                  }`}
                >
                  Valid Only ({previewData.summary.validRowsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('errors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'errors'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-text-secondary hover:text-rose-600 hover:bg-rose-500/10'
                  }`}
                >
                  Errors ({previewData.summary.errorRowsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('warnings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'warnings'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-text-secondary hover:text-amber-600 hover:bg-amber-500/10'
                  }`}
                >
                  Warnings ({previewData.summary.warningRowsCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search preview rows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
                />

                {previewData.summary.errorRowsCount > 0 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="xs"
                    onClick={handleDownloadErrorReport}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="shrink-0"
                  >
                    Download Error Report
                  </Button>
                )}
              </div>
            </div>

            {/* PREVIEW DATA TABLE */}
            <div className="border border-border rounded-xl overflow-hidden max-h-80 overflow-y-auto bg-surface/50">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface border-b border-border text-text-secondary font-semibold uppercase text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Medication & Brand</th>
                    <th className="py-2.5 px-3">Batch & Exp</th>
                    <th className="py-2.5 px-3">Schedule</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">MRP</th>
                    <th className="py-2.5 px-3">Validation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-text-secondary">
                        No rows match current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const d = row.data || {}
                      return (
                        <tr
                          key={row.rowNumber}
                          className={`transition-colors ${
                            !row.isValid
                              ? 'bg-rose-500/5 hover:bg-rose-500/10'
                              : row.warnings?.length > 0
                              ? 'bg-amber-500/5 hover:bg-amber-500/10'
                              : 'hover:bg-surface'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary">
                            #{row.rowNumber}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Error
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-text-primary">{d.name || 'Unnamed Drug'}</div>
                            {d.brandName && (
                              <div className="text-[10px] text-text-secondary">Brand: {d.brandName}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-mono text-[11px] text-text-primary">
                              {d.batchNumber || '-'}
                            </div>
                            <div className="text-[10px] text-text-secondary">
                              Exp: {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge
                              size="sm"
                              variant={
                                d.schedule === 'H1' || d.schedule === 'X'
                                  ? 'danger'
                                  : d.schedule === 'H'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              Schedule {d.schedule || 'OTC'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-text-primary whitespace-nowrap">
                            {(d.stockQuantity ?? 0).toLocaleString()} {d.unit || 'Units'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-text-primary whitespace-nowrap">
                            ₹{(d.sellingPrice ?? 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            {row.errors && row.errors.length > 0 && (
                              <div className="space-y-1">
                                {row.errors.map((err, i) => (
                                  <div
                                    key={i}
                                    className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-start gap-1"
                                  >
                                    <span className="text-rose-500">•</span>
                                    <span>{err}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {row.warnings && row.warnings.length > 0 && (
                              <div className="space-y-1 mt-1">
                                {row.warnings.map((warn, i) => (
                                  <div
                                    key={i}
                                    className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-start gap-1"
                                  >
                                    <span className="text-amber-500">•</span>
                                    <span>{warn}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {row.isValid && (!row.warnings || row.warnings.length === 0) && (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                Ready to import
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ACTION BAR: COMMIT VS CANCEL */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
              <div className="text-xs text-text-secondary">
                File: <span className="font-mono text-text-primary font-medium">{selectedFile?.name}</span>{' '}
                ({(selectedFile?.size / 1024).toFixed(1)} KB)
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  disabled={isImporting}
                  className="flex-1 sm:flex-none"
                >
                  Choose Different File
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCommitImport}
                  disabled={isImporting || previewData.summary.validRowsCount === 0}
                  leftIcon={
                    isImporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                  }
                  className="flex-1 sm:flex-none shadow-sm"
                >
                  {isImporting
                    ? 'Importing...'
                    : `Import ${previewData.summary.validRowsCount} Valid Rows`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION STATE */}
        {importResult && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-text-primary">Bulk Import Completed Successfully</h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                {importResult.message ||
                  `${importResult.importedCount} medications were successfully written to the database.`}
              </p>
            </div>

            <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 rounded-xl bg-surface border border-border text-xs">
              <div className="text-text-secondary">
                Batch ID: <span className="font-mono font-bold text-text-primary">{importResult.importBatchId}</span>
              </div>
              <div className="text-text-secondary">•</div>
              <div className="text-text-secondary">
                New Records: <span className="font-bold text-emerald-500">{importResult.createdCount}</span>
              </div>
              <div className="text-text-secondary">•</div>
              <div className="text-text-secondary">
                Updated Batches: <span className="font-bold text-primary">{importResult.updatedCount}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="button" variant="primary" size="sm" onClick={handleClose}>
                Done & View Inventory
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BulkImportModal
