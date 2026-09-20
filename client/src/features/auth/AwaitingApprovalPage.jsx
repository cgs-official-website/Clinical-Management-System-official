import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuthStore } from '../../store/useAuthStore'
import { RegistrationStatusCard } from './components/RegistrationStatusCard'
import api from '../../lib/api'

export const AwaitingApprovalPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const regIdFromUrl = searchParams.get('regId')

  const [regData, setRegData] = useState(() => {
    const cached = sessionStorage.getItem('clinic_pending_registration')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        return {
          registrationId: parsed.registrationId || regIdFromUrl || 'reg-live-pending',
          clinicName: parsed.clinicName || 'Your Clinical Practice',
          adminName: parsed.adminName || 'Clinic Administrator',
          email: parsed.email || 'admin@clinic.io',
          subdomain: parsed.subdomain || 'clinic',
          submittedAt: parsed.submittedAt || new Date().toISOString(),
          rejectionReason: parsed.rejectionReason || null,
          rejectedAt: parsed.rejectedAt || null,
        }
      } catch (e) {}
    }
    return {
      registrationId: regIdFromUrl || 'reg-live-pending',
      clinicName: 'Your Clinical Practice',
      adminName: 'Clinic Administrator',
      email: 'admin@clinic.io',
      subdomain: 'clinic',
      submittedAt: new Date().toISOString(),
      rejectionReason: null,
      rejectedAt: null,
    }
  })

  const [variant, setVariant] = useState('pending') // 'pending' | 'approved' | 'rejected'
  const [pulseSeconds, setPulseSeconds] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const hasRedirectedRef = useRef(false)
  const countdownIntervalRef = useRef(null)

  // Navigate to Dashboard with auth tokens
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

  // Handle instant promotion to approved workspace
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
      // If already ACTIVE on reload, skip countdown animation and redirect immediately
      triggerDashboardNavigation(approvalPayload)
      return
    }

    // Live transition countdown (3.. 2.. 1..)
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

  // Handle rejection transition
  const handleRejection = (rejectionPayload) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setVariant('rejected')
    setRegData((prev) => ({
      ...prev,
      rejectionReason:
        rejectionPayload?.rejectionReason ||
        rejectionPayload?.reason ||
        'Your clinic registration was not approved. Please contact support or review the details below.',
      rejectedAt: rejectionPayload?.rejectedAt || new Date().toISOString(),
    }))
  }

  // Handle manual resubmit
  const handleResubmit = () => {
    navigate('/register', {
      state: {
        clinicName: regData.clinicName,
        email: regData.email,
      },
      replace: true,
    })
  }

  // Initial status check & Real-time listeners
  useEffect(() => {
    const regId = regData.registrationId || regIdFromUrl

    // Initial check on load to see if status is already approved or rejected
    if (regId) {
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

    // If already in rejected state, no need to listen since rejection is a terminal state
    if (variant === 'rejected') return

    // 1. BroadcastChannel listener (zero-latency across open tabs/browsers)
    let channel = null
    try {
      channel = new BroadcastChannel('clinic_registration_channel')
      channel.onmessage = (event) => {
        const msg = event.data
        if (!msg) return

        const matchesId =
          msg.registrationId === regId ||
          msg.registrationId === regData.registrationId ||
          (regData?.email && msg.email?.toLowerCase() === regData.email.toLowerCase()) ||
          (regData?.email && msg.user?.email?.toLowerCase() === regData.email.toLowerCase())

        if (msg.type === 'REGISTRATION_APPROVED' && matchesId) {
          handleApprovalSuccess(msg, false)
        } else if (msg.type === 'REGISTRATION_REJECTED' && matchesId) {
          handleRejection(msg)
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported', e)
    }

    // 2. Storage event listener (fires when Superadmin writes to localStorage in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'clinic_last_approved_registration' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue)
          if (
            payload.registrationId === regId ||
            (regData?.email && payload.user?.email?.toLowerCase() === regData.email.toLowerCase())
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
            (regData?.email && payload.email?.toLowerCase() === regData.email.toLowerCase())
          ) {
            handleRejection(payload)
          }
        } catch (err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // 3. Polling fallback (every 1.5s) to query registration status
    const pollInterval = setInterval(async () => {
      if (!regId || hasRedirectedRef.current || variant === 'rejected') return
      try {
        const res = await api.get(`/api/public/registration-status/${regId}`)
        if (res.data?.status === 'approved') {
          handleApprovalSuccess(res.data, false)
        } else if (res.data?.status === 'rejected') {
          handleRejection(res.data)
        }
      } catch (err) {
        // Silent catch for polling
      }
    }, 1500)

    // Pulse timer for visual feedback
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
  }, [regData.registrationId, regIdFromUrl, variant])

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-primary/20">
      {/* Dynamic ambient backdrop */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] rounded-full blur-[140px] pointer-events-none transition-colors duration-700 ${
          variant === 'approved'
            ? 'bg-emerald-500/20'
            : variant === 'rejected'
            ? 'bg-red-500/15'
            : 'bg-primary/15'
        }`}
      />

      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between mb-8 z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 p-0.5 shadow-sm group-hover:shadow-glow/40 transition-all">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <span className="font-heading font-bold text-base text-text-primary tracking-tight">
            clinic<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-text-secondary">
            <span
              className={`w-2 h-2 rounded-full ${
                variant === 'approved'
                  ? 'bg-emerald-500'
                  : variant === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-emerald-500 animate-ping'
              }`}
            />
            <span>
              {variant === 'approved'
                ? 'Status: Approved'
                : variant === 'rejected'
                ? 'Status: Rejected'
                : 'Live Sync: Active'}
            </span>
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        {/* Rendered Card Variant */}
        <RegistrationStatusCard
          variant={variant}
          data={regData}
          pulseSeconds={pulseSeconds}
          countdown={countdown}
          onResubmit={handleResubmit}
          onNavigateDashboard={() => triggerDashboardNavigation({ user: null })}
          showBackToLogin={variant !== 'approved'}
        />
      </div>
    </div>
  )
}

export default AwaitingApprovalPage
