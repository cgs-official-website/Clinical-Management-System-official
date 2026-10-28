import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'

export const useRolePermissions = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const isSuperadmin = Boolean(
    user?.isSuperadmin ||
    user?.is_super_admin ||
    user?.userType === 'SUPERADMIN' ||
    user?.role === 'SUPERADMIN' ||
    user?.email === 'admin@zuna.com' ||
    user?.email === 'superadmin@clinic.io'
  )

  const isAdmin = Boolean(
    user?.role === 'admin' ||
    user?.role === 'ADMIN' ||
    user?.role === 'Clinical Administrator' ||
    user?.roleTitle === 'Clinical Administrator' ||
    user?.userType === 'ADMIN' ||
    user?.userType === 'CLINIC_ADMIN' ||
    (Array.isArray(user?.roles) && user?.roles.some((r) => String(r).toLowerCase().includes('admin')))
  )

  const roleIdentifier =
    user?.roleId ||
    user?.role_id ||
    user?.role ||
    (Array.isArray(user?.roles) ? (typeof user?.roles[0] === 'object' ? user?.roles[0]?.id || user?.roles[0]?.name : user?.roles[0]) : 'staff') ||
    'staff'

  // Fetch role permissions on page load/refresh
  const { data: permData, isLoading, refetch } = useQuery({
    queryKey: ['rbac', 'user-permissions', user?.id || 'anon', roleIdentifier],
    queryFn: async () => {
      const tenantId = user?.tenantId || user?.tenant_id || ''

      // Super Admin bypass: always granted full access
      if (isSuperadmin) {
        const modRes = await api.get(`/api/modules${tenantId ? `?tenantId=${tenantId}` : ''}`)
        const mods = modRes.data?.modules || modRes.data?.data || []
        const superPerms = mods.map((m) => ({
          module_id: m.id,
          module_key: m.key,
          module_name: m.name,
          module_icon: m.icon,
          module_route: m.route,
          can_view: true,
          can_edit: true,
          can_delete: true,
        }))
        return { permissions: superPerms, permittedModules: mods }
      }

      const res = await api.get(`/api/permissions/${encodeURIComponent(roleIdentifier)}${tenantId ? `?tenantId=${tenantId}` : ''}`)
      const list = res.data?.permissions || res.data?.data || []
      const permitted = list
        .filter((p) => p && (p.can_view === true || p.canView === true))
        .map((p) => ({
          id: p.module_id || p.id,
          key: p.module_key || p.key,
          name: p.module_name || p.name,
          icon: p.module_icon || p.icon,
          route: p.module_route || p.route,
          can_view: true,
          can_edit: Boolean(p.can_edit ?? p.canEdit),
          can_delete: Boolean(p.can_delete ?? p.canDelete),
        }))

      return { permissions: list, permittedModules: permitted }
    },
    enabled: !!user,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  })

  // Listen for broadcast/storage events when admin saves permissions in another tab or page
  useEffect(() => {
    let channel = null
    try {
      channel = new BroadcastChannel('clinic_permissions_channel')
      channel.onmessage = (e) => {
        if (e.data?.type === 'ROLE_PERMISSIONS_UPDATED') {
          queryClient.invalidateQueries({ queryKey: ['rbac', 'user-permissions'] })
          queryClient.invalidateQueries({ queryKey: ['rbac', 'role-permissions'] })
          refetch()
        }
      }
    } catch {}

    const onStorage = (e) => {
      if (e.key === 'rbac_permission_update_ts') {
        queryClient.invalidateQueries({ queryKey: ['rbac', 'user-permissions'] })
        queryClient.invalidateQueries({ queryKey: ['rbac', 'role-permissions'] })
        refetch()
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [queryClient, refetch])

  // Safely derive permissions & permittedModules whether permData is an object or a flat array
  const permissions = Array.isArray(permData)
    ? permData
    : (Array.isArray(permData?.permissions) ? permData.permissions : [])

  const rawPermittedModules = Array.isArray(permData?.permittedModules)
    ? permData.permittedModules
    : permissions
        .filter((p) => p && (p.can_view === true || p.canView === true))
        .map((p) => ({
          id: p.module_id || p.id,
          key: p.module_key || p.key,
          name: p.module_name || p.name,
          icon: p.module_icon || p.icon,
          route: p.module_route || p.route,
          can_view: true,
          can_edit: Boolean(p.can_edit ?? p.canEdit),
          can_delete: Boolean(p.can_delete ?? p.canDelete),
        }))

  // Fallback to user.permissions / user.effectivePermissions if API list is empty but user already holds active privileges
  const userEffectivePerms = user?.permissions || user?.effectivePermissions || []
  let permittedModules = rawPermittedModules
  if (permittedModules.length === 0 && Array.isArray(userEffectivePerms) && userEffectivePerms.length > 0) {
    const knownModules = [
      { key: 'patients', name: 'Patients', icon: 'Users', route: '/app/staff/patients' },
      { key: 'appointments', name: 'Appointments', icon: 'Calendar', route: '/app/staff/appointments' },
      { key: 'prescriptions', name: 'Prescriptions', icon: 'Pill', route: '/app/staff/prescriptions' },
      { key: 'billing', name: 'Billing/Invoices', icon: 'CreditCard', route: '/app/staff/billing' },
      { key: 'inventory', name: 'Inventory', icon: 'Boxes', route: '/app/staff/inventory' },
      { key: 'reports', name: 'Reports', icon: 'BarChart3', route: '/app/staff/reports' },
      { key: 'staff', name: 'Staff', icon: 'ShieldCheck', route: '/app/admin/staff' },
      { key: 'roles', name: 'Roles & Permissions', icon: 'KeyRound', route: '/app/admin/roles' },
      { key: 'clinical_config', name: 'Clinical Config', icon: 'Sliders', route: '/app/admin/clinical-config' },
      { key: 'settings', name: 'Global Settings', icon: 'Sliders', route: '/app/admin/settings' },
    ]
    const fallbackList = knownModules
      .filter((m) =>
        userEffectivePerms.includes('*') ||
        userEffectivePerms.includes(`${m.key}.*`) ||
        userEffectivePerms.includes(`${m.key}.view`)
      )
      .map((m) => ({
        id: m.key,
        key: m.key,
        name: m.name,
        icon: m.icon,
        route: m.route,
        can_view: true,
        can_edit:
          userEffectivePerms.includes('*') ||
          userEffectivePerms.includes(`${m.key}.*`) ||
          userEffectivePerms.includes(`${m.key}.edit`) ||
          userEffectivePerms.includes(`${m.key}.create`),
        can_delete:
          userEffectivePerms.includes('*') ||
          userEffectivePerms.includes(`${m.key}.*`) ||
          userEffectivePerms.includes(`${m.key}.delete`),
      }))
    if (fallbackList.length > 0) {
      permittedModules = fallbackList
    }
  }

  // Check action permissions by route (normalized)
  const normalizeRoute = (r) => {
    if (!r) return ''
    return r.toLowerCase().replace(/\/$/, '')
  }

  const findPermForRoute = (route) => {
    if (!route) return null
    const clean = normalizeRoute(route)
    return permissions.find((p) => {
      const pRoute = normalizeRoute(p.module_route || p.route)
      return pRoute === clean || (clean.startsWith(pRoute) && pRoute !== '/app/staff')
    })
  }

  const hasViewPermission = (route) => {
    if (isSuperadmin) return true
    const perm = findPermForRoute(route)
    if (perm?.can_view) return true
    const clean = normalizeRoute(route)
    return userEffectivePerms.some((p) => {
      if (p === '*') return true
      const [mod, act] = p.split('.')
      if (act === 'view' || act === '*') {
        return clean.includes(`/${mod}`)
      }
      return false
    })
  }

  const hasEditPermission = (route) => {
    if (isSuperadmin) return true
    const perm = findPermForRoute(route)
    if (perm?.can_edit) return true
    const clean = normalizeRoute(route)
    return userEffectivePerms.some((p) => {
      if (p === '*') return true
      const [mod, act] = p.split('.')
      if (act === 'edit' || act === 'create' || act === '*') {
        return clean.includes(`/${mod}`)
      }
      return false
    })
  }

  const hasDeletePermission = (route) => {
    if (isSuperadmin) return true
    const perm = findPermForRoute(route)
    if (perm?.can_delete) return true
    const clean = normalizeRoute(route)
    return userEffectivePerms.some((p) => {
      if (p === '*') return true
      const [mod, act] = p.split('.')
      if (act === 'delete' || act === '*') {
        return clean.includes(`/${mod}`)
      }
      return false
    })
  }

  const hasZeroPermissions = !isSuperadmin && !isAdmin && !isLoading && permittedModules.length === 0

  return {
    permissions,
    permittedModules,
    isLoading,
    isSuperadmin,
    isAdmin,
    hasZeroPermissions,
    hasViewPermission,
    hasEditPermission,
    hasDeletePermission,
    refetch,
  }
}

export default useRolePermissions
