import React, { useState, useMemo, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Boxes, Plus, CheckCircle2, Pill, Download, FileSpreadsheet } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { notify } from '../../components/ui/Toast'
import { PermissionAction } from '../../components/common/PermissionAction'
import { BulkImportModal } from './components/BulkImportModal'

// Lazy load fulfillment modal
const PharmacyFulfillModal = lazy(() =>
  import('./components/PharmacyFulfillModal').then((m) => ({ default: m.PharmacyFulfillModal }))
)

export const InventoryPage = () => {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' | 'prescriptions'
  const [selectedFulfillRx, setSelectedFulfillRx] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)

  const initialFormData = {
    itemCode: '',
    name: '',
    category: '',
    newCategory: '',
    stockQuantity: '',
    unit: '',
    minReorderThreshold: '',
    batchNumber: '',
    expiryDate: '',
    unitCost: '',
    sellingPrice: '',
  }

  const [formData, setFormData] = useState(initialFormData)
  const [formErrors, setFormErrors] = useState({})

  const handleOpenAdd = () => {
    setFormData(initialFormData)
    setFormErrors({})
    setIsAddOpen(true)
  }

  const handleDownloadTemplate = async () => {
    try {
      notify.info('Preparing Pharmacy Inventory template...')
      const res = await api.get('/api/pharmacy/inventory/import-template', {
        responseType: 'blob',
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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff', 'inventory'],
    queryFn: async () => {
      const res = await api.get('/api/staff/inventory')
      return res.data
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 1,
  })

  const { data: rxData, isLoading: isRxLoading } = useQuery({
    queryKey: ['staff', 'prescriptions'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/staff/prescriptions')
        return res.data?.prescriptions || res.data?.data || []
      } catch (err) {
        if (err.response?.status === 403) return []
        throw err
      }
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
    retry: false,
  })

  const prescriptions = Array.isArray(rxData) ? rxData : []
  const pendingRxCount = prescriptions.filter(
    (p) => p.status !== 'Fulfilled' && p.status !== 'Dispensed'
  ).length

  const inventory = Array.isArray(data) ? data : data?.inventory || data?.data || []

  // Extract distinct existing categories dynamically from inventory items
  const existingCategories = useMemo(() => {
    const set = new Set()
    inventory.forEach((item) => {
      if (item.category && typeof item.category === 'string') {
        const c = item.category.trim()
        if (c) set.add(c)
      }
    })
    return Array.from(set).sort()
  }, [inventory])

  const validateForm = () => {
    const errors = {}
    if (!formData.itemCode.trim()) errors.itemCode = 'Item Code is required'
    if (!formData.name.trim()) errors.name = 'Drug / Consumable Name is required'

    if (!formData.category) {
      errors.category = 'Please select a category'
    } else if (formData.category === '__NEW__' && !formData.newCategory.trim()) {
      errors.newCategory = 'Please enter category name'
    }

    if (!formData.unit.trim()) errors.unit = 'Unit is required'

    if (formData.stockQuantity === '' || isNaN(formData.stockQuantity) || Number(formData.stockQuantity) <= 0) {
      errors.stockQuantity = 'Quantity must be greater than 0'
    }

    if (
      formData.minReorderThreshold === '' ||
      isNaN(formData.minReorderThreshold) ||
      Number(formData.minReorderThreshold) < 0
    ) {
      errors.minReorderThreshold = 'Reorder level must be 0 or more'
    }

    if (!formData.batchNumber.trim()) errors.batchNumber = 'Batch Number is required'
    if (!formData.expiryDate) errors.expiryDate = 'Expiry Date is required'

    if (formData.unitCost === '' || isNaN(formData.unitCost) || Number(formData.unitCost) < 0) {
      errors.unitCost = 'Unit cost is required'
    }

    if (formData.sellingPrice === '' || isNaN(formData.sellingPrice) || Number(formData.sellingPrice) < 0) {
      errors.sellingPrice = 'Selling price is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/inventory', payload)
      return res.data
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] })
      setIsAddOpen(false)
      setFormData(initialFormData)
      setFormErrors({})
      notify.success(`Stock item ${item.name || 'successfully'} added!`)
    },
    onError: (err) => notify.error(err.response?.data?.message || 'Failed to add inventory item.'),
  })

  const handleSubmitAdd = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const categoryVal =
      formData.category === '__NEW__' ? formData.newCategory.trim() : formData.category.trim()

    addMutation.mutate({
      itemCode: formData.itemCode.trim(),
      name: formData.name.trim(),
      category: categoryVal,
      unit: formData.unit.trim(),
      stockQuantity: Number(formData.stockQuantity),
      minReorderThreshold: Number(formData.minReorderThreshold),
      batchNumber: formData.batchNumber.trim(),
      expiryDate: formData.expiryDate,
      unitCost: Number(formData.unitCost),
      sellingPrice: Number(formData.sellingPrice),
    })
  }

  const columns = [
    {
      key: 'name',
      label: 'Item & Brand Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-xs text-text-primary">{val}</div>
          <div className="text-[11px] font-mono text-text-secondary flex items-center gap-1.5 mt-0.5">
            <span>{row.itemCode || row.sku}</span>
            {row.brandName && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-surface border border-border text-text-secondary">
                {row.brandName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (val) => (
        <Badge
          size="sm"
          variant={
            val === 'H1' || val === 'X'
              ? 'danger'
              : val === 'H'
                ? 'warning'
                : val === 'G'
                  ? 'info'
                  : 'neutral'
          }
        >
          {val || 'OTC'}
        </Badge>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (val, row) => (
        <div>
          <span className="text-xs text-text-secondary">{val || 'General Supplies'}</span>
          {row.dosageForm && (
            <div className="text-[10px] text-text-secondary/70">
              {row.dosageForm} {row.strength ? `• ${row.strength}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'batchNumber',
      label: 'Batch & Expiry',
      render: (val, row) => (
        <div>
          <div className="font-mono text-xs text-text-primary font-medium">{val || row.batchNo || '-'}</div>
          <div className="text-[10px] text-text-secondary">
            {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : 'Active Batch'}
          </div>
        </div>
      ),
    },
    {
      key: 'stockQuantity',
      label: 'Current Stock',
      sortable: true,
      render: (val, row) => (
        <span className="font-bold text-xs text-text-primary">
          {(val ?? row.quantity ?? 0).toLocaleString()} {row.unit || 'Units'}
        </span>
      ),
    },
    {
      key: 'sellingPrice',
      label: 'Price (MRP)',
      render: (val, row) => (
        <div>
          <div className="font-bold text-xs text-text-primary">
            ₹{Number(val || row.unitPrice || 0).toFixed(2)}
          </div>
          {row.unitCost > 0 && (
            <div className="text-[10px] text-text-secondary">
              Cost: ₹{Number(row.unitCost).toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stock Status',
      render: (val) => (
        <Badge
          variant={val === 'Optimal' ? 'success' : val === 'Low Stock' ? 'warning' : 'danger'}
          size="sm"
          dot
        >
          {val || 'Optimal'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
            Pharmacy Stock & Medical Consumables
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Monitor medication levels, batch expiry thresholds, and dispensing stock records
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            leftIcon={<Download className="w-4 h-4" />}
            className="flex-1 sm:flex-none shadow-sm"
          >
            Download Template
          </Button>

          <PermissionAction action="edit">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkImportOpen(true)}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
              className="flex-1 sm:flex-none shadow-sm border-emerald-500/30 hover:bg-emerald-500/5 text-text-primary"
            >
              Bulk Import
            </Button>
          </PermissionAction>

          <PermissionAction action="edit">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0 shadow-sm"
            >
              Add Stock Item
            </Button>
          </PermissionAction>
        </div>
      </div>

      {isError && (
        <div className="p-3 rounded-xl border border-warning/30 bg-warning/5 flex items-center justify-between text-xs text-warning">
          <span>Unable to synchronize remote inventory live.</span>
          <Button size="xs" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Sub Tabs: Stock Inventory vs Prescription Dispensing */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === 'inventory'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Dispensary Stock Batches ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === 'prescriptions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Prescription Dispensing Queue</span>
          {pendingRxCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingRxCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <DataTable
          columns={columns}
          data={inventory}
          isLoading={isLoading}
          searchPlaceholder="Search inventory by drug name or item code..."
        />
      ) : (
        <DataTable
          columns={[
            {
              key: 'tokenNumber',
              label: 'Token #',
              render: (val, row) => {
                const token =
                  val ||
                  row.tokenNumber ||
                  (row.notes && row.notes.includes('[Token:')
                    ? row.notes.match(/\[Token:\s*([^\]]+)\]/)?.[1]
                    : 'TK-101')
                return (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-xs">
                    {token}
                  </span>
                )
              },
            },
            {
              key: 'patientName',
              label: 'Patient & Prescriber',
              sortable: true,
              render: (val, row) => (
                <div>
                  <div className="font-bold text-xs text-text-primary">{val}</div>
                  <div className="text-[11px] text-text-secondary">By {row.doctorName}</div>
                </div>
              ),
            },
            {
              key: 'medications',
              label: 'Medications to Dispense',
              render: (meds = []) => (
                <div className="space-y-1">
                  {meds.map((m, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-bold text-primary">{m.drug} {m.dosage}</span>{' '}
                      <span className="text-text-secondary text-[11px]">({m.frequency})</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'diagnosis',
              label: 'Clinical Diagnosis',
              render: (val) => <span className="text-xs text-text-secondary">{val}</span>,
            },
            {
              key: 'status',
              label: 'Dispense Status',
              render: (val) => {
                const isFulfilled = val === 'Fulfilled' || val === 'Dispensed'
                return (
                  <Badge variant={isFulfilled ? 'success' : 'warning'} size="sm" dot>
                    {isFulfilled ? 'Fulfilled / Dispensed' : 'Pending Dispense'}
                  </Badge>
                )
              },
            },
            {
              key: 'actions',
              label: 'Action',
              render: (_, row) => {
                const isFulfilled = row.status === 'Fulfilled' || row.status === 'Dispensed'
                return (
                  <Button
                    variant={isFulfilled ? 'ghost' : 'primary'}
                    size="xs"
                    onClick={() => setSelectedFulfillRx(row)}
                    leftIcon={isFulfilled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Boxes className="w-3.5 h-3.5" />}
                    className={!isFulfilled ? '!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-xs' : ''}
                  >
                    {isFulfilled ? 'View Dispense' : 'Fulfill & Dispense'}
                  </Button>
                )
              },
            },
          ]}
          data={prescriptions}
          isLoading={isRxLoading}
          searchPlaceholder="Search incoming prescriptions by patient or token..."
        />
      )}

      {/* Receive Stock Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setFormErrors({})
        }}
        maxWidth="max-w-3xl"
        title="Receive New Pharmacy Stock"
        description="Record newly delivered pharmaceutical batches into clinic inventory."
      >
        <form onSubmit={handleSubmitAdd} className="flex flex-col">
          <div className="space-y-4">
            {/* Section 1: Item Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Item Details
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                <Input
                  label="Item Code"
                  placeholder="MED-0001"
                  required
                  className="h-10"
                  value={formData.itemCode}
                  error={formErrors.itemCode}
                  onChange={(e) => {
                    setFormData({ ...formData, itemCode: e.target.value })
                    if (formErrors.itemCode) setFormErrors({ ...formErrors, itemCode: null })
                  }}
                />
                <Input
                  label="Drug / Consumable Name"
                  placeholder="Paracetamol 500mg"
                  required
                  className="h-10"
                  value={formData.name}
                  error={formErrors.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: null })
                  }}
                />
                <Select
                  label="Category"
                  required
                  className="h-10"
                  value={formData.category}
                  error={formErrors.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value })
                    if (formErrors.category) setFormErrors({ ...formErrors, category: null })
                  }}
                >
                  <option value="">Select a category</option>
                  {existingCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add new category</option>
                </Select>

                {formData.category === '__NEW__' && (
                  <div className="sm:col-span-3 animate-in fade-in duration-200">
                    <Input
                      label="New Category Name"
                      placeholder="e.g. Analgesics"
                      required
                      className="h-10"
                      value={formData.newCategory}
                      error={formErrors.newCategory}
                      onChange={(e) => {
                        setFormData({ ...formData, newCategory: e.target.value })
                        if (formErrors.newCategory) setFormErrors({ ...formErrors, newCategory: null })
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Stock & Batch */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Stock & Batch
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                <Input
                  label="Stock Quantity"
                  type="number"
                  placeholder="300"
                  min="1"
                  required
                  className="h-10"
                  value={formData.stockQuantity}
                  error={formErrors.stockQuantity}
                  onChange={(e) => {
                    setFormData({ ...formData, stockQuantity: e.target.value })
                    if (formErrors.stockQuantity) setFormErrors({ ...formErrors, stockQuantity: null })
                  }}
                />
                <Input
                  label="Unit"
                  placeholder="Tablets / Strips"
                  required
                  className="h-10"
                  value={formData.unit}
                  error={formErrors.unit}
                  onChange={(e) => {
                    setFormData({ ...formData, unit: e.target.value })
                    if (formErrors.unit) setFormErrors({ ...formErrors, unit: null })
                  }}
                />
                <Input
                  label="Reorder Level"
                  type="number"
                  placeholder="Alert below (e.g. 50)"
                  min="0"
                  required
                  className="h-10"
                  value={formData.minReorderThreshold}
                  error={formErrors.minReorderThreshold}
                  onChange={(e) => {
                    setFormData({ ...formData, minReorderThreshold: e.target.value })
                    if (formErrors.minReorderThreshold) setFormErrors({ ...formErrors, minReorderThreshold: null })
                  }}
                />
                <Input
                  label="Batch Number"
                  placeholder="BCH-0001"
                  required
                  className="h-10"
                  value={formData.batchNumber}
                  error={formErrors.batchNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, batchNumber: e.target.value })
                    if (formErrors.batchNumber) setFormErrors({ ...formErrors, batchNumber: null })
                  }}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  placeholder="dd-mm-yyyy"
                  required
                  className="h-10"
                  value={formData.expiryDate}
                  error={formErrors.expiryDate}
                  onChange={(e) => {
                    setFormData({ ...formData, expiryDate: e.target.value })
                    if (formErrors.expiryDate) setFormErrors({ ...formErrors, expiryDate: null })
                  }}
                />
              </div>
            </div>

            {/* Section 3: Pricing */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Pricing
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                <Input
                  label="Unit Cost (₹)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="0"
                  required
                  className="h-10"
                  value={formData.unitCost}
                  error={formErrors.unitCost}
                  onChange={(e) => {
                    setFormData({ ...formData, unitCost: e.target.value })
                    if (formErrors.unitCost) setFormErrors({ ...formErrors, unitCost: null })
                  }}
                />
                <Input
                  label="Selling Price (₹)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="0"
                  required
                  className="h-10"
                  value={formData.sellingPrice}
                  error={formErrors.sellingPrice}
                  onChange={(e) => {
                    setFormData({ ...formData, sellingPrice: e.target.value })
                    if (formErrors.sellingPrice) setFormErrors({ ...formErrors, sellingPrice: null })
                  }}
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 py-3.5 mt-4 bg-surface border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setIsAddOpen(false)
                setFormErrors({})
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={addMutation.isPending}
            >
              Receive Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pharmacy Fulfillment Modal */}
      {selectedFulfillRx && (
        <Suspense fallback={null}>
          <PharmacyFulfillModal
            isOpen={!!selectedFulfillRx}
            onClose={() => setSelectedFulfillRx(null)}
            prescription={selectedFulfillRx}
            onFulfillSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
              queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] })
            }}
          />
        </Suspense>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] })
        }}
      />
    </div>
  )
}

export default InventoryPage
