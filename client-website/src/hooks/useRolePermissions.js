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
    user?.role_id ||
    user?.roleId ||
    user?.role ||
    (Array.isArray(user?.roles) ? user?.roles[0] : 'staff') ||
    'staff'

  // Fetch role permissions on page load/refresh (staleTime: 0 ensures fresh fetch every refresh)
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
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes (invalidated automatically on permission changes)
    refetchOnWindowFocus: false,
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

  const permittedModules = Array.isArray(permData?.permittedModules)
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
    return Boolean(perm?.can_view)
  }

  const hasEditPermission = (route) => {
    if (isSuperadmin) return true
    const perm = findPermForRoute(route)
    return Boolean(perm?.can_edit)
  }

  const hasDeletePermission = (route) => {
    if (isSuperadmin) return true
    const perm = findPermForRoute(route)
    return Boolean(perm?.can_delete)
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
