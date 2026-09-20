import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'

export const PermissionGate = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isSuperadmin } =
    usePermissions()

  if (isSuperadmin) {
    return <>{children}</>
  }

  if (permission) {
    if (hasPermission(permission)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  if (permissions.length > 0) {
    const isAllowed = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (isAllowed) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default PermissionGate
