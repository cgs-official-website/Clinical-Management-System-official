import React, { useState, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Boxes, Plus, CheckCircle2, Pill, Download, FileSpreadsheet } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
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
  const [formData, setFormData] = useState({
    itemCode: 'MED-CIPRO-500',
    name: 'Ciprofloxacin 500mg Tablets',
    category: 'Antibiotics',
    stockQuantity: 300,
    unit: 'Tablets',
    minReorderThreshold: 100,
    batchNumber: 'BCH-2026-90',
    expiryDate: '2027-12-31',
    unitCost: 0.35,
    sellingPrice: 1.5,
  })

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
    retry: false,
  })

  const prescriptions = Array.isArray(rxData) ? rxData : []
  const pendingRxCount = prescriptions.filter(
    (p) => p.status !== 'Fulfilled' && p.status !== 'Dispensed'
  ).length

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/inventory', payload)
      return res.data
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] })
      setIsAddOpen(false)
      notify.success(`Stock item ${item.name} added!`)
    },
    onError: (err) => notify.error(err.response?.data?.message || 'Failed to add inventory item.'),
  })

  const inventory = Array.isArray(data) ? data : data?.inventory || data?.data || []

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
              onClick={() => setIsAddOpen(true)}
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
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Dispensary Stock Batches ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'prescriptions'
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
        onClose={() => setIsAddOpen(false)}
        title="Receive New Pharmacy Stock"
        description="Record newly delivered pharmaceutical batches into clinic inventory."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Item Code"
              required
              value={formData.itemCode}
              onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
            />
            <Input
              label="Drug / Consumable Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Stock Quantity"
              type="number"
              required
              value={formData.stockQuantity}
              onChange={(e) =>
                setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Unit (e.g. Tablets)"
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            <Input
              label="Reorder Alert Threshold"
              type="number"
              required
              value={formData.minReorderThreshold}
              onChange={(e) =>
                setFormData({ ...formData, minReorderThreshold: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Batch Number"
              required
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            />
            <Input
              label="Expiration Date"
              type="date"
              required
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={addMutation.isPending}>
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
