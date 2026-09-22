import React, { useEffect, Suspense } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  Building2,
  Users,
  ShieldAlert,
  Sliders,
  FileText,
  HeartPulse,
  Calendar,
  Pill,
  CreditCard,
  Boxes,
  BarChart3,
  KeyRound,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Hospital,
  Sparkles,
  AlertTriangle,
  FolderTree,
  Smile,
  Layers,
  FlaskConical,
  ClipboardList,
  FileImage,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import { useAuthStore } from '../../store/useAuthStore'
import { useUiStore } from '../../store/useUiStore'
import { api } from '../../lib/api'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { notify } from '../ui/Toast'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { SkeletonCard, SkeletonTable } from '../ui/Skeleton'
import { SuperadminNotificationBell } from './SuperadminNotificationBell'

const ModuleLoader = () => (
  <div className="p-2 sm:p-4 space-y-6 animate-pulse">
    <SkeletonCard />
    <SkeletonTable rows={4} cols={4} />
  </div>
)

const ToothIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4.5 10c0-3.5 2.5-6 6.5-6 2.5 0 3.5 1 5 1s2.5-1 5-1c4 0 6.5 2.5 6.5 6 0 3-1 5.5-2.5 9-1 2.5-2.5 4.5-4 4.5s-2-2-3.5-5.5c-1-2.5-2-2.5-3 0-1.5 3.5-2 5.5-3.5 5.5s-3-2-4-4.5C5.5 15.5 4.5 13 4.5 10z" />
  </svg>
)

const ICON_MAP = {
  Users,
  Calendar,
  Pill,
  CreditCard,
  Boxes,
  Sparkles,
  BarChart3,
  KeyRound,
  ShieldCheck,
  Sliders,
  Hospital,
  HeartPulse,
  FileText,
  Activity,
  Smile,
  Layers,
  FlaskConical,
  ClipboardList,
  FileImage,
  Tooth: ToothIcon,
}

export const getEffectiveRoleTitle = (user, isShort = false) => {
  if (!user) return isShort ? 'Staff' : 'Clinical Staff'

  const email = (user.email || '').toLowerCase().trim()
  if (
    user.isSuperadmin ||
    user.userType === 'SUPERADMIN' ||
    user.role === 'SUPERADMIN' ||
    email === 'admin@zuna.com' ||
    email === 'superadmin@clinic.io' ||
    email === 'superadmin@clinic.io'
  ) {
    return isShort ? 'Super Admin' : 'Super Administrator'
  }

  if (user.isAdmin || user.userType === 'ADMIN' || user.role === 'ADMIN') {
    if (isShort) return 'Clinic Admin'
    return user.roleTitle || 'Clinical Administrator'
  }

  // Priority: user.roleTitle, first role in user.roles, or user.role
  const candidateTitle =
    user.roleTitle ||
    (Array.isArray(user.roles) && user.roles.length > 0
      ? (typeof user.roles[0] === 'object' ? user.roles[0]?.name : user.roles[0])
      : null) ||
    user.role ||
    ''

  const titleStr = typeof candidateTitle === 'object' ? candidateTitle?.name || '' : String(candidateTitle)

  if (titleStr && titleStr.trim()) {
    const lower = titleStr.toLowerCase().trim()
    if (lower.includes('superadmin')) return isShort ? 'Super Admin' : 'Super Administrator'
    if (lower.includes('admin')) return isShort ? 'Clinic Admin' : 'Clinical Administrator'
    if (lower.includes('physician') || lower.includes('doctor')) return isShort ? 'Attending MD' : 'Senior Attending Physician'
    if (lower.includes('nurse')) return isShort ? 'Clinical Nurse' : 'Registered Clinical Nurse'
    if (lower.includes('reception') || lower.includes('front desk')) return isShort ? 'Receptionist' : 'Front Desk & Receptionist'
    if (lower.includes('biller') || lower.includes('billing')) return isShort ? 'Biller' : 'Billing & Insurance Officer'
    if (lower.includes('pharmacy') || lower.includes('stock')) return isShort ? 'Pharmacist' : 'Pharmacy & Stock Officer'
    if (lower === 'staff') return isShort ? 'Staff' : 'Clinical Staff'
    return isShort && titleStr.length > 14 ? titleStr.slice(0, 12) + '..' : titleStr
  }

  return isShort ? 'Staff' : 'Clinical Staff'
}

export const AppShell = () => {
  const { user, logout } = useAuth()
  const { hasPermission, isSuperadmin, isAdmin } = usePermissions()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUiStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Background sync: ensures the latest authoritative role, permissions, and clinic are in state
  useEffect(() => {
    if (!user?.id) return
    let isMounted = true
    api.get('/api/auth/me')
      .then((res) => {
        if (isMounted && res.data?.data) {
          const freshUser = res.data.data
          const currentUser = useAuthStore.getState().user
          if (
            currentUser &&
            (currentUser.role !== freshUser.role ||
              currentUser.roleTitle !== freshUser.roleTitle ||
              currentUser.clinicName !== freshUser.clinicName ||
              JSON.stringify(currentUser.roles) !== JSON.stringify(freshUser.roles))
          ) {
            useAuthStore.getState().setUser({
              ...currentUser,
              ...freshUser,
            })
          }
        }
      })
      .catch(() => {
        // Silently ignore if offline or demo mode
      })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Live broadcast listener: updates permissions across tabs live without logout/login
  useEffect(() => {
    if (!user || isSuperadmin) return

    let channel = null
    try {
      channel = new BroadcastChannel('clinic_permissions_channel')
      channel.onmessage = (event) => {
        const msg = event.data
        if (!msg) return

        if (msg.type === 'ROLE_PERMISSIONS_UPDATED') {
          const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean)
          const isMatchingRole = userRoles.some(
            (r) =>
              r === msg.roleId ||
              r === msg.roleName ||
              (typeof r === 'object' && (r.id === msg.roleId || r.name === msg.roleName))
          )
          if (isMatchingRole) {
            const updatedUser = {
              ...user,
              permissions: msg.permissions,
              effectivePermissions: msg.permissions,
            }
            useAuthStore.getState().setUser(updatedUser)
            notify.info(`Your role privileges ("${msg.roleName}") were updated live by Admin.`)
          }
        }
      }
    } catch (e) {}

    const handleStorageChange = (e) => {
      if (e.key === 'clinic_last_role_update' && e.newValue) {
        try {
          const update = JSON.parse(e.newValue)
          const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean)
          const isMatchingRole = userRoles.some(
            (r) => r === update.roleId || r === update.roleName
          )
          if (isMatchingRole) {
            const updatedUser = {
              ...user,
              permissions: update.permissions,
              effectivePermissions: update.permissions,
            }
            useAuthStore.getState().setUser(updatedUser)
          }
        } catch (err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user?.id, user?.roles, isSuperadmin])

  const { permittedModules, hasZeroPermissions, isSuperadmin: isRbacSuper } = useRolePermissions()

  // Dynamic Navigation: Render sidebar/menu ONLY for modules with can_view = true from the Permission API
  let navItems = []

  if (isSuperadmin || isRbacSuper) {
    navItems = [
      { to: '/app/superadmin/dashboard', label: 'System KPIs', icon: BarChart3 },
      { to: '/app/superadmin/clinics', label: 'Clinic Tenants', icon: Hospital },
      { to: '/app/superadmin/clinic-categories', label: 'Clinic Categories', icon: FolderTree },
      { to: '/app/superadmin/admins', label: 'Clinic Admins', icon: Users },
      { to: '/app/superadmin/settings', label: 'Global Settings', icon: Sliders },
      { to: '/app/superadmin/audit-logs', label: 'Audit Logs', icon: FileText },
      { to: '/app/superadmin/health', label: 'System Health', icon: HeartPulse },
    ]
  } else if (isAdmin) {
    navItems = [
      { to: '/app/admin/dashboard', label: 'Overview KPIs', icon: BarChart3 },
    ]

    // Category-driven ERP module switching:
    // Render ONLY modules enabled for this clinic category and permitted for the role
    permittedModules.forEach((mod) => {
      if (mod.route === '/app/admin/dashboard' || mod.route === '/app/staff/dashboard') return
      navItems.push({
        to: mod.route,
        label: mod.name,
        icon: ICON_MAP[mod.icon] || Boxes,
      })
    })

    // If Roles & Permissions is permitted and not already in permittedModules, add it
    const hasRolesInPermitted = permittedModules.some((m) => m.route?.includes('/roles'))
    if (!hasRolesInPermitted && hasPermission('roles.view')) {
      navItems.push({
        to: '/app/admin/roles',
        label: 'Roles & Permissions',
        icon: KeyRound,
      })
    }
  } else {
    // Dynamic Staff Navigation strictly based on user's permitted modules (can_view = true)
    navItems = [
      { to: '/app/staff/dashboard', label: 'My Overview', icon: Activity },
    ]

    permittedModules.forEach((mod) => {
      if (mod.route === '/app/staff/dashboard') return
      navItems.push({
        to: mod.route,
        label: mod.name,
        icon: ICON_MAP[mod.icon] || Boxes,
      })
    })

    navItems.push({
      to: '/app/staff/my-permissions',
      label: 'My Permissions',
      icon: ShieldCheck,
    })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar: Hidden below md */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-surface/70 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 select-none ${sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-surface border border-primary/20 p-1 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src="/zuna-logo.png"
                  alt="Zuna"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-bold text-sm text-text-primary tracking-tight truncate">
                  Zuna
                </span>
                <span
                  className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold truncate"
                  title={getEffectiveRoleTitle(user)}
                >
                  {getEffectiveRoleTitle(user)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-xl bg-surface border border-primary/20 p-1 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/zuna-logo.png"
                alt="Zuna"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors ${sidebarCollapsed ? 'mx-auto mt-2' : ''
              }`}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tenant/Clinic info pill */}
        {!sidebarCollapsed && user?.clinicName && (
          <div className="p-3 mx-3 my-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-text-primary truncate">
                {user.clinicName}
              </div>
              <div className="text-[10px] text-text-secondary truncate">Active Workspace</div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-border/40'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}

          {hasZeroPermissions && !sidebarCollapsed && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <AlertTriangle className="w-4 h-4 mx-auto text-amber-500" />
              <div className="text-[11px] font-bold text-amber-500">No modules assigned. Contact admin.</div>
              <p className="text-[10px] text-text-secondary leading-tight">Your role has not been granted view access to clinical modules.</p>
            </div>
          )}
        </nav>

        {/* Sidebar Footer User Area */}
        <div className="p-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar src={user?.avatar} name={user?.name} size="sm" status="online" />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-text-primary truncate">{user?.name}</div>
                <div
                  className="text-[10px] text-primary font-semibold truncate"
                  title={getEffectiveRoleTitle(user)}
                >
                  {getEffectiveRoleTitle(user)}
                </div>
                <div className="text-[9px] text-text-secondary truncate">{user?.email}</div>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 sm:h-16 border-b border-border bg-surface/50 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl border border-border bg-surface text-text-secondary shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs truncate min-w-0">
              <span className="hidden sm:inline font-bold text-text-primary capitalize shrink-0">
                {location.pathname.split('/')[2] || 'Clinical App'}
              </span>
              <span className="hidden sm:inline text-text-secondary shrink-0">/</span>
              <span className="text-text-primary sm:text-text-secondary capitalize font-bold sm:font-medium truncate">
                {location.pathname.split('/')[3]?.replace(/-/g, ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Badge variant="primary" size="sm" dot className="max-w-[120px] xs:max-w-[150px] sm:max-w-[260px] md:max-w-none">
              <span className="sm:hidden truncate">{getEffectiveRoleTitle(user, true)}</span>
              <span className="hidden sm:inline truncate">{getEffectiveRoleTitle(user)}</span>
            </Badge>
            {(isSuperadmin || isRbacSuper) && <SuperadminNotificationBell />}
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-surface border-r border-border h-full flex flex-col p-4 z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface border border-primary/20 p-0.5 flex items-center justify-center shrink-0 shadow-sm">
                    <img
                      src="/zuna-logo.png"
                      alt="Zuna"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading font-bold text-sm text-text-primary">Zuna</span>
                    <span
                      className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold truncate"
                      title={getEffectiveRoleTitle(user)}
                    >
                      {getEffectiveRoleTitle(user)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary shrink-0"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-border/30'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}

                {hasZeroPermissions && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                    <AlertTriangle className="w-4 h-4 mx-auto text-amber-500" />
                    <div className="text-[11px] font-bold text-amber-500">No modules assigned. Contact admin.</div>
                    <p className="text-[10px] text-text-secondary leading-tight">Your role has not been granted view access to clinical modules.</p>
                  </div>
                )}
              </nav>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={user?.avatar} name={user?.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-primary truncate">{user?.name}</div>
                    <div className="text-[10px] text-primary font-semibold truncate" title={getEffectiveRoleTitle(user)}>
                      {getEffectiveRoleTitle(user)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg shrink-0"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page View with Error Boundary & Lazy Route Loading Suspense */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl 2xl:max-w-[1600px] w-full mx-auto pb-20 md:pb-8">
          <ErrorBoundary panelTitle="Clinical Module">
            <Suspense fallback={<ModuleLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation (Visible below md) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-surface/90 backdrop-blur-lg flex items-center justify-around z-30 px-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-medium transition-colors ${isActive ? 'text-primary font-bold' : 'text-text-secondary'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[60px]">{item.label}</span>
              </NavLink>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center p-1 rounded-lg text-[10px] text-text-secondary"
            aria-label="More navigation options"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default AppShell
