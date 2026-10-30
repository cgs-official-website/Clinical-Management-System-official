import React, { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Activity,
    Heart,
    Droplets,
    Pill,
    Hash,
    User,
    Phone,
    Calendar,
    RefreshCw,
    Clock,
    CheckCircle2,
    Stethoscope,
    AlertCircle
} from 'lucide-react'
import { api } from '../../../lib/api'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { notify } from '../../../components/ui/Toast'

export const PatientDetailsTriageModal = ({
    isOpen,
    onClose,
    initialPatient = null,
    patientsList = [],
    onSuccess
}) => {
    const queryClient = useQueryClient()

    // Generate a realistic sequential token
    const generateToken = () => {
        const num = Math.floor(100 + Math.random() * 900)
        return `TK-${num}`
    }

    const [patientMode, setPatientMode] = useState('select') // 'select' | 'new'
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [formData, setFormData] = useState({
        tokenNumber: generateToken(),
        patientName: '',
        phone: '',
        gender: 'Female',
        dob: '1990-01-01',
        weight: '',
        weightUnit: 'kg',
        bpSystolic: '',
        bpDiastolic: '',
        sugarLevel: '',
        sugarType: 'Fasting',
        currentMedications: '',
        doctorName: '',
        doctorId: null,
        notes: ''
    })

    // Field-level validation: errors appear (in red) only after the first submit attempt,
    // then update live as the receptionist fixes each field.
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (isOpen) setSubmitted(false)
    }, [isOpen])

    const errors = useMemo(() => {
        if (!submitted) return {}
        const e = {}
        if (patientMode === 'select') {
            if (!selectedPatientId) e.patient = 'Select a registered patient (or switch to Walk-In / New)'
        } else {
            if (!formData.patientName.trim()) e.patientName = 'Patient name is required'
            if (!/^\d{10}$/.test(formData.phone)) e.phone = 'Enter a valid 10-digit phone number'
        }
        const w = parseFloat(formData.weight)
        if (!formData.weight || isNaN(w) || w <= 0) e.weight = 'Weight is required'
        if (!formData.bpSystolic) e.bpSystolic = 'Systolic is required'
        if (!formData.bpDiastolic) e.bpDiastolic = 'Diastolic is required'
        if (!formData.doctorName) e.doctor = 'Select the attending doctor'
        return e
    }, [submitted, patientMode, selectedPatientId, formData])

    const errCls = (key) => (errors[key] ? '!border-danger !ring-1 !ring-danger/30' : '')

    // Fetch real doctors assigned to this clinic
    const { data: doctorsData = [], isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['staff', 'doctors'],
        queryFn: async () => {
            try {
                const res = await api.get('/api/staff/doctors')
                const list = res.data?.doctors || res.data?.data || []
                if (Array.isArray(list) && list.length > 0) return list
            } catch (err) {
                // Fallback to /api/admin/staff if permitted
            }
            try {
                const res = await api.get('/api/admin/staff')
                const staff = res.data?.staff || res.data?.data || []
                const docs = staff.filter((s) => {
                    const roles = (s.roleNames || (Array.isArray(s.roles) ? s.roles : [s.role || ''])).join(' ').toLowerCase()
                    return (
                        roles.includes('doctor') ||
                        roles.includes('physician') ||
                        roles.includes('surgeon') ||
                        roles.includes('cardiologist') ||
                        roles.includes('specialist') ||
                        /^dr[\s.]/i.test(s.name || s.fullName || '')
                    )
                })
                if (docs.length > 0) {
                    return docs.map((d) => ({
                        id: d.id,
                        name: d.name || d.fullName,
                        fullName: d.name || d.fullName,
                        department: d.department || 'General Medicine',
                        role: d.role || 'Doctor',
                        label: `${d.name || d.fullName} (${d.department || d.specialty || 'Doctor'})`,
                        value: d.name || d.fullName,
                    }))
                }
            } catch (e) {
                // Ignore fallback errors
            }
            return []
        },
        staleTime: 30000,
    })

    // Format doctor options for select input
    const doctorOptions = useMemo(() => {
        if (!doctorsData || doctorsData.length === 0) {
            if (formData.doctorName && formData.doctorName !== 'Dr. Sarah Al-Mansoor') {
                return [{ value: formData.doctorName, label: formData.doctorName }]
            }
            return []
        }
        return doctorsData.map((d) => ({
            value: d.value || d.fullName || d.name,
            label: d.label || `${d.fullName || d.name} (${d.department || 'Doctor'})`,
            id: d.id,
        }))
    }, [doctorsData, formData.doctorName])

    // Sync default assigned doctor from original clinic data
    useEffect(() => {
        if (doctorsData && doctorsData.length > 0) {
            setFormData((prev) => {
                const currentDoc = prev.doctorName
                const exists = doctorsData.some((d) => (d.value || d.name || d.fullName) === currentDoc)
                if (!exists || currentDoc === 'Dr. Sarah Al-Mansoor' || !currentDoc) {
                    const firstDoc = doctorsData[0]
                    return {
                        ...prev,
                        doctorName: firstDoc.value || firstDoc.fullName || firstDoc.name,
                        doctorId: firstDoc.id || null,
                    }
                }
                return prev
            })
        }
    }, [doctorsData])

    const handleDoctorChange = (selectedName) => {
        const matched = doctorsData.find((d) => (d.value || d.fullName || d.name) === selectedName)
        setFormData((prev) => ({
            ...prev,
            doctorName: selectedName,
            doctorId: matched?.id || null,
        }))
    }

    // Pre-fill if initialPatient was passed
    useEffect(() => {
        if (initialPatient) {
            setPatientMode('select')
            setSelectedPatientId(initialPatient.id || '')
            setFormData((prev) => ({
                ...prev,
                patientName: initialPatient.fullName || initialPatient.name || '',
                phone: initialPatient.phone || '',
                gender: initialPatient.gender || 'Female',
                dob: initialPatient.dob ? initialPatient.dob.slice(0, 10) : '1990-01-01',
                weight: initialPatient.medicalHistory?.latestVitals?.weight?.replace(' kg', '') || prev.weight,
                currentMedications: initialPatient.medicalHistory?.latestVitals?.currentMedications || prev.currentMedications
            }))
        } else {
            setFormData((prev) => ({ ...prev, tokenNumber: generateToken() }))
        }
    }, [initialPatient, isOpen])

    // Deduplicate patients by ID or name+phone to avoid duplicate entries in records
    const uniquePatients = React.useMemo(() => {
        const list = Array.isArray(patientsList) ? patientsList : []
        const map = new Map()
        list.forEach((p) => {
            const key = p.id || `${(p.fullName || p.name || '').trim().toLowerCase()}-${p.phone || ''}`
            if (key && !map.has(key)) {
                map.set(key, p)
            }
        })
        return Array.from(map.values())
    }, [patientsList])

    const handlePatientSelect = (patId) => {
        setSelectedPatientId(patId)
        const pat = uniquePatients.find((p) => p.id === patId)
        if (pat) {
            setFormData((prev) => ({
                ...prev,
                patientName: pat.fullName || pat.name || '',
                phone: pat.phone || '',
                gender: pat.gender || 'Female',
                dob: pat.dob ? pat.dob.slice(0, 10) : '1990-01-01',
                weight: pat.medicalHistory?.latestVitals?.weight?.replace(' kg', '') || prev.weight,
                currentMedications: pat.medicalHistory?.latestVitals?.currentMedications || prev.currentMedications
            }))
        }
    }

    const triageMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/api/staff/triage', payload)
            return res.data
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
            queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
            queryClient.invalidateQueries({ queryKey: ['staff', 'patients'] })
            notify.success(`Token ${formData.tokenNumber} issued! Patient transferred to Doctor's queue.`)
            if (onSuccess) onSuccess(res)
            onClose()
        },
        onError: (err) => {
            const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save patient details & triage report.'
            notify.error(msg)
        }
    })

    const FIELD_IDS = {
        patient: 'triage-patient',
        patientName: 'triage-patient-name',
        phone: 'triage-phone',
        weight: 'triage-weight',
        bpSystolic: 'triage-bp-sys',
        bpDiastolic: 'triage-bp-dia',
        doctor: 'triage-doctor',
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        // Validate synchronously (errors state is derived and may not be updated yet)
        const missing = []
        if (patientMode === 'select') {
            if (!selectedPatientId) missing.push('patient')
        } else {
            if (!formData.patientName.trim()) missing.push('patientName')
            if (!/^\d{10}$/.test(formData.phone)) missing.push('phone')
        }
        const w = parseFloat(formData.weight)
        if (!formData.weight || isNaN(w) || w <= 0) missing.push('weight')
        if (!formData.bpSystolic) missing.push('bpSystolic')
        if (!formData.bpDiastolic) missing.push('bpDiastolic')
        if (!formData.doctorName) missing.push('doctor')

        setSubmitted(true)
        if (missing.length) {
            notify.error('Please fill the fields highlighted in red.')
            setTimeout(() => {
                const el = document.getElementById(FIELD_IDS[missing[0]])
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el.focus({ preventScroll: true })
                }
            }, 50)
            return
        }

        const bp =
            formData.bpSystolic && formData.bpDiastolic
                ? `${formData.bpSystolic}/${formData.bpDiastolic} mmHg`
                : formData.bpSystolic || ''

        const sugar = formData.sugarLevel
            ? `${formData.sugarLevel} mg/dL (${formData.sugarType})`
            : ''

        const payload = {
            tokenNumber: formData.tokenNumber,
            patientId: patientMode === 'select' ? selectedPatientId : undefined,
            patientName: formData.patientName,
            phone: formData.phone,
            gender: formData.gender,
            dob: formData.dob,
            weight: formData.weight ? `${formData.weight} ${formData.weightUnit}` : '',
            bp,
            sugarLevel: sugar,
            currentMedications: formData.currentMedications,
            doctorName: formData.doctorName,
            doctorId: formData.doctorId,
            notes: formData.notes
        }

        triageMutation.mutate(payload)
    }

    // BP classification helper
    const getBpClass = () => {
        const sys = parseInt(formData.bpSystolic, 10)
        const dia = parseInt(formData.bpDiastolic, 10)
        if (!sys || !dia) return null
        if (sys >= 140 || dia >= 90) return { label: 'Hypertensive Stage', color: 'text-danger bg-danger/10 border-danger/30' }
        if (sys >= 120 || dia >= 80) return { label: 'Elevated BP', color: 'text-warning bg-warning/10 border-warning/30' }
        return { label: 'Normal BP', color: 'text-success bg-success/10 border-success/30' }
    }

    const bpStatus = getBpClass()

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reception Patient Check-In & Vitals Report"
            description="Record baseline vitals, current medications, and issue an outpatient consultation token for the Doctor."
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Token Badge Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-surface border border-primary/25 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
                            <Hash className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                                Outpatient Queue Token
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-heading font-extrabold text-primary font-mono tracking-tight">
                                    {formData.tokenNumber}
                                </span>
                                <span className="text-[10px] text-text-secondary">
                                    {formData.doctorName ? `(Assigned to ${formData.doctorName.startsWith('Dr') ? formData.doctorName : `Dr. ${formData.doctorName}`})` : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tokenNumber: generateToken() })}
                        className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface/80 text-text-secondary hover:text-primary transition-colors text-xs flex items-center gap-1 shadow-xs"
                        title="Generate new random token"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-medium">Regenerate</span>
                    </button>
                </div>

                {/* Patient Selection Segment */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span className={errors.patient || errors.patientName || errors.phone ? 'text-danger' : ''}>1. Patient Identification{(errors.patient || errors.patientName || errors.phone) ? ' — incomplete' : ''}</span>
                        </label>
                        <div className="p-0.5 rounded-lg bg-border/40 flex items-center text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setPatientMode('select')}
                                className={`px-2.5 py-1 rounded-md transition-all ${patientMode === 'select'
                                        ? 'bg-surface text-primary shadow-xs font-bold'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                Existing Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPatientMode('new')
                                    setSelectedPatientId('')
                                }}
                                className={`px-2.5 py-1 rounded-md transition-all ${patientMode === 'new'
                                        ? 'bg-surface text-primary shadow-xs font-bold'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                Walk-In / New
                            </button>
                        </div>
                    </div>

                    {patientMode === 'select' ? (
                        <div>
                            <Select
                                id="triage-patient"
                                label="Select Registered Patient"
                                required
                                error={errors.patient}
                                className={errCls('patient')}
                                value={selectedPatientId}
                                onChange={(e) => handlePatientSelect(e.target.value)}
                                options={[
                                    { value: '', label: '-- Choose patient from records --' },
                                    ...uniquePatients.map((p) => {
                                        const name = p.fullName || p.name || 'Patient'
                                        const identifier = p.mrn && p.mrn !== 'MRN' ? `MRN: ${p.mrn}` : (p.phone ? p.phone : '')
                                        const labelText = identifier ? `${name} (${identifier})` : name
                                        return {
                                            value: p.id,
                                            label: labelText
                                        }
                                    })
                                ]}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-surface/50">
                            <Input
                                id="triage-patient-name"
                                label="Full Legal Name"
                                required
                                error={errors.patientName}
                                className={errCls('patientName')}
                                placeholder="e.g. Liam Reyes"
                                value={formData.patientName}
                                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                            />
                            <Input
                                id="triage-phone"
                                error={errors.phone}
                                className={errCls('phone')}
                                label="Contact Phone"
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                required
                                placeholder="9876543210"
                                value={formData.phone}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '')
                                    if (val.length === 12 && val.startsWith('91')) val = val.slice(2)
                                    else if (val.length === 11 && val.startsWith('0')) val = val.slice(1)
                                    setFormData({ ...formData, phone: val.slice(0, 10) })
                                }}
                                onKeyDown={(e) => {
                                    if (
                                        ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key) ||
                                        e.ctrlKey ||
                                        e.metaKey
                                    ) {
                                        return
                                    }
                                    if (!/^[0-9]$/.test(e.key)) {
                                        e.preventDefault()
                                    }
                                }}
                            />
                            <Select
                                label="Gender"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                options={[
                                    { value: 'Female', label: 'Female' },
                                    { value: 'Male', label: 'Male' },
                                    { value: 'Other', label: 'Other' }
                                ]}
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                {/* Vitals Intake Form */}
                <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span className={errors.weight || errors.bpSystolic || errors.bpDiastolic ? 'text-danger' : ''}>2. Baseline Vitals & Physiological Report{(errors.weight || errors.bpSystolic || errors.bpDiastolic) ? ' — incomplete' : ''}</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Weight */}
                        <div className={`p-3 rounded-xl border bg-surface flex flex-col justify-between ${errors.weight ? 'border-danger bg-danger/5' : 'border-border'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5 text-primary" />
                                    Weight
                                </span>
                                <span className="text-[10px] text-text-muted font-mono">kg</span>
                            </div>
                            <Input
                                id="triage-weight"
                                type="number"
                                step="0.1"
                                placeholder="e.g. 68.5"
                                required
                                error={errors.weight}
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className={`!py-1.5 text-sm font-bold ${errCls('weight')}`}
                            />
                        </div>

                        {/* Blood Pressure */}
                        <div className={`p-3 rounded-xl border bg-surface flex flex-col justify-between ${errors.bpSystolic || errors.bpDiastolic ? 'border-danger bg-danger/5' : 'border-border'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5 text-danger" />
                                    BP (Systolic / Diastolic)
                                </span>
                                {bpStatus && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${bpStatus.color}`}>
                                        {bpStatus.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <input
                                    id="triage-bp-sys"
                                    type="number"
                                    placeholder="120"
                                    required
                                    value={formData.bpSystolic}
                                    onChange={(e) => setFormData({ ...formData, bpSystolic: e.target.value })}
                                    className={`w-full px-2 py-1.5 rounded-lg border bg-bg text-text-primary text-sm font-bold text-center focus:outline-none focus:border-primary ${errors.bpSystolic ? 'border-danger' : 'border-border'}`}
                                />
                                <span className="text-text-muted font-bold">/</span>
                                <input
                                    id="triage-bp-dia"
                                    type="number"
                                    placeholder="80"
                                    required
                                    value={formData.bpDiastolic}
                                    onChange={(e) => setFormData({ ...formData, bpDiastolic: e.target.value })}
                                    className={`w-full px-2 py-1.5 rounded-lg border bg-bg text-text-primary text-sm font-bold text-center focus:outline-none focus:border-primary ${errors.bpDiastolic ? 'border-danger' : 'border-border'}`}
                                />
                            </div>
                            {(errors.bpSystolic || errors.bpDiastolic) && (
                                <p className="mt-1 text-xs text-danger font-medium">Enter both systolic and diastolic BP</p>
                            )}
                        </div>

                        {/* Sugar Level */}
                        <div className="p-3 rounded-xl border border-border bg-surface flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                                    <Droplets className="w-3.5 h-3.5 text-amber-500" />
                                    Blood Sugar (Optional)
                                </span>
                                <select
                                    value={formData.sugarType}
                                    onChange={(e) => setFormData({ ...formData, sugarType: e.target.value })}
                                    className="text-[10px] bg-bg border border-border rounded px-1 py-0.5 text-text-secondary focus:outline-none"
                                >
                                    <option value="Fasting">Fasting</option>
                                    <option value="Random">Random</option>
                                    <option value="Post-Prandial">Post-Prandial</option>
                                </select>
                            </div>
                            <Input
                                type="number"
                                placeholder="e.g. 110"
                                value={formData.sugarLevel}
                                onChange={(e) => setFormData({ ...formData, sugarLevel: e.target.value })}
                                className="!py-1.5 text-sm font-bold"
                            />
                        </div>
                    </div>

                    {/* Current Medications / Tablets being taken */}
                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-primary" />
                                <span>Current Medications / Tablets Being Taken</span>
                            </label>
                            <span className="text-[10px] text-text-muted">Over-the-counter or ongoing prescription</span>
                        </div>
                        <Input
                            placeholder="e.g. Metformin 500mg (twice daily), Telmisartan 40mg (morning), Aspirin 75mg"
                            value={formData.currentMedications}
                            onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                        />
                    </div>
                </div>

                {/* Assigned Physician & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                    <Select
                        id="triage-doctor"
                        label="Assigned Attending Doctor"
                        required
                        error={errors.doctor}
                        className={errCls('doctor')}
                        value={formData.doctorName}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        options={
                            doctorOptions.length > 0
                                ? doctorOptions
                                : [
                                    {
                                        value: formData.doctorName || 'Dr dev prakash',
                                        label: formData.doctorName || 'Dr dev prakash (Cardiac Surgery)',
                                    },
                                ]
                        }
                    />
                    <Input
                        label="Chief Complaint / Reason for Visit"
                        placeholder="e.g. Routine hypertension review & refill"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Transmits immediately to Doctor's live queue</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={triageMutation.isPending}
                            rightIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            Save Report & Issue Token
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

export default PatientDetailsTriageModal
