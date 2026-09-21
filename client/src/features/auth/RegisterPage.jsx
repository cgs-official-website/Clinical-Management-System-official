import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Activity,
  Building2,
  Globe,
  User,
  Mail,
  Lock,
  Phone,
  Stethoscope,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  AlertCircle,
  FolderTree,
  Info,
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { notify } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/useAuthStore'
import api from '../../lib/api'
import { AuthVisualShowcase } from './AuthVisualShowcase'

const registerSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  adminName: z.string().min(2, 'Administrator name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(8, 'Valid phone number is required'),
  specialty: z.string().optional(),
  region: z.string().min(1, 'Region is required'),
  plan: z.string().min(1, 'Please choose an operational plan'),
  clinicCategoryId: z.string().min(1, 'Please select a clinic category'),
})

export const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const prefillState = location.state || {}
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successSubmitted, setSuccessSubmitted] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Parse invite token or query parameters if this is an employee invite
  const inviteToken = searchParams.get('invite')
  const typeParam = searchParams.get('type')

  const inviteData = useMemo(() => {
    if (inviteToken) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(inviteToken))))
        if (decoded && decoded.email) return decoded
      } catch (e) {
        try {
          const decoded = JSON.parse(atob(inviteToken))
          if (decoded && decoded.email) return decoded
        } catch (err) {
          console.warn('Failed to parse invite token', err)
        }
      }
    }
    if (typeParam === 'staff' || (searchParams.get('email') && searchParams.get('role'))) {
      return {
        type: 'staff',
        staffId: searchParams.get('staffId') || searchParams.get('id') || '',
        name: searchParams.get('name') || '',
        email: searchParams.get('email') || '',
        role: searchParams.get('role') || 'Clinical Staff Member',
        department: searchParams.get('department') || '',
        specialty: searchParams.get('specialty') || '',
        clinicName: searchParams.get('clinicName') || 'Aura Health Memorial',
      }
    }
    return null
  }, [inviteToken, typeParam, searchParams])

  // Staff registration form state
  const [staffName, setStaffName] = useState(inviteData?.name || '')
  const [staffPassword, setStaffPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [staffError, setStaffError] = useState(null)
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false)

  useEffect(() => {
    if (inviteData?.name) {
      setStaffName(inviteData.name)
    }
  }, [inviteData?.name])

  // Handle staff registration submission
  const handleStaffRegister = async (e) => {
    e.preventDefault()
    setStaffError(null)

    if (!staffName || staffName.trim().length < 2) {
      setStaffError('Please enter your full name (minimum 2 characters).')
      return
    }

    if (!staffPassword || staffPassword.length < 6) {
      setStaffError('Password must be at least 6 characters long.')
      return
    }

    if (staffPassword !== confirmPassword) {
      setStaffError('Passwords do not match. Please verify.')
      return
    }

    setIsSubmittingStaff(true)
    try {
      const response = await api.post('/api/public/register-staff', {
        staffId: inviteData.staffId,
        name: staffName.trim(),
        email: inviteData.email,
        password: staffPassword,
        role: inviteData.role,
        department: inviteData.department,
        specialty: inviteData.specialty,
        clinicName: inviteData.clinicName,
      })

      const resData = response.data
      const user = resData.user
      const tokens = resData.tokens

      if (tokens?.accessToken) {
        useAuthStore.getState().setAuth(user, tokens.accessToken, tokens.refreshToken)
        notify.success(`Welcome to the team, ${user.name}! Your account has been registered and activated.`)
        navigate('/app/staff/dashboard', { replace: true })
      } else {
        notify.success('Account successfully registered! Please sign in with your new password.')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      const errorMsg =
        (typeof err.response?.data?.error === 'string' && err.response?.data?.error) ||
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to complete staff registration. Please try again.'
      setStaffError(errorMsg)
    } finally {
      setIsSubmittingStaff(false)
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      clinicName: '',
      subdomain: '',
      adminName: '',
      email: '',
      password: '',
      phone: '',
      clinicCategoryId: '',
      specialty: 'Multispecialty & General Care',
      region: 'Asia / India (INR ₹)',
      plan: 'Professional Health Center',
    },
  })

  // Fetch active categories from API
  useEffect(() => {
    let isMounted = true
    api.get('/api/public/clinic-categories')
      .then((res) => {
        if (isMounted) {
          const list = res.data?.data || []
          setCategories(list)
          if (list.length > 0 && !watch('clinicCategoryId')) {
            setValue('clinicCategoryId', list[0].id)
            setValue('specialty', list[0].name)
          }
        }
      })
      .catch((err) => console.warn('Failed to load clinic categories', err))
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false)
      })
    return () => { isMounted = false }
  }, [setValue, watch])

  // Pre-fill fields if re-submitting after rejection
  useEffect(() => {
    const prefillClinic = prefillState.clinicName || searchParams.get('clinicName')
    const prefillEmail = prefillState.email || searchParams.get('email')
    if (prefillClinic) {
      setValue('clinicName', prefillClinic)
      handleClinicNameChange({ target: { value: prefillClinic } })
    }
    if (prefillEmail) {
      setValue('email', prefillEmail)
    }
  }, [prefillState, searchParams, setValue])

  const clinicNameValue = watch('clinicName')
  const selectedCategoryId = watch('clinicCategoryId')
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  // Auto-suggest subdomain from clinic name if not manually modified
  const handleClinicNameChange = (e) => {
    const val = e.target.value
    setValue('clinicName', val)
    const suggested = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setValue('subdomain', suggested, { shouldValidate: true })
  }

  const onSubmit = async (formData) => {
    setServerError(null)
    setIsSubmitting(true)

    try {
      const selectedCat = categories.find((c) => c.id === formData.clinicCategoryId)
      const payload = {
        ...formData,
        specialty: selectedCat?.name || formData.specialty || 'General Care',
        clinic_category_id: formData.clinicCategoryId,
      }
      const response = await api.post('/api/public/register-clinic', payload)
      const resData = response.data

      // Instant success state
      setSuccessSubmitted({
        registrationId: resData.registrationId,
        clinicName: formData.clinicName,
        adminName: formData.adminName,
        email: formData.email,
        subdomain: formData.subdomain,
      })

      // Store in session storage so AwaitingApprovalPage has instant zero-latency context
      sessionStorage.setItem(
        'clinic_pending_registration',
        JSON.stringify({
          registrationId: resData.registrationId,
          clinicName: formData.clinicName,
          adminName: formData.adminName,
          email: formData.email,
          subdomain: formData.subdomain,
          submittedAt: new Date().toISOString(),
        })
      )

      // Broadcast to other tabs/windows (such as Super Admin Clinics Management)
      try {
        const channel = new BroadcastChannel('clinic_registration_channel')
        channel.postMessage({
          type: 'REGISTRATION_CREATED',
          registrationId: resData.registrationId,
          clinicName: formData.clinicName,
          adminName: formData.adminName,
          email: formData.email,
          subdomain: formData.subdomain,
          submittedAt: new Date().toISOString(),
        })
        channel.close()
      } catch (e) {
        // BroadcastChannel unsupported or blocked
      }

      // Cross-tab storage beacon for immediate query invalidation
      try {
        localStorage.setItem(
          'clinic_last_created_registration',
          JSON.stringify({
            timestamp: Date.now(),
            registrationId: resData.registrationId,
            clinicName: formData.clinicName,
            email: formData.email,
          })
        )
      } catch (e) {}

      // Auto-navigate to Waiting/Pending approval screen immediately after short confirmation flash
      setTimeout(() => {
        navigate(`/awaiting-approval?regId=${resData.registrationId}`)
      }, 700)
    } catch (err) {
      const errorMsg =
        (typeof err.response?.data?.error === 'string' && err.response?.data?.error) ||
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit registration. Please verify details and try again.'
      setServerError(errorMsg)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative selection:bg-primary/20 overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-1/6 left-2/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Bar with Back button and Theme toggle */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between mb-4 sm:mb-8 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary px-3.5 py-2 rounded-xl border border-border/80 hover:border-primary/40 bg-surface/80 backdrop-blur-md transition-all shadow-sm group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-surface border border-primary/20 p-1 shadow-sm group-hover:shadow-glow/40 transition-all flex items-center justify-center">
              <img
                src="/zuna-logo.png"
                alt="Zuna"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-heading font-bold text-base text-text-primary tracking-tight">
              Zuna<span className="text-primary">.</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Split Layout Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-8 lg:gap-12 z-10 py-4">
        {/* LEFT SIDE: Matching Animated Visual Showcase */}
        <div className="hidden lg:flex lg:w-[40%] xl:w-[38%] sticky top-8 items-center justify-center animate-slide-left">
          <AuthVisualShowcase
            variant={inviteData ? 'staff' : 'register'}
            clinicName={inviteData?.clinicName}
          />
        </div>

        {/* RIGHT SIDE: Registration Form Container */}
        <div className={`w-full ${inviteData ? 'lg:w-[56%] xl:w-[52%] max-w-md mx-auto lg:mx-0' : 'lg:w-[60%] xl:w-[62%]'} animate-slide-right`}>
          {inviteData ? (
            /* Staff Account Registration & Activation Form (via invite link) */
            <div className="w-full max-w-md mx-auto lg:mx-0">
              {/* Header */}
              <div className="text-left mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Staff Invitation Access</span>
                </div>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
                  Complete Your Registration
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-2">
                  You have been invited to join <strong className="text-text-primary">{inviteData.clinicName || 'Aura Health Memorial'}</strong>. Confirm your display name and set your private password to activate access.
                </p>
              </div>

              <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-card border border-border">
                {staffError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-medium flex items-center gap-2.5 animate-in fade-in">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleStaffRegister} className="space-y-4">
              {/* 1. Email Address (Pre-filled and LOCKED) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>Institutional Email Address</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    Locked
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={inviteData.email}
                    readOnly
                    disabled
                    aria-readonly="true"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface/70 border border-border text-xs font-mono text-text-secondary cursor-not-allowed select-none shadow-inner opacity-90 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Designated by administrator invite (non-editable).
                </p>
              </div>

              {/* 2. Assigned Role (Pre-filled and LOCKED) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Assigned Clinical Role</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    Locked
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={inviteData.role}
                    readOnly
                    disabled
                    aria-readonly="true"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface/70 border border-border text-xs font-semibold text-text-secondary cursor-not-allowed select-none shadow-inner opacity-90 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Designated permissions tier (non-editable).
                </p>
              </div>

              {/* 3. Full Name (Pre-filled and EDITABLE) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Full Legal / Clinical Name</span>
                    <span className="text-primary font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    Editable
                  </span>
                </div>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Dr. Marcus Vance"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <p className="text-[11px] text-text-muted">
                  You can edit or confirm your preferred clinical display name.
                </p>
              </div>

              {/* 4. Set Password (Employee sets own password) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Set Your Password</span>
                  <span className="text-primary font-bold">*</span>
                </label>
                <Input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              {/* 5. Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Confirm Password</span>
                  <span className="text-primary font-bold">*</span>
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Re-enter your chosen password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingStaff}
                className="w-full mt-2 font-bold shadow-glow hover:shadow-glow/80"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Complete Registration & Log In
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs text-text-secondary">
                Already finished setting up your account?{' '}
                <Link to="/login" className="text-primary hover:underline font-bold">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Regular Clinic Practice Onboarding */
        <div className="w-full">
          {/* Header */}
          <div className="text-left mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>Fast Clinic Onboarding</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
              Register Your Clinical Practice
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-xl">
              Provision a modern, unified clinical operating system with automated HIPAA/FHIR compliance
              and instantaneous Super Admin verification.
            </p>
          </div>

          {/* Success Modal / Banner Overlay if just submitted */}
          {successSubmitted && (
            <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-text-primary">
                  Registration Submitted Successfully!
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Connecting to Super Admin verification queue... Redirecting to Awaiting Approval status.
                </p>
              </div>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Registration Form Card */}
          <div className="glass-panel p-6 sm:p-10 rounded-3xl shadow-card border border-border">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Clinic Identity */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-sm text-text-primary">
                    1. Healthcare Facility Identity
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Clinic / Hospital Name"
                    required
                    placeholder="e.g. Apex Multispecialty Hospital"
                    error={errors.clinicName?.message}
                    {...register('clinicName', { onChange: handleClinicNameChange })}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">
                      Subdomain Namespace <span className="text-primary">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="apex-hospital"
                        className={`w-full h-11 pl-3.5 pr-28 rounded-xl bg-surface border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono ${
                          errors.subdomain ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
                        }`}
                        {...register('subdomain')}
                      />
                      <span className="absolute right-3 text-xs text-text-secondary font-mono pointer-events-none">
                        .clinic.io
                      </span>
                    </div>
                    {errors.subdomain && (
                      <p className="mt-1 text-xs text-danger font-medium">{errors.subdomain.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Primary Administrator Credentials */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-sm text-text-primary">
                    2. Primary Clinic Administrator
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Administrator Full Name"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    error={errors.adminName?.message}
                    {...register('adminName')}
                  />

                  <Input
                    label="Work Email Address"
                    type="email"
                    required
                    placeholder="e.g. director@apexhospital.org"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Account Password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    error={errors.password?.message}
                    {...register('password')}
                  />

                  <Input
                    label="Direct Contact Phone"
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>
              </div>

              {/* Step 3: Clinical Specialization & Cloud Deployment */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-sm text-text-primary">
                    3. Practice Scope & Regional Deployment
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Dropdown */}
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5 text-primary" />
                        <span>Clinic Category <span className="text-primary">*</span></span>
                      </span>
                    </label>
                    <select
                      className={`w-full h-11 px-3 rounded-xl bg-surface border text-xs text-text-primary truncate focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.clinicCategoryId ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                      {...register('clinicCategoryId', {
                        onChange: (e) => {
                          const sel = categories.find((c) => c.id === e.target.value)
                          if (sel) setValue('specialty', sel.name)
                        },
                      })}
                    >
                      <option value="">-- Select Clinic Category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} title={cat.description || ''}>
                          {cat.name ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1) : ''}
                        </option>
                      ))}
                    </select>
                    {selectedCategory?.description && (
                      <div className="mt-2 p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-text-secondary flex items-start gap-2 animate-fadeIn">
                        <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{selectedCategory.description}</span>
                      </div>
                    )}
                    {errors.clinicCategoryId && (
                      <p className="mt-1 text-xs text-danger font-medium">{errors.clinicCategoryId.message}</p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">
                      Data Residency Region <span className="text-primary">*</span>
                    </label>
                    <select
                      className="w-full h-11 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary truncate focus:outline-none focus:border-primary transition-all"
                      {...register('region')}
                    >
                      <option value="Asia / India (INR ₹)">Asia / India (INR ₹ - Mumbai Region)</option>
                      <option value="North America (US East)">North America (US East - N. Virginia)</option>
                      <option value="Europe (Frankfurt)">Europe (Frankfurt - GDPR Compliant)</option>
                      <option value="Asia Pacific (Singapore)">Asia Pacific (Singapore)</option>
                      <option value="Middle East (UAE)">Middle East (UAE - Dubai Cloud)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 4: Tier Selection */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-sm text-text-primary">
                    4. Operational Scale Plan
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'Starter Clinic',
                      name: 'Starter Practice',
                      price: '₹12,500/mo',
                      features: 'Up to 5 Doctors, EHR & Basic Billing',
                    },
                    {
                      id: 'Professional Health Center',
                      name: 'Professional Center',
                      price: '₹28,500/mo',
                      popular: true,
                      features: 'Up to 25 Staff, Dynamic RBAC, Pharmacy',
                    },
                    {
                      id: 'Enterprise Hospital Network',
                      name: 'Hospital Network',
                      price: '₹65,000/mo',
                      features: 'Unlimited Doctors, Multi-tenant, Dedicated SLA',
                    },
                  ].map((tier) => (
                    <label
                      key={tier.id}
                      className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        watch('plan') === tier.id
                          ? 'border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20'
                          : 'border-border bg-surface hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-text-primary">{tier.name}</span>
                          <input
                            type="radio"
                            value={tier.id}
                            className="text-primary focus:ring-primary/20"
                            {...register('plan')}
                          />
                        </div>
                        <div className="font-extrabold text-sm text-primary mb-1">{tier.price}</div>
                        <p className="text-[11px] text-text-secondary leading-snug">{tier.features}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Terms and Instant Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-glow hover:shadow-glow/80 transition-all flex items-center justify-center gap-2"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  <span>Submit Clinic Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Instant Super Admin queue submission
                  </span>
                  <Link
                    to="/login"
                    className="font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[11px] text-text-secondary py-3 z-10">
        &copy; {new Date().getFullYear()} Zuna Health Systems Inc. All rights reserved. HIPAA & ISO 27001 Compliant.
      </footer>
    </div>
  )
}

export default RegisterPage
