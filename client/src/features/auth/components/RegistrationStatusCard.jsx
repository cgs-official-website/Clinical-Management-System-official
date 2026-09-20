import React from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Radio,
  Building2,
  Mail,
  RotateCcw,
  Headphones,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'

/**
 * RegistrationStatusCard
 * Shared base card component supporting three distinct variants:
 * - "pending": verification in progress with pulsing beacon & live broadcast listener
 * - "approved": verification successful with green badge, countdown & auto-redirect
 * - "rejected": registration rejected with red badge, exact reason, rejection timestamp & re-submission actions
 */
export const RegistrationStatusCard = ({
  variant = 'pending',
  data = {},
  pulseSeconds = 0,
  countdown = 3,
  onResubmit,
  onNavigateDashboard,
  showBackToLogin = true,
}) => {
  const clinicName = data.clinicName || 'Your Clinical Practice'
  const email = data.email || 'admin@clinic.io'
  const subdomain = data.subdomain || 'clinic'
  const registrationId = data.registrationId || data.queueReferenceId || 'reg-live-pending'
  const rejectionReason =
    data.rejectionReason ||
    'Your clinic registration was not approved. Please contact support or review the details below.'

  const formatTimestamp = (ts) => {
    if (!ts) return new Date().toLocaleString()
    try {
      const d = new Date(ts)
      return isNaN(d.getTime()) ? String(ts) : d.toLocaleString()
    } catch {
      return String(ts)
    }
  }

  return (
    <div className="bg-surface/85 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-10 relative overflow-hidden text-center transition-all duration-500">
      {/* Subtle top ambient accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-700 ${
          variant === 'approved'
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-primary'
            : variant === 'rejected'
            ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500'
            : 'bg-gradient-to-r from-primary via-teal-400 to-amber-400'
        }`}
      />

      {/* 1. APPROVED STATE */}
      {variant === 'approved' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          {/* Green Checkmark Badge */}
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-glow">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>APPROVED</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
              Verification Successful
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto">
              Your clinic has been approved. Redirecting you to your Dashboard...
            </p>
          </div>

          {/* Details Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg/80 border border-border/80 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Clinic Name
              </span>
              <span className="font-bold text-text-primary">{clinicName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Administrator
              </span>
              <span className="font-medium text-text-primary">{email}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted">Target Subdomain</span>
              <span className="font-mono text-primary font-semibold">
                {subdomain}.clinic.io
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-text-muted">Queue Reference ID</span>
              <span className="font-mono text-[11px] text-text-muted">{registrationId}</span>
            </div>
          </div>

          {/* Countdown Area & Direct Button */}
          <div className="pt-2 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>
                Redirecting in {countdown > 0 ? `${countdown}... 2... 1...` : '0...'}
              </span>
            </div>

            <Button
              variant="primary"
              className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-glow/30"
              onClick={onNavigateDashboard}
            >
              <span>Go to Admin Dashboard Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. REJECTED STATE */}
      {variant === 'rejected' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          {/* Red/Rose X or Alert Icon Badge */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center shadow-glow/20">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>REGISTRATION REJECTED</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
              Registration Rejected
            </h2>
            <div className="mt-3 p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-text-secondary leading-relaxed max-w-md mx-auto text-center font-sans whitespace-pre-wrap">
              <span className="font-semibold text-red-600 dark:text-red-400 block mb-1">
                Reason for Rejection:
              </span>
              {rejectionReason}
            </div>
          </div>

          {/* Details Table (Same rows + Rejected On) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg/80 border border-border/80 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Clinic Name
              </span>
              <span className="font-bold text-text-primary">{clinicName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Administrator
              </span>
              <span className="font-medium text-text-primary">{email}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted">Target Subdomain</span>
              <span className="font-mono text-primary font-semibold">
                {subdomain}.clinic.io
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted">Queue Reference ID</span>
              <span className="font-mono text-[11px] text-text-muted">{registrationId}</span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                Rejected On
              </span>
              <span className="font-mono text-[11px] text-red-600 dark:text-red-400 font-medium">
                {formatTimestamp(data.rejectedAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Re-submit & Contact Support */}
          <div className="pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="primary"
                className="h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-glow/30"
                onClick={onResubmit}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-submit Registration</span>
              </Button>

              <a
                href={`mailto:support@clinic.io?subject=Inquiry%20regarding%20rejected%20registration%20(${encodeURIComponent(
                  clinicName
                )})&body=Hello%20Support%20Team,%0D%0A%0D%0AMy%20clinic%20registration%20was%20not%20approved%20with%20reason:%0D%0A"${encodeURIComponent(
                  rejectionReason
                )}"%0D%0A%0D%0APlease%20advise%20on%20how%20to%20proceed.`}
                className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-border hover:border-primary/40 hover:bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary transition-all shadow-sm"
              >
                <Headphones className="w-4 h-4 text-primary" />
                <span>Contact Support</span>
              </a>
            </div>

            {showBackToLogin && (
              <div className="pt-2 flex items-center justify-center text-xs text-text-secondary">
                <Link
                  to="/login"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Back to Sign In</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PENDING STATE */}
      {variant === 'pending' && (
        <div className="space-y-6">
          {/* Radar Beacon Pulse */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-60" />
            <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-teal-400 p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-surface rounded-full flex items-center justify-center">
                <Clock className="w-7 h-7 text-primary animate-[spin_6s_linear_infinite]" />
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Awaiting Super Admin Approval</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
              Verification in Progress
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto">
              Your registration has been placed in the Super Admin provisioning queue. When approved,
              this screen will automatically navigate to your Dashboard without requiring a page refresh.
            </p>
          </div>

          {/* Clinic Registration Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg/80 border border-border/80 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Clinic Name
              </span>
              <span className="font-bold text-text-primary">{clinicName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Administrator
              </span>
              <span className="font-medium text-text-primary">{email}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-text-muted">Target Subdomain</span>
              <span className="font-mono text-primary font-semibold">
                {subdomain}.clinic.io
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-text-muted">Queue Reference ID</span>
              <span className="font-mono text-[11px] text-text-muted">{registrationId}</span>
            </div>
          </div>

          {/* Status footer with live heartbeat indicator */}
          <div className="pt-2 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Listening for instant approval broadcast ({pulseSeconds}s elapsed)</span>
            </div>

            {showBackToLogin && (
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <Link
                  to="/login"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Back to Sign In</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrationStatusCard
