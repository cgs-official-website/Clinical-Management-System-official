import { useAuthStore } from '../store/useAuthStore'

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user)
  const permissions = user?.permissions || user?.effectivePermissions || []
  const role = (user?.role || user?.userType || 'ANONYMOUS').toUpperCase()

  const isExplicitSuperadminEmail = [
    'superadmin@clinic.io',
    'superadmin@clinic.io',
    'admin@zuna.com',
  ].includes((user?.email || '').toLowerCase())

  const isSuperadmin =
    isExplicitSuperadminEmail ||
    role === 'SUPERADMIN' ||
    user?.userType === 'SUPERADMIN' ||
    (user?.isSuperadmin === true && role !== 'ADMIN' && user?.userType !== 'ADMIN') ||
    (Array.isArray(user?.roles) &&
      user.roles.some((r) => (typeof r === 'string' ? r : r.name || '').toUpperCase() === 'SUPERADMIN'))

  const isAdmin =
    isSuperadmin ||
    user?.isAdmin === true ||
    role === 'ADMIN' ||
    user?.userType === 'ADMIN' ||
    (Array.isArray(user?.roles) &&
      user.roles.some((r) => {
        const rName = (typeof r === 'string' ? r : r.name || '').toUpperCase()
        return rName === 'ADMIN' || rName.includes('ADMINISTRATOR')
      })) ||
    permissions.includes('roles.view') ||
    permissions.includes('roles.*')

  /**
   * Check if user has a specific permission key (e.g. 'roles.view', 'patients.view')
   */
  const hasPermission = (permissionKey) => {
    if (isSuperadmin) return true
    if (!permissionKey) return true
    if (permissions.includes('*')) return true
    if (permissions.includes(permissionKey)) return true
    const [mod] = permissionKey.split('.')
    if (mod && permissions.includes(`${mod}.*`)) return true
    return false
  }

  /**
   * Check if user has at least one of the given permissions
   */
  const hasAnyPermission = (permissionKeys = []) => {
    if (isSuperadmin) return true
    if (!permissionKeys || permissionKeys.length === 0) return true
    return permissionKeys.some((pk) => hasPermission(pk))
  }

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = (permissionKeys = []) => {
    if (isSuperadmin) return true
    if (!permissionKeys || permissionKeys.length === 0) return true
    return permissionKeys.every((pk) => hasPermission(pk))
  }

  return {
    permissions,
    role,
    isSuperadmin,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}

export default usePermissions
