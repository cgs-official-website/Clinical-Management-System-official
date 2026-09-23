import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { useRolePermissions } from '../hooks/useRolePermissions'
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton'

// Lazy loaded page components for optimal bundle isolation
const AccessDeniedPage = lazy(() => import('../features/common/AccessDeniedPage'))
const LandingPage = lazy(() => import('../features/landing/LandingPage'))
const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))
const AwaitingApprovalPage = lazy(() => import('../features/auth/AwaitingApprovalPage'))
const RegistrationRejectedPage = lazy(() => import('../features/auth/RegistrationRejectedPage'))
const RegistrationPendingPage = lazy(() => import('../features/auth/RegistrationPendingPage'))
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage'))

// Superadmin pages
const SuperadminDashboard = lazy(() => import('../features/superadmin/SuperadminDashboard'))
const ClinicsManagement = lazy(() => import('../features/superadmin/ClinicsManagement'))
const ClinicCategoriesPage = lazy(() => import('../features/superadmin/ClinicCategoriesPage'))
const AdminAccountsPage = lazy(() => import('../features/superadmin/AdminAccountsPage'))
const GlobalSettingsPage = lazy(() => import('../features/superadmin/GlobalSettingsPage'))
const AuditLogsPage = lazy(() => import('../features/superadmin/AuditLogsPage'))
const SystemHealthWidget = lazy(() => import('../features/superadmin/SystemHealthWidget'))
const SubscriptionMonitoringPage = lazy(() => import('../features/superadmin/SubscriptionMonitoringPage'))
const CompanySettingsPage = lazy(() => import('../features/superadmin/CompanySettingsPage'))

// Admin pages
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'))
const RolesListPage = lazy(() => import('../features/admin/roles-permissions/RolesListPage'))
const PermissionMatrixPage = lazy(() => import('../features/admin/roles-permissions/PermissionMatrixPage'))
const AssignStaffPage = lazy(() => import('../features/admin/roles-permissions/AssignStaffPage'))
const StaffRolesListPage = lazy(() => import('../features/admin/roles-permissions/StaffRolesListPage'))
const RoleTemplatesPage = lazy(() => import('../features/admin/roles-permissions/RoleTemplatesPage'))
const StaffManagementPage = lazy(() => import('../features/admin/StaffManagementPage'))
const ClinicalConfigPage = lazy(() => import('../features/admin/ClinicalConfigPage'))
const AdminReportsPage = lazy(() => import('../features/admin/AdminReportsPage'))
const AdminSubscriptionPage = lazy(() => import('../features/admin/AdminSubscriptionPage'))

// Staff pages
const StaffDashboard = lazy(() => import('../features/staff/StaffDashboard'))
const PatientsPage = lazy(() => import('../features/staff/PatientsPage'))
const AppointmentsPage = lazy(() => import('../features/staff/AppointmentsPage'))
const PrescriptionsPage = lazy(() => import('../features/staff/PrescriptionsPage'))
const BillingPage = lazy(() => import('../features/staff/BillingPage'))
const InventoryPage = lazy(() => import('../features/staff/InventoryPage'))
const StaffReportsPage = lazy(() => import('../features/staff/StaffReportsPage'))
const MyPermissionsPage = lazy(() => import('../features/staff/MyPermissionsPage'))
const PatientFlowPage = lazy(() => import('../features/staff/PatientFlowPage'))

// Dental category pages
const DentalChartPage = lazy(() => import('../features/dental/DentalChartPage'))
const TreatmentPlansPage = lazy(() => import('../features/dental/TreatmentPlansPage'))
const XrayRecordsPage = lazy(() => import('../features/dental/XrayRecordsPage'))
const OrthodonticsPage = lazy(() => import('../features/dental/OrthodonticsPage'))
const ImplantRegistryPage = lazy(() => import('../features/dental/ImplantRegistryPage'))
const LabOrdersPage = lazy(() => import('../features/dental/LabOrdersPage'))

// Physiotherapy category pages
const TreatmentSessionPlansPage = lazy(() => import('../features/physio/TreatmentSessionPlansPage'))
const ExerciseProgramTrackerPage = lazy(() => import('../features/physio/ExerciseProgramTrackerPage'))
const ProgressRecoveryNotesPage = lazy(() => import('../features/physio/ProgressRecoveryNotesPage'))

// Cardiology category pages
const EcgRecordsPage = lazy(() => import('../features/cardio/EcgRecordsPage'))
const EchoReportsPage = lazy(() => import('../features/cardio/EchoReportsPage'))
const CathLabSchedulingPage = lazy(() => import('../features/cardio/CathLabSchedulingPage'))
const CardiacRiskAssessmentPage = lazy(() => import('../features/cardio/CardiacRiskAssessmentPage'))

// Loading Fallback Component
const PageLoader = () => (
  <div className="p-6 space-y-6">
    <SkeletonCard />
    <SkeletonTable rows={4} cols={4} />
  </div>
)

// Route Guards & Dynamic Role Redirection
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const { isSuperadmin, isAdmin } = usePermissions()

  if (isAuthenticated && user) {
    if (isSuperadmin) return <Navigate to="/app/superadmin/dashboard" replace />
    if (isAdmin) return <Navigate to="/app/admin/dashboard" replace />
    return <Navigate to="/app/staff/dashboard" replace />
  }
  return children
}

const RequireRole = ({ role, children }) => {
  const { user } = useAuth()
  const { isSuperadmin, isAdmin } = usePermissions()

  if (!user) return <Navigate to="/login" replace />

  const targetRole = role.toUpperCase()
  const userRole = (user.role || user.userType || '').toUpperCase()

  // Guard Superadmin routes strictly: only genuine superadmins may enter
  if (targetRole === 'SUPERADMIN') {
    if (!isSuperadmin) {
      if (isAdmin || userRole === 'ADMIN') return <Navigate to="/app/admin/dashboard" replace />
      return <Navigate to="/app/staff/dashboard" replace />
    }
    return children
  }

  if (isSuperadmin) return children

  const hasTargetRole =
    userRole === targetRole ||
    (targetRole === 'ADMIN' && isAdmin) ||
    (Array.isArray(user.roles) &&
      user.roles.map((r) => (typeof r === 'string' ? r : r.name || '').toUpperCase()).includes(targetRole))

  if (!hasTargetRole) {
    // Redirect to proper role panel based on actual role
    if (isAdmin || userRole === 'ADMIN') return <Navigate to="/app/admin/dashboard" replace />
    return <Navigate to="/app/staff/dashboard" replace />
  }
  return children
}

const RoleDefaultRedirect = () => {
  const { isSuperadmin, isAdmin } = usePermissions()
  if (isSuperadmin) return <Navigate to="superadmin/dashboard" replace />
  if (isAdmin) return <Navigate to="admin/dashboard" replace />
  return <Navigate to="staff/dashboard" replace />
}

const RequireModuleView = ({ route, children }) => {
  const location = useLocation()
  const { hasViewPermission, isLoading, isSuperadmin } = useRolePermissions()

  if (isSuperadmin) return children
  if (isLoading) return <PageLoader />

  const targetRoute = route || location.pathname
  const isAllowed = hasViewPermission(targetRoute)

  if (!isAllowed) {
    return <Navigate to="/403" state={{ from: location.pathname }} replace />
  }

  return children
}

export const router = createBrowserRouter([
  {
    path: '/403',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <Suspense fallback={<PageLoader />}>
          <RegisterPage />
        </Suspense>
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/awaiting-approval',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AwaitingApprovalPage />
      </Suspense>
    ),
  },
  {
    path: '/registration-rejected',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegistrationRejectedPage />
      </Suspense>
    ),
  },
  {
    path: '/registration-pending',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegistrationPendingPage />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        path: '',
        element: <RoleDefaultRedirect />,
      },
      // SUPERADMIN ROUTES
      {
        path: 'superadmin/dashboard',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <SuperadminDashboard />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/clinics',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <ClinicsManagement />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/clinic-categories',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <ClinicCategoriesPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/admins',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <AdminAccountsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/subscriptions',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <SubscriptionMonitoringPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/company-settings',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <CompanySettingsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/settings',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <GlobalSettingsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/audit-logs',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <AuditLogsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'superadmin/health',
        element: (
          <RequireRole role="SUPERADMIN">
            <Suspense fallback={<PageLoader />}>
              <SystemHealthWidget />
            </Suspense>
          </RequireRole>
        ),
      },

      // ADMIN ROUTES
      {
        path: 'admin/dashboard',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/roles',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <RolesListPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/roles/matrix',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <PermissionMatrixPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/roles/assign',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <AssignStaffPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/roles/staff-list',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <StaffRolesListPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/roles/templates',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <RoleTemplatesPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/staff',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <StaffManagementPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/clinical-config',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <ClinicalConfigPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/reports',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <AdminReportsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'admin/subscription',
        element: (
          <RequireRole role="ADMIN">
            <Suspense fallback={<PageLoader />}>
              <AdminSubscriptionPage />
            </Suspense>
          </RequireRole>
        ),
      },

      // STAFF ROUTES (Dynamic per permission)
      {
        path: 'staff/flow',
        element: (
          <RequireModuleView route="/app/staff/flow">
            <Suspense fallback={<PageLoader />}>
              <PatientFlowPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <StaffDashboard />
          </Suspense>
        ),
      },
      {
        path: 'staff/patients',
        element: (
          <RequireModuleView route="/app/staff/patients">
            <Suspense fallback={<PageLoader />}>
              <PatientsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/appointments',
        element: (
          <RequireModuleView route="/app/staff/appointments">
            <Suspense fallback={<PageLoader />}>
              <AppointmentsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/prescriptions',
        element: (
          <RequireModuleView route="/app/staff/prescriptions">
            <Suspense fallback={<PageLoader />}>
              <PrescriptionsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/billing',
        element: (
          <RequireModuleView route="/app/staff/billing">
            <Suspense fallback={<PageLoader />}>
              <BillingPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/inventory',
        element: (
          <RequireModuleView route="/app/staff/inventory">
            <Suspense fallback={<PageLoader />}>
              <InventoryPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/reports',
        element: (
          <RequireModuleView route="/app/staff/reports">
            <Suspense fallback={<PageLoader />}>
              <StaffReportsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      // DENTAL CARE CATEGORY MODULE ROUTES
      {
        path: 'dental/chart',
        element: (
          <RequireModuleView route="/app/dental/chart">
            <Suspense fallback={<PageLoader />}>
              <DentalChartPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'dental/treatment-plans',
        element: (
          <RequireModuleView route="/app/dental/treatment-plans">
            <Suspense fallback={<PageLoader />}>
              <TreatmentPlansPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'dental/xrays',
        element: (
          <RequireModuleView route="/app/dental/xrays">
            <Suspense fallback={<PageLoader />}>
              <XrayRecordsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'dental/orthodontics',
        element: (
          <RequireModuleView route="/app/dental/orthodontics">
            <Suspense fallback={<PageLoader />}>
              <OrthodonticsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'dental/implants',
        element: (
          <RequireModuleView route="/app/dental/implants">
            <Suspense fallback={<PageLoader />}>
              <ImplantRegistryPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'dental/lab-orders',
        element: (
          <RequireModuleView route="/app/dental/lab-orders">
            <Suspense fallback={<PageLoader />}>
              <LabOrdersPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      // PHYSIOTHERAPY CATEGORY MODULE ROUTES
      {
        path: 'physio/treatment-plans',
        element: (
          <RequireModuleView route="/app/physio/treatment-plans">
            <Suspense fallback={<PageLoader />}>
              <TreatmentSessionPlansPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'physio/exercise-tracker',
        element: (
          <RequireModuleView route="/app/physio/exercise-tracker">
            <Suspense fallback={<PageLoader />}>
              <ExerciseProgramTrackerPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'physio/progress-notes',
        element: (
          <RequireModuleView route="/app/physio/progress-notes">
            <Suspense fallback={<PageLoader />}>
              <ProgressRecoveryNotesPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      // CARDIOLOGY CATEGORY MODULE ROUTES
      {
        path: 'cardio/ecg-records',
        element: (
          <RequireModuleView route="/app/cardio/ecg-records">
            <Suspense fallback={<PageLoader />}>
              <EcgRecordsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'cardio/echo-reports',
        element: (
          <RequireModuleView route="/app/cardio/echo-reports">
            <Suspense fallback={<PageLoader />}>
              <EchoReportsPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'cardio/cath-lab',
        element: (
          <RequireModuleView route="/app/cardio/cath-lab">
            <Suspense fallback={<PageLoader />}>
              <CathLabSchedulingPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'cardio/risk-assessment',
        element: (
          <RequireModuleView route="/app/cardio/risk-assessment">
            <Suspense fallback={<PageLoader />}>
              <CardiacRiskAssessmentPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'cardio/implants',
        element: (
          <RequireModuleView route="/app/cardio/implants">
            <Suspense fallback={<PageLoader />}>
              <ImplantRegistryPage />
            </Suspense>
          </RequireModuleView>
        ),
      },
      {
        path: 'staff/my-permissions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyPermissionsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default router
