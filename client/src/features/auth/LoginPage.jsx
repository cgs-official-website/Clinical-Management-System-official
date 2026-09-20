import React, { useState, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Clock,
} from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuth } from '../../hooks/useAuth'

// Lazy load the visual decorative showcase
const AuthVisualShowcase = lazy(() =>
  import('./AuthVisualShowcase').then((m) => ({ default: m.AuthVisualShowcase }))
)

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, isLoggingIn } = useAuth()
  const [serverError, setServerError] = useState(null)
  const [pendingApprovalData, setPendingApprovalData] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data) => {
    setServerError(null)
    setPendingApprovalData(null)
    try {
      await login({
        email: data.email,
        password: data.password,
      })
    } catch (err) {
      const errData = err.response?.data
      const errObj = errData?.error || {}
      const errorCode = errObj.code || errData?.code || ''
      const message = errObj.message || errData?.message || err.message || 'Authentication failed. Please check your credentials.'
      const details = errObj.details || errData?.details || {}

      if (errorCode === 'TENANT_REJECTED') {
        const rejectionReason = message || details.rejectionReason || 'Registration criteria not met'
        const clinicName = details.clinicName || ''
        const subdomain = details.subdomain || ''
        const queueReferenceId = details.queueReferenceId || ''
        const rejectedAt = details.rejectedAt || new Date().toISOString()
        sessionStorage.setItem(
          'clinic_rejected_registration',
          JSON.stringify({ rejectionReason, clinicName, email: data.email, subdomain, queueReferenceId, rejectedAt })
        )
        navigate('/registration-rejected', {
          state: {
            rejectionReason,
            clinicName,
            email: data.email,
            subdomain,
            queueReferenceId,
            rejectedAt,
          },
          replace: true,
        })
        return
      }

      if (errorCode === 'TENANT_PENDING_APPROVAL') {
        const clinicName = details.clinicName || ''
        const subdomain = details.subdomain || ''
        const queueReferenceId = details.queueReferenceId || ''
        sessionStorage.setItem(
          'clinic_pending_registration',
          JSON.stringify({ clinicName, email: data.email, subdomain, queueReferenceId })
        )
        navigate('/registration-pending', {
          state: {
            clinicName,
            email: data.email,
            subdomain,
            queueReferenceId,
          },
          replace: true,
        })
        return
      }

      const isPending =
        errorCode === 'HOSPITAL_PENDING_APPROVAL' ||
        errorCode === 'STAFF_PENDING_APPROVAL' ||
        message.toLowerCase().includes('pending administrator') ||
        message.toLowerCase().includes('awaiting super admin') ||
        message.toLowerCase().includes('pending approval') ||
        message.toLowerCase().includes('await administrator approval')

      if (isPending) {
        navigate('/registration-pending', {
          state: {
            clinicName: errData?.registration?.clinicName || '',
            email: data.email,
          },
          replace: true,
        })
      } else {
        setServerError(message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative selection:bg-primary/20 overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Bar with Back to Home button & theme toggle */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between z-20 mb-4 sm:mb-8">
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
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-12 z-10 py-4">
        {/* LEFT SIDE: Matching Animated Visual Showcase */}
        <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] items-center justify-center animate-slide-left">
          <Suspense fallback={<div className="w-full h-96 rounded-3xl bg-surface/40 animate-pulse border border-border" />}>
            <AuthVisualShowcase variant="signin" />
          </Suspense>
        </div>

        {/* RIGHT SIDE: Sign In Form with slide-in animation */}
        <div className="w-full lg:w-[46%] xl:w-[44%] max-w-md mx-auto lg:mx-0 animate-slide-right">
          {/* Header */}
          <div className="text-left mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Clinical Access</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
              Sign In to zuna
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-2">
              Enter your credentials to access your designated clinical workspace
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-card border border-border">
            {pendingApprovalData && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 font-medium space-y-2.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-heading font-bold text-xs text-text-primary flex items-center gap-1.5">
                      <span>Registration Pending Approval</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">
                        Locked
                      </span>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-[11px]">
                      {pendingApprovalData.message}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono">
                    Status: Awaiting Super Admin
                  </span>
                  <Link
                    to={
                      pendingApprovalData.registrationId
                        ? `/awaiting-approval?regId=${pendingApprovalData.registrationId}`
                        : '/awaiting-approval'
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <span>Check Live Status</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {serverError && (
              <div className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-medium flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. clinician@aurahealth.org"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register('email')}
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  required
                  {...register('password')}
                />
                <div className="flex items-center justify-between mt-2.5 text-xs">
                  <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary/30"
                      {...register('rememberMe')}
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoggingIn}
                className="w-full mt-2 shadow-glow/30"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Bottom Register Clinic link */}
            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs text-text-secondary">
                New healthcare provider or hospital?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>Register Practice</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[11px] text-text-secondary py-3 z-10">
        &copy; {new Date().getFullYear()} Zuna Health Systems Inc. All rights reserved. HIPAA & ISO 27001 Compliant.
      </footer>
    </div>
  )
}

export default LoginPage

