import React from 'react'
import { ShieldCheck, Lock, CheckCircle2, User, KeyRound, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'

export const MyPermissionsPage = () => {
  const { user } = useAuth()
  const { permissions, role, isSuperadmin } = usePermissions()

  // Group permissions by module prefix (e.g. 'patients.view' -> module: 'patients', action: 'view')
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (perm === '*') {
      acc['*'] = ['All Privileges (Root Superadmin Wildcard)']
      return acc
    }
    const [module, action] = perm.split('.')
    if (!acc[module]) acc[module] = []
    acc[module].push(action || 'access')
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-extrabold text-2xl text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          My Entitlements & Role Privileges
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Role-based access transparency ledger detailing your granted operational actions
        </p>
      </div>

      {/* Clinician Identity Profile */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatar} name={user?.name} size="lg" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-text-primary">
                {user?.name}
              </h3>
              <Badge variant="primary" size="sm">
                {user?.role}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Email: <span className="font-medium text-text-primary">{user?.email}</span> • Tenant:{' '}
              <span className="font-medium text-text-primary">{user?.clinicName}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <Badge variant="success" size="md" dot>
            {permissions.length} Active Privileges Granted
          </Badge>
        </div>
      </div>

      {/* Grouped Permissions Matrix */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider">
          Granted Functional Modules & Actions
        </h3>

        {Object.keys(groupedPermissions).length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border bg-surface text-center text-xs text-text-secondary">
            No permissions have been granted to this user account. Contact your clinic administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(groupedPermissions).map(([moduleName, actions]) => (
              <div
                key={moduleName}
                className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <div className="font-heading font-bold text-sm text-text-primary capitalize flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-primary" />
                      {moduleName === '*' ? 'System Superadmin' : `${moduleName} Module`}
                    </div>
                    <Badge variant="neutral" size="sm">
                      {actions.length} Actions
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {actions.map((act) => (
                      <span
                        key={act}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-medium"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorized by Policy Matrix</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPermissionsPage
