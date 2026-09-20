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
import { notify } from '../../components/ui/Toast'

export const LabOrdersPage = () => {
  const orders = [
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
            onClick={() => notify.info('Digital lab prescription requisition opened.')}
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
    </div>
  )
}

export default LabOrdersPage
