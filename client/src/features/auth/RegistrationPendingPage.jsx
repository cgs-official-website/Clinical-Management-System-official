import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { RegistrationStatusCard } from './components/RegistrationStatusCard'
import { useAuthStore } from '../../store/useAuthStore'
import api from '../../lib/api'

export const RegistrationPendingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const stateData = location.state || {}
  const cachedData = (() => {
    try {
      const stored = sessionStorage.getItem('clinic_pending_registration')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })()

  const [data, setData] = useState({
    clinicName:
      stateData.clinicName ||
      searchParams.get('clinicName') ||
      cachedData.clinicName ||
      'Your Clinical Practice',
    adminName: stateData.adminName || cachedData.adminName || 'Clinic Administrator',
    email: stateData.email || searchParams.get('email') || cachedData.email || 'admin@clinic.io',
    subdomain: stateData.subdomain || searchParams.get('subdomain') || cachedData.subdomain || 'clinic',
    registrationId:
      stateData.queueReferenceId ||
      searchParams.get('regId') ||
      cachedData.queueReferenceId ||
      cachedData.registrationId ||
      'reg-live-pending',
    rejectionReason: null,
    rejectedAt: null,
  })

  const [variant, setVariant] = useState('pending')
  const [pulseSeconds, setPulseSeconds] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const hasRedirectedRef = useRef(false)
  const countdownIntervalRef = useRef(null)

  const triggerDashboardNavigation = (approvalPayload) => {
    if (hasRedirectedRef.current) return
    hasRedirectedRef.current = true

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    const user = approvalPayload?.user
    const tokens = approvalPayload?.tokens || {}
    const accessToken = tokens.accessToken || 'jwt_token_admin_' + Date.now()
    const refreshToken = tokens.refreshToken || 'refresh_token_admin_' + Date.now()

    if (user) {
      useAuthStore.getState().setAuth(user, accessToken, refreshToken)
    }

    navigate('/app/admin/dashboard?onboarding=true', { replace: true })
  }

  const handleApprovalSuccess = (approvalPayload, immediate = false) => {
    if (hasRedirectedRef.current) return
    setVariant('approved')

    const user = approvalPayload?.user
    const tokens = approvalPayload?.tokens || {}
    const accessToken = tokens.accessToken || 'jwt_token_admin_' + Date.now()
    const refreshToken = tokens.refreshToken || 'refresh_token_admin_' + Date.now()

    if (user) {
      useAuthStore.getState().setAuth(user, accessToken, refreshToken)
    }

    if (immediate) {
      triggerDashboardNavigation(approvalPayload)
      return
    }

    setCountdown(3)
    let remaining = 3
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current)
        triggerDashboardNavigation(approvalPayload)
      }
    }, 1000)
  }

  const handleRejection = (rejectionPayload) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setVariant('rejected')
    setData((prev) => ({
      ...prev,
      rejectionReason:
        rejectionPayload?.rejectionReason ||
        rejectionPayload?.reason ||
        'Your clinic registration was not approved. Please contact support or review the details below.',
      rejectedAt: rejectionPayload?.rejectedAt || new Date().toISOString(),
    }))
  }

  const handleResubmit = () => {
    navigate('/register', {
      state: {
        clinicName: data.clinicName,
        email: data.email,
      },
      replace: true,
    })
  }

  useEffect(() => {
    const regId = data.registrationId

    // Query status on mount
    if (regId && regId !== 'reg-live-pending') {
      api
        .get(`/api/public/registration-status/${regId}`)
        .then((res) => {
          if (res.data?.status === 'approved') {
            handleApprovalSuccess(res.data, true)
          } else if (res.data?.status === 'rejected') {
            handleRejection(res.data)
          }
        })
        .catch(() => {})
    }

    if (variant === 'rejected') return

    let channel = null
    try {
      channel = new BroadcastChannel('clinic_registration_channel')
      channel.onmessage = (event) => {
        const msg = event.data
        if (!msg) return

        const matches =
          msg.registrationId === regId ||
          (data.email && msg.email?.toLowerCase() === data.email.toLowerCase()) ||
          (data.email && msg.user?.email?.toLowerCase() === data.email.toLowerCase())

        if (msg.type === 'REGISTRATION_APPROVED' && matches) {
          handleApprovalSuccess(msg, false)
        } else if (msg.type === 'REGISTRATION_REJECTED' && matches) {
          handleRejection(msg)
        }
      }
    } catch (e) {}

    const handleStorageChange = (e) => {
      if (e.key === 'clinic_last_approved_registration' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue)
          if (
            payload.registrationId === regId ||
            (data.email && payload.user?.email?.toLowerCase() === data.email.toLowerCase())
          ) {
            handleApprovalSuccess(payload, false)
          }
        } catch (err) {}
      }

      if (e.key === 'clinic_last_rejected_registration' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue)
          if (
            payload.registrationId === regId ||
            (data.email && payload.email?.toLowerCase() === data.email.toLowerCase())
          ) {
            handleRejection(payload)
          }
        } catch (err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    const pollInterval = setInterval(async () => {
      if (!regId || regId === 'reg-live-pending' || hasRedirectedRef.current || variant === 'rejected') return
      try {
        const res = await api.get(`/api/public/registration-status/${regId}`)
        if (res.data?.status === 'approved') {
          handleApprovalSuccess(res.data, false)
        } else if (res.data?.status === 'rejected') {
          handleRejection(res.data)
        }
      } catch (err) {}
    }, 1500)

    const pulseTimer = setInterval(() => {
      setPulseSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(pollInterval)
      clearInterval(pulseTimer)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [data.registrationId, data.email, variant])

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative selection:bg-amber-500/20 overflow-x-hidden">
      {/* Dynamic ambient backdrop */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] rounded-full blur-[140px] pointer-events-none transition-colors duration-700 ${
          variant === 'approved'
            ? 'bg-emerald-500/20'
            : variant === 'rejected'
            ? 'bg-red-500/15'
            : 'bg-amber-500/10'
        }`}
      />

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-20 mb-4 sm:mb-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary px-3.5 py-2 rounded-xl border border-border/80 hover:border-amber-500/40 bg-surface/80 backdrop-blur-md transition-all shadow-sm group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Sign In</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-surface border border-border/80 p-1 shadow-sm transition-all flex items-center justify-center">
              <img
                src="/zuna-logo.png"
                alt="Zuna"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-heading font-extrabold text-lg text-text-primary">
              clinic<span className="text-primary">.os</span>
            </span>
          </Link>
          <div className="h-4 w-px bg-border mx-1" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-xl mx-auto w-full z-20 my-auto">
        <RegistrationStatusCard
          variant={variant}
          data={data}
          pulseSeconds={pulseSeconds}
          countdown={countdown}
          onResubmit={handleResubmit}
          onNavigateDashboard={() => triggerDashboardNavigation({ user: null })}
          showBackToLogin={variant !== 'approved'}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-xs text-text-muted z-20">
        &copy; {new Date().getFullYear()} clinic OS Platform Operations. All rights reserved.
      </footer>
    </div>
  )
}

export default RegistrationPendingPage
