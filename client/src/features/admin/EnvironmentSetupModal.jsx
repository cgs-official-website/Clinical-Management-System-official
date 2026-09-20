import React, { useState } from 'react'
import {
  Sparkles,
  Building2,
  Globe,
  DollarSign,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { notify } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/useAuthStore'
import api from '../../lib/api'

export const EnvironmentSetupModal = ({ isOpen, onClose, clinicName = 'Your Clinic' }) => {
  const { user, setUser } = useAuthStore()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Configuration State
  const [currency, setCurrency] = useState('₹ INR (Indian Rupee)')
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +5:30)')
  const [departments, setDepartments] = useState([
    'General Outpatient (OPD)',
    'Cardiology & Diagnostics',
    'Pediatrics & Child Health',
    'Emergency & Triage',
  ])
  const [newDept, setNewDept] = useState('')

  const [activeModules, setActiveModules] = useState({
    patients: true,
    appointments: true,
    prescriptions: true,
    billing: true,
    inventory: true,
    reports: true,
  })

  const [operatingHours, setOperatingHours] = useState({
    mondayFriday: '08:00 AM - 08:00 PM',
    saturday: '09:00 AM - 05:00 PM',
    sunday: 'Emergency Care Only',
  })

  const handleAddDept = (e) => {
    e.preventDefault()
    if (newDept.trim() && !departments.includes(newDept.trim())) {
      setDepartments([...departments, newDept.trim()])
      setNewDept('')
    }
  }

  const handleRemoveDept = (dept) => {
    setDepartments(departments.filter((d) => d !== dept))
  }

  const toggleModule = (modKey) => {
    setActiveModules((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }))
  }

  const handleFinishSetup = async () => {
    setIsSubmitting(true)
    try {
      await api.post('/api/admin/environment-setup', {
        currency,
        timezone,
        departments,
        activeModules,
        operatingHours,
        clinicName: user?.clinicName || clinicName,
      })

      // Update auth store user so modal doesn't re-trigger
      if (user) {
        setUser({
          ...user,
          needsEnvironmentSetup: false,
        })
      }

      notify.success('Clinic environment initialized! Workspace ready for operations.')
      onClose()
    } catch (err) {
      notify.error('Failed to save environment setup. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      description=""
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header with step progress indicator */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-text-primary">
                  Initial Environment Configuration
                </h3>
                <p className="text-xs text-text-secondary">
                  Configure workspace parameters for {user?.clinicName || clinicName}
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 1
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                1
              </span>
              <span className="text-text-muted">/</span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 2
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                2
              </span>
              <span className="text-text-muted">/</span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 3
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                3
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Regional & Financial Localization */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Standardize transactional currency and billing timestamps for electronic invoices and patient records.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Primary Financial Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary text-xs text-text-primary outline-none transition-all"
              >
                <option value="₹ INR (Indian Rupee)">₹ INR (Indian Rupee - default for Indian healthcare networks)</option>
                <option value="$ USD (United States Dollar)">$ USD (United States Dollar)</option>
                <option value="€ EUR (Euro)">€ EUR (Euro)</option>
                <option value="£ GBP (British Pound)">£ GBP (British Pound)</option>
                <option value="AED (UAE Dirham)">AED (United Arab Emirates Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Clinical Scheduling Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary text-xs text-text-primary outline-none transition-all"
              >
                <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="Europe/London (GMT/BST)">Europe/London (GMT/BST)</option>
                <option value="Asia/Singapore (SGT +8:00)">Asia/Singapore (SGT +8:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Standard Clinic Operating Hours
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-secondary text-[11px] block mb-1">Weekdays (Mon-Fri)</span>
                  <input
                    type="text"
                    value={operatingHours.mondayFriday}
                    onChange={(e) =>
                      setOperatingHours({ ...operatingHours, mondayFriday: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none"
                  />
                </div>
                <div>
                  <span className="text-text-secondary text-[11px] block mb-1">Weekends (Sat-Sun)</span>
                  <input
                    type="text"
                    value={operatingHours.saturday}
                    onChange={(e) =>
                      setOperatingHours({ ...operatingHours, saturday: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Clinical Departments & Specialties */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Configure clinical departments where physicians, nurses, and technicians will be rostered.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Active Medical Departments ({departments.length})
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border text-xs text-text-primary shadow-xs"
                  >
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDept(dept)}
                      className="text-text-muted hover:text-danger transition-colors"
                      title="Remove department"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Department input */}
              <form onSubmit={handleAddDept} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Orthopedics & Sports Medicine"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
                />
                <Button type="submit" variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Active Modules & Feature Enablement */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Choose the clinical modules activated for your facility. You can also customize role privileges later.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'patients',
                  name: 'Electronic Health Records',
                  desc: 'Patient charts, history & vitals',
                },
                {
                  key: 'appointments',
                  name: 'Clinical Calendar & Slots',
                  desc: 'Multi-doctor appointment bookings',
                },
                {
                  key: 'prescriptions',
                  name: 'e-Prescriptions & Clinical Notes',
                  desc: 'Digital orders & pharmacy integration',
                },
                {
                  key: 'billing',
                  name: 'Invoicing & Payments (INR ₹)',
                  desc: 'Cashier checkout & claims',
                },
                {
                  key: 'inventory',
                  name: 'Pharmacy & Stock Tracking',
                  desc: 'Medicine batches & reorder alerts',
                },
                {
                  key: 'reports',
                  name: 'Analytics & Department Telemetry',
                  desc: 'Workload & financial metrics',
                },
              ].map((mod) => {
                const isSelected = activeModules[mod.key]
                return (
                  <div
                    key={mod.key}
                    onClick={() => toggleModule(mod.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-xs'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-text-primary">{mod.name}</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">{mod.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'border border-border bg-surface'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/80">
          <div>
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Configure Later
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(step + 1)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="font-bold shadow-glow hover:shadow-glow/80"
                onClick={handleFinishSetup}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Environment Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EnvironmentSetupModal
