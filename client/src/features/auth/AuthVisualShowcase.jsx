import React from 'react'
import {
  Activity,
  ShieldCheck,
  Zap,
  Sparkles,
  Building2,
  Lock,
  Stethoscope,
  Clock,
  HeartPulse,
  TrendingUp,
} from 'lucide-react'

export const AuthVisualShowcase = ({ variant = 'signin', clinicName }) => {
  const isSignIn = variant === 'signin'
  const isStaff = variant === 'staff'

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center select-none overflow-hidden py-8 px-2 lg:px-6">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-primary/15 dark:bg-primary/20 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 right-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none animate-float-reverse" />

      {/* Decorative Rotating Radar Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-primary/15 border-dashed pointer-events-none animate-spin-slow opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-border/40 pointer-events-none opacity-40" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/90 border border-primary/30 backdrop-blur-md shadow-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
          <span className="text-[11px] font-bold text-text-primary tracking-wide uppercase">
            {isSignIn
              ? 'Unified Clinical Access'
              : isStaff
                ? 'Staff Invitation Access'
                : 'Enterprise Clinical Onboarding'}
          </span>
          <span className="text-[10px] text-primary font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10">
            v3.4
          </span>
        </div>

        {/* Main Headline */}
        <div className="space-y-2.5">
          <h2 className="font-heading font-extrabold text-2xl xl:text-3xl text-text-primary leading-tight tracking-tight">
            {isSignIn ? (
              <>
                Intelligent Clinical Care, <br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  Synchronized in Real Time.
                </span>
              </>
            ) : isStaff ? (
              <>
                Welcome to Your <br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  Care Team Workspace.
                </span>
              </>
            ) : (
              <>
                Empower Your Clinic with <br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  Automated Healthcare OS.
                </span>
              </>
            )}
          </h2>
          <p className="text-xs xl:text-sm text-text-secondary leading-relaxed max-w-md">
            {isSignIn
              ? 'Secure, role-tailored workstation for clinicians, hospital administrators, and medical staff across integrated outpatient and inpatient care units.'
              : isStaff
                ? `Activate your authorized credentials for ${clinicName || 'your healthcare practice'}. Set your personal password and commence patient consultations.`
                : 'Provision high-throughput Electronic Health Records, multi-tenant RBAC, and instant Superadmin verification with zero operational friction.'}
          </p>
        </div>

        {/* Animated Visual Card Stack */}
        <div className="relative pt-2 pb-4 space-y-4">
          {/* Card 1: Live Telemetry & Heartbeat ECG (Top Floating Card) */}
          <div className="glass-card p-4 rounded-2xl border border-border/80 shadow-card animate-float-slow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {isSignIn ? (
                    <Activity className="w-4 h-4" />
                  ) : isStaff ? (
                    <Stethoscope className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <span>
                      {isSignIn
                        ? 'Practice Live Telemetry'
                        : isStaff
                          ? 'Active Clinical Queue'
                          : 'Instant Node Provisioning'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {isSignIn
                      ? '99.99% system availability • 12,400+ encounters'
                      : isStaff
                        ? 'Duty rotation & EHR synchronization active'
                        : 'Automated FHIR database & HIPAA audit cluster'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg">
                {isSignIn ? '14ms latency' : isStaff ? 'Ready' : 'Automated'}
              </span>
            </div>

            {/* Heartbeat ECG Waveform Animation */}
            <div className="relative h-10 w-full bg-surface/80 rounded-xl overflow-hidden px-3 flex items-center border border-border/60">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
              <svg
                viewBox="0 0 300 40"
                className="w-full h-8 text-primary overflow-visible opacity-90 stroke-current"
                fill="none"
              >
                <path
                  d="M0 20 L40 20 L50 20 L58 10 L64 32 L72 4 L80 36 L88 20 L100 20 L140 20 L148 10 L154 32 L162 4 L170 36 L178 20 L210 20 L218 10 L224 32 L232 4 L240 36 L248 20 L300 20"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Security & Permissions / Trust Badge (Bottom Floating Card) */}
          <div className="glass-card p-4 rounded-2xl border border-border/80 shadow-card animate-float-reverse -mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">
                    {isSignIn
                      ? 'Role-Based Access Control (RBAC)'
                      : isStaff
                        ? 'Protected Clinician Session'
                        : 'Certified Health Data Privacy'}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    {isSignIn
                      ? 'End-to-end encrypted session with biometric & token verification'
                      : isStaff
                        ? 'Locked institutional email with credential isolation'
                        : 'ISO-27001, SOC-2 Type II & HIPAA audit compliant'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tags */}
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-2 flex-wrap text-[10px]">
              {isSignIn ? (
                <>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Admin Panel
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Physician EMR
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Pharmacy & Labs
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                    Multi-Clinic
                  </span>
                </>
              ) : isStaff ? (
                <>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Verified Link
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Self-Set Password
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Secure Workspace
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                    Instant Queue
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    256-bit AES
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Audit Trail
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface font-medium text-text-secondary border border-border/80">
                    Custom Domain
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Security Footer */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>256-bit SSL Encrypted Connection</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-text-primary">zuna </span>
            <span>Healthcare</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthVisualShowcase
