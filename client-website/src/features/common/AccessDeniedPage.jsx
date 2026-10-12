import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home, Lock, AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/useAuthStore'
import { useRolePermissions } from '../../hooks/useRolePermissions'

export const AccessDeniedPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { permittedModules } = useRolePermissions()

  const attemptedRoute = location.state?.from || location.pathname || 'Requested Resource'
  const defaultAllowedRoute = permittedModules[0]?.route || '/app/staff/dashboard'

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300">
      <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-danger/20 shadow-card text-center space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-danger/10 blur-3xl rounded-full pointer-events-none" />

        {/* 403 Badge & Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full bg-danger/10 border border-danger/20 text-danger font-mono font-bold text-xs tracking-wider uppercase">
            HTTP 403 • Access Denied
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Restricted Module Access
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Your role (<strong className="text-text-primary">{user?.roleTitle || user?.role || 'Staff'}</strong>) does not have authorization to view this module.
          </p>
          {location.state?.from && (
            <div className="mt-2 p-2 rounded-xl bg-surface border border-border text-[11px] font-mono text-text-muted break-all">
              Blocked: {location.state.from}
            </div>
          )}
        </div>

        {/* RBAC Policy Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-2.5 text-xs text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            This restriction is dynamically enforced by the RBAC Permission Matrix. If you require access, please contact your Clinic Administrator.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>

          <Link to={defaultAllowedRoute} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-sm"
            >
              Go to Permitted Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AccessDeniedPage
