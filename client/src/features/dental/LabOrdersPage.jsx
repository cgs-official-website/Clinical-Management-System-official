import React, { useState } from 'react'
import {
  FlaskConical,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileCheck,
  Search,
  Sparkles,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { notify } from '../../components/ui/Toast'

const INITIAL_ORDERS = [
  {
    id: 'LAB-2026-104',
    lab: 'Apex Dental Ceramics Lab (Mumbai)',
    appliance: 'Multilayered Zirconia Crown',
    tooth: '#19',
    shade: 'VITA Classical A2 (Gingival A3)',
    impression: 'Intraoral Digital 3Shape TRIOS Scan',
    sentDate: '14 Sep 2026',
    dueDate: '21 Sep 2026',
    status: 'IN_FABRICATION',
    technician: 'Master Ceramist Rajesh M.',
    deliveryTracking: 'Bluedart #882910401',
  },
  {
    id: 'LAB-2026-098',
    lab: 'Dentaurum Precision Prosthetics',
    appliance: 'Maxillary Hard-Soft Nightguard / Splint',
    tooth: 'Upper Arch',
    shade: 'Clear Transparent',
    impression: 'PVS Heavy/Light Body Impression',
    sentDate: '10 Sep 2026',
    dueDate: '17 Sep 2026',
    status: 'RECEIVED_AT_CLINIC',
    technician: 'Suresh Patil',
    deliveryTracking: 'Delivered to Reception',
  },
  {
    id: 'LAB-2026-091',
    lab: 'Apex Dental Ceramics Lab',
    appliance: 'IPS e.max CAD Aesthetic Veneers (x4)',
    tooth: '#7, #8, #9, #10',
    shade: 'Bleach BL2 (High Translucency)',
    impression: 'TRIOS 4 Colour Mesh Scan',
    sentDate: '02 Sep 2026',
    dueDate: '09 Sep 2026',
    status: 'SEATED_COMPLETED',
    technician: 'Rajesh M.',
    deliveryTracking: 'Completed & Signed',
  },
]

export const LabOrdersPage = () => {
  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    lab: 'Apex Dental Ceramics Lab (Mumbai)',
    appliance: '',
    tooth: '',
    shade: '',
    impression: 'Intraoral Digital 3Shape TRIOS Scan',
    dueDate: '',
    technician: '',
    status: 'IN_FABRICATION',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateOrder = (e) => {
    e.preventDefault()
    if (!formData.appliance || !formData.tooth) {
      notify.error('Please specify Appliance/Restoration and Tooth/Arch.')
      return
    }

    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    let dueStr = formData.dueDate
      ? new Date(formData.dueDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'In 7 Days'

    const newOrder = {
      id: `LAB-2026-${String(105 + orders.length).padStart(3, '0')}`,
      lab: formData.lab || 'Apex Dental Ceramics Lab',
      appliance: formData.appliance,
      tooth: formData.tooth,
      shade: formData.shade || 'VITA Standard A2',
      impression: formData.impression,
      sentDate: todayStr,
      dueDate: dueStr,
      status: formData.status,
      technician: formData.technician || 'Master Ceramist',
      deliveryTracking: 'Processing Logistics',
    }

    setOrders([newOrder, ...orders])
    setIsModalOpen(false)
    notify.success(`Dental Lab Order ${newOrder.id} created successfully!`)

    // Reset Form
    setFormData({
      lab: 'Apex Dental Ceramics Lab (Mumbai)',
      appliance: '',
      tooth: '',
      shade: '',
      impression: 'Intraoral Digital 3Shape TRIOS Scan',
      dueDate: '',
      technician: '',
      status: 'IN_FABRICATION',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Dental Lab Work Orders
            </h1>
            <Badge variant="primary" size="sm">
              Prosthodontics & Orthotic Orders
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Crown & bridge fabrication, shade matching, digital intraoral impression slips & delivery logistics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Lab Order
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Order ID</th>
                <th className="py-2.5 px-3 font-semibold">Laboratory Partner</th>
                <th className="py-2.5 px-3 font-semibold">Appliance / Restoration</th>
                <th className="py-2.5 px-3 font-semibold">Tooth</th>
                <th className="py-2.5 px-3 font-semibold">Shade</th>
                <th className="py-2.5 px-3 font-semibold">Sent / Due Date</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-primary">{o.id}</td>
                  <td className="py-3 px-3 font-medium text-text-primary">
                    <div>{o.lab}</div>
                    <span className="text-[10px] text-text-secondary">{o.technician}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-text-primary block">{o.appliance}</span>
                    <span className="text-[10px] text-text-secondary">{o.impression}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-text-primary">{o.tooth}</td>
                  <td className="py-3 px-3 font-mono text-primary font-medium">{o.shade}</td>
                  <td className="py-3 px-3 text-text-secondary text-[11px]">
                    <div>Sent: {o.sentDate}</div>
                    <div className="font-semibold text-text-primary">Due: {o.dueDate}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'SEATED_COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : o.status === 'RECEIVED_AT_CLINIC'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => notify.success(`Prescription slip for ${o.id} exported.`)}
                    >
                      Slip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lab Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Dental Lab Work Order"
        description="Generates a digital lab prescription requisition slip for prosthodontics & orthotics."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Laboratory Partner <span className="text-red-500">*</span>
              </label>
              <select
                name="lab"
                value={formData.lab}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Apex Dental Ceramics Lab (Mumbai)">
                  Apex Dental Ceramics Lab (Mumbai)
                </option>
                <option value="Dentaurum Precision Prosthetics">
                  Dentaurum Precision Prosthetics
                </option>
                <option value="MicroDental CAD/CAM Specialist">
                  MicroDental CAD/CAM Specialist
                </option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Appliance / Restoration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="appliance"
                value={formData.appliance}
                onChange={handleInputChange}
                placeholder="e.g. Multilayered Zirconia Crown"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Tooth # / Arch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tooth"
                value={formData.tooth}
                onChange={handleInputChange}
                placeholder="e.g. #19 or Upper Arch"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Shade Specification
              </label>
              <input
                type="text"
                name="shade"
                value={formData.shade}
                onChange={handleInputChange}
                placeholder="e.g. VITA Classical A2 (Gingival A3)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Impression Method
              </label>
              <select
                name="impression"
                value={formData.impression}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Intraoral Digital 3Shape TRIOS Scan">
                  Intraoral Digital 3Shape TRIOS Scan
                </option>
                <option value="TRIOS 4 Colour Mesh Scan">
                  TRIOS 4 Colour Mesh Scan
                </option>
                <option value="PVS Heavy/Light Body Impression">
                  PVS Heavy/Light Body Impression
                </option>
                <option value="Alginate Preliminary Cast">
                  Alginate Preliminary Cast
                </option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Expected Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Assigned Ceramist / Technician
              </label>
              <input
                type="text"
                name="technician"
                value={formData.technician}
                onChange={handleInputChange}
                placeholder="e.g. Master Ceramist Rajesh M."
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-primary mb-1">
                Initial Order Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="IN_FABRICATION">IN FABRICATION</option>
                <option value="RECEIVED_AT_CLINIC">RECEIVED AT CLINIC</option>
                <option value="SEATED_COMPLETED">SEATED COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Lab Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LabOrdersPage

