import React from 'react'
import { useLocation } from 'react-router-dom'
import { useRolePermissions } from '../../hooks/useRolePermissions'

/**
 * Conditionally render action buttons (e.g. Edit, Delete) based on RBAC permissions
 * Usage:
 *   <PermissionAction action="edit">
 *     <Button>Edit Patient</Button>
 *   </PermissionAction>
 */
export const PermissionAction = ({
  action = 'edit', // 'view' | 'edit' | 'delete'
  route,
  children,
  fallback = null,
}) => {
  const location = useLocation()
  const { hasViewPermission, hasEditPermission, hasDeletePermission, isSuperadmin } =
    useRolePermissions()

  if (isSuperadmin) return children

  const targetRoute = route || location.pathname

  let isAllowed = false
  if (action === 'view') {
    isAllowed = hasViewPermission(targetRoute)
  } else if (action === 'edit') {
    isAllowed = hasEditPermission(targetRoute)
  } else if (action === 'delete') {
    isAllowed = hasDeletePermission(targetRoute)
  }

  if (!isAllowed) return fallback
  return children
}

/**
 * Hook to inspect actions allowed for current or specified route
 */
export const useModuleActions = (explicitRoute) => {
  const location = useLocation()
  const route = explicitRoute || location.pathname
  const { hasViewPermission, hasEditPermission, hasDeletePermission, isSuperadmin } =
    useRolePermissions()

  if (isSuperadmin) {
    return { canView: true, canEdit: true, canDelete: true }
  }

  return {
    canView: hasViewPermission(route),
    canEdit: hasEditPermission(route),
    canDelete: hasDeletePermission(route),
  }
}

export default PermissionAction
