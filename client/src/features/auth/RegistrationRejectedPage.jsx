import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { RegistrationStatusCard } from './components/RegistrationStatusCard'
import api from '../../lib/api'

export const RegistrationRejectedPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Extract rejection details from location state or search params or sessionStorage
  const stateData = location.state || {}
  const cachedData = (() => {
    try {
      const stored = sessionStorage.getItem('clinic_rejected_registration')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })()

  const queueRefFromUrl = searchParams.get('queueRef') || searchParams.get('regId')

  const [data, setData] = useState({
    clinicName:
      stateData.clinicName ||
      searchParams.get('clinicName') ||
      cachedData.clinicName ||
      'Your Clinical Practice',
    adminName: stateData.adminName || cachedData.adminName || 'Clinic Administrator',
    email: stateData.email || searchParams.get('email') || cachedData.email || '',
    subdomain: stateData.subdomain || searchParams.get('subdomain') || cachedData.subdomain || 'clinic',
    registrationId:
      stateData.queueReferenceId ||
      queueRefFromUrl ||
      cachedData.queueReferenceId ||
      cachedData.registrationId ||
      'reg-live-pending',
    rejectionReason:
      stateData.rejectionReason ||
      stateData.message ||
      searchParams.get('reason') ||
      cachedData.rejectionReason ||
      'The application details did not meet our verification criteria or licensing requirements.',
    rejectedAt: stateData.rejectedAt || cachedData.rejectedAt || new Date().toISOString(),
  })

  // If queueReferenceId is provided and details might be stale, fetch public status once
  useEffect(() => {
    const refId = data.registrationId
    if (refId && refId !== 'reg-live-pending') {
      api
        .get(`/api/public/registration-status/${refId}`)
        .then((res) => {
          if (res.data?.status === 'rejected') {
            const reg = res.data.registration || {}
            setData((prev) => ({
              ...prev,
              clinicName: reg.clinicName || prev.clinicName,
              email: reg.email || prev.email,
              subdomain: reg.subdomain || prev.subdomain,
              adminName: reg.adminName || prev.adminName,
              rejectionReason: res.data.rejectionReason || prev.rejectionReason,
              rejectedAt: res.data.rejectedAt || prev.rejectedAt,
            }))
          }
        })
        .catch(() => {})
    }
  }, [data.registrationId])

  const handleResubmit = () => {
    navigate('/register', {
      state: {
        clinicName: data.clinicName,
        email: data.email,
      },
      replace: true,
    })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative selection:bg-red-500/20 overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-20 mb-4 sm:mb-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary px-3.5 py-2 rounded-xl border border-border/80 hover:border-red-500/40 bg-surface/80 backdrop-blur-md transition-all shadow-sm group"
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
          variant="rejected"
          data={data}
          onResubmit={handleResubmit}
          showBackToLogin={true}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-xs text-text-muted z-20">
        &copy; {new Date().getFullYear()} clinic OS Platform Operations. All rights reserved.
      </footer>
    </div>
  )
}

export default RegistrationRejectedPage
