import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Mail, Shield, Power, RefreshCw, Key, Link as LinkIcon, Check, Info, Pencil, Lock } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { notify } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/useAuthStore'

export const StaffManagementPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const tenantId = user?.tenantId || user?.tenant?.id || user?.id
  const [copiedId, setCopiedId] = useState(null)
  const [editingStaff, setEditingStaff] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    specialty: '',
    selectedRoleId: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    specialty: '',
    selectedRoleId: '',
    roles: [],
  })

  // Fetch staff
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'staff', tenantId],
    queryFn: async () => {
      const res = await api.get('/api/admin/staff')
      return res.data
    },
    refetchOnMount: 'always',
    staleTime: 0,
  })

  // Fetch departments dynamically strictly filtered by current tenant's clinic_category
  const { data: deptData } = useQuery({
    queryKey: ['admin', 'departments', tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/departments${tenantId ? `?tenantId=${tenantId}` : ''}`)
      return res.data
    },
    enabled: !!tenantId,
  })
  const departments = deptData?.departments || deptData?.data || []

  // Fetch roles dynamically to reflect this tenant's own seeded and custom roles
  const { data: roleData } = useQuery({
    queryKey: ['admin', 'roles', tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/roles${tenantId ? `?tenantId=${tenantId}` : ''}`)
      return res.data
    },
    enabled: !!tenantId,
  })
  const roles = roleData?.roles || roleData?.data || []

  const filterRolesForDepartment = (roleList, departmentName) => {
    if (!departmentName) return roleList
    const dept = departmentName.toLowerCase().trim()
    return roleList.filter((r) => {
      const rName = (r.name || '').toLowerCase()
      if (rName.includes('admin') || rName.includes('administrator')) return true
      if (dept.includes('cardio') || dept.includes('cardiac')) {
        return !rName.includes('dent') && !rName.includes('physio')
      }
      if (dept.includes('dent') || dept.includes('oral') || dept.includes('orthodont')) {
        return rName.includes('dent') || rName.includes('hygienist') || rName.includes('reception') || rName.includes('biller') || rName.includes('billing')
      }
      if (dept.includes('physio') || dept.includes('rehab')) {
        return rName.includes('physio') || rName.includes('therap') || rName.includes('reception') || rName.includes('biller') || rName.includes('billing')
      }
      return true
    })
  }

  const filteredInviteRoles = React.useMemo(() => {
    return filterRolesForDepartment(roles, formData.department)
  }, [roles, formData.department])

  const filteredEditRoles = React.useMemo(() => {
    return filterRolesForDepartment(roles, editFormData.department)
  }, [roles, editFormData.department])

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roles }) => {
      const res = await api.put(`/api/admin/staff/${id}`, { roles })
      return res.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      notify.success(`Role assignment updated for ${updated.name}!`)
    },
    onError: () => notify.error('Failed to update staff role.'),
  })

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/api/admin/staff/${id}`, data)
      return res.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      setEditingStaff(null)
      notify.success(`Staff member ${updated.name || 'details'} updated successfully!`)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Failed to update staff member details.'
      notify.error(msg)
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/admin/staff', payload)
      return res.data
    },
    onSuccess: (newStaff) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      setIsInviteOpen(false)
      notify.success(`Invitation dispatched to ${newStaff.email}!`)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Failed to send staff invitation.'
      notify.error(msg)
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const nextStatus = status === 'active' ? 'inactive' : 'active'
      const res = await api.put(`/api/admin/staff/${id}`, { status: nextStatus })
      return res.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      notify.info(`Staff account is now ${updated.status}.`)
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (email) => {
      await api.post('/api/auth/forgot-password', { email })
    },
    onSuccess: () => {
      notify.success('Credentials invitation re-sent successfully!')
    },
  })

  // Staff Invite Link Handler
  const handleCopyInviteLink = async (staffMember) => {
    const assignedRoleIds = Array.isArray(staffMember.roles) ? staffMember.roles : [staffMember.roles].filter(Boolean)
    const matchedRole = roles.find(
      (r) =>
        assignedRoleIds.includes(r.id) ||
        assignedRoleIds.includes(r.name) ||
        r.name === staffMember.role
    )
    const roleTitle = matchedRole?.name || staffMember.role || staffMember.specialty || 'Clinical Staff Member'

    const invitePayload = {
      type: 'staff',
      staffId: staffMember.id,
      name: staffMember.name || staffMember.fullName || '',
      email: staffMember.email || '',
      role: roleTitle,
      department: staffMember.department || '',
      specialty: staffMember.specialty || '',
      clinicName: staffMember.clinicName || user?.clinicName || 'Clinic Practice',
      timestamp: Date.now(),
    }

    const token = btoa(unescape(encodeURIComponent(JSON.stringify(invitePayload))))
    const inviteUrl = `${window.location.origin}/register?invite=${token}`

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = inviteUrl
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      setCopiedId(staffMember.id)
      setTimeout(() => setCopiedId(null), 2500)

      notify.success(
        `Staff registration invite link copied for ${staffMember.name || staffMember.fullName}! Opening this link allows them to register with locked email & role and set their own password.`
      )
    } catch (err) {
      notify.error('Failed to copy invite link to clipboard.')
    }
  }

  // Handle opening the Edit Staff Modal
  const handleOpenEdit = (staffMember) => {
    const assignedRoleIds = Array.isArray(staffMember.roles) ? staffMember.roles : [staffMember.roles].filter(Boolean)
    const matchedRole = roles.find(
      (r) =>
        assignedRoleIds.includes(r.id) ||
        assignedRoleIds.includes(r.name) ||
        r.name === staffMember.role
    )

    setEditingStaff(staffMember)
    setEditFormData({
      name: staffMember.name || staffMember.fullName || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      department: staffMember.department || departments[0]?.name || '',
      specialty: staffMember.specialty || '',
      selectedRoleId: matchedRole?.id || roles[0]?.id || '',
    })
  }

  // Handle saving the staff edits
  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingStaff) return

    const matchedRole = roles.find((r) => r.id === editFormData.selectedRoleId)
    const roleName = matchedRole?.name || editingStaff.role

    updateStaffMutation.mutate({
      id: editingStaff.id,
      data: {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        department: editFormData.department,
        specialty: editFormData.specialty.trim(),
        roles: [editFormData.selectedRoleId],
        role: roleName,
      },
    })
  }

  const staff = (data?.staff || data?.data || []).filter((s) => {
    const email = (s.email || '').toLowerCase()
    return (
      !email.includes('doctor@clinic.io') &&
      !email.includes('reception@clinic.io') &&
      !email.includes('james.rodriguez@clinic.io') &&
      !email.includes('amara.chen@clinic.io') &&
      !email.includes('g.house@clinic.io')
    )
  })
  const filteredStaff = staff.filter(
    (s) =>
      (s.name || s.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.specialty || s.designation || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Staff Member',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatar} name={val || row.fullName || 'Staff'} size="sm" status={row.status === 'active' ? 'online' : 'offline'} />
          <div>
            <div className="font-bold text-xs text-text-primary">{val || row.fullName || 'Staff Member'}</div>
            <div className="text-[11px] text-text-secondary">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department & Specialty',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-xs text-text-primary">{val || 'General Clinic'}</div>
          <div className="text-[11px] text-text-secondary">{row.specialty || row.designation || 'Attending Staff'}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Assigned Role & Permissions',
      render: (_, row) => {
        const assignedRoleIds = Array.isArray(row.roles) ? row.roles : [row.roles].filter(Boolean)
        const matchedRoles = roles.filter(
          (r) =>
            assignedRoleIds.includes(r.id) ||
            assignedRoleIds.includes(r.name) ||
            r.name === row.role
        )
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {matchedRoles.length > 0 ? (
              matchedRoles.map((r) => (
                <Badge key={r.id} variant="primary" size="sm">
                  {r.name}
                </Badge>
              ))
            ) : row.roleNames && row.roleNames.length > 0 ? (
              row.roleNames.map((rn, idx) => (
                <Badge key={idx} variant="primary" size="sm">
                  {rn}
                </Badge>
              ))
            ) : (
              <Badge variant="neutral" size="sm">
                {row.designation || 'Attending Staff'}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'phone',
      label: 'Direct Contact',
      render: (val) => <span className="text-xs text-text-secondary">{val || 'N/A'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'neutral'} size="sm" dot>
          {val}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {/* 1. Send Mail button */}
          <button
            onClick={() => resendInviteMutation.mutate(row.email)}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
            title="Send Mail (Invite Instructions)"
            aria-label="Send Mail"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>

          {/* 2. Edit button (pencil icon) */}
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
            title="Edit Staff Member Details"
            aria-label="Edit Staff Member"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* 3. Deactivate button */}
          <button
            onClick={() => statusMutation.mutate({ id: row.id, status: row.status })}
            className={`p-1.5 rounded-lg border transition-colors ${
              row.status === 'active'
                ? 'border-border text-text-secondary hover:text-danger hover:border-danger/40 hover:bg-danger/10'
                : 'border-success/30 text-success hover:bg-success/10'
            }`}
            title={row.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
            aria-label={row.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* 4. Copy Link button */}
          <button
            onClick={() => handleCopyInviteLink(row)}
            className={`p-1.5 rounded-lg border transition-all ${
              copiedId === row.id
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500 shadow-sm'
                : 'border-border text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5'
            }`}
            title="Copy Invite Link (Pre-filled & Locked Email/Role, Self-Set Password)"
            aria-label="Copy Invite Link"
          >
            {copiedId === row.id ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-50 duration-200" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ]

  const handleOpenInvite = () => {
    const defaultDept = departments[0]?.name || ''
    const relevantRoles = filterRolesForDepartment(roles, defaultDept)
    const defaultRole = relevantRoles.find((r) => r.name.includes('Physician') || r.name.includes('Doctor') || r.name.includes('Cardiologist') || r.name.includes('Dentist') || r.name.includes('Physiotherapist')) || relevantRoles[0] || roles[0]
    const defaultRoleId = defaultRole?.id || ''
    const defaultSpecialty = defaultRole?.name || 'Attending Clinician'

    setFormData({
      name: '',
      email: '',
      phone: '',
      department: defaultDept,
      specialty: defaultSpecialty,
      selectedRoleId: defaultRoleId,
      roles: defaultRoleId ? [defaultRoleId] : [],
    })
    setIsInviteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Clinical Staff Directory & Onboarding
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Invite doctors, clinical nurses, receptionists, and adjust account access
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenInvite}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="w-full sm:w-auto shrink-0 shadow-sm"
        >
          Invite Staff Member
        </Button>
      </div>

      {/* Staff Invite & Registration Workflow Banner */}
      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-text-primary">
            Staff Invite & Registration Workflow:
          </span>
          <p className="text-text-secondary">
            The <strong>Copy Link</strong> button generates an invite link (<code className="font-mono text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border">/register?invite=...</code>). When the employee opens the link, their <strong>email and role are pre-filled and locked (non-editable)</strong>, their <strong>name is editable</strong>, and they must <strong>set their own password</strong> to complete registration and log in.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredStaff}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name, specialty, or email..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Invite Staff Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Clinical Staff"
        description="Dispatches a secure activation invite to the clinician's institutional email address."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const chosenRole = formData.selectedRoleId || roles[0]?.id
            inviteMutation.mutate({
              ...formData,
              roles: chosenRole ? [chosenRole] : [],
            })
          }}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            required
            placeholder="Dr. Marcus Vance"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Email"
              type="email"
              required
              placeholder="m.vance@aurahealth.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Contact Phone"
              required
              placeholder="+1 (555) 019-2834"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Clinical Department"
              value={formData.department}
              onChange={(e) => {
                const newDept = e.target.value
                const matchingRoles = filterRolesForDepartment(roles, newDept)
                const currentStillValid = matchingRoles.some((r) => r.id === formData.selectedRoleId)
                const fallbackRole = matchingRoles[0]?.id || roles[0]?.id || ''
                setFormData({
                  ...formData,
                  department: newDept,
                  selectedRoleId: currentStillValid ? formData.selectedRoleId : fallbackRole,
                  roles: [currentStillValid ? formData.selectedRoleId : fallbackRole].filter(Boolean),
                })
              }}
              options={
                departments.length > 0
                  ? (departments.some((d) => d.name === formData.department)
                      ? departments.map((d) => ({ value: d.name, label: d.name }))
                      : [{ value: formData.department, label: formData.department }, ...departments.map((d) => ({ value: d.name, label: d.name }))].filter((o) => Boolean(o.value)))
                  : [{ value: formData.department || 'General Clinic', label: formData.department || 'General Clinic' }]
              }
            />
            <Input
              label="Clinical Specialty"
              required
              placeholder="Attending Clinician"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Assigned Role (Live Permission Matrix)
            </label>
            <select
              value={formData.selectedRoleId || filteredInviteRoles[0]?.id || roles[0]?.id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  selectedRoleId: e.target.value,
                  roles: [e.target.value],
                })
              }
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary text-xs text-text-primary outline-none transition-all"
            >
              {filteredInviteRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.permissions?.length || 0} module privileges)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              Newly created roles sync here instantly. When this staff member signs in, their access is restricted exclusively to this role's modules.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={inviteMutation.isPending}
            >
              Send Onboarding Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        title="Edit Staff Member Profile"
        description="Update staff profile details, department, clinical specialty, and assigned permissions. Email is tied to login identity and remains locked."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Full Legal / Clinical Name"
            required
            placeholder="Dr. Marcus Vance"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Work Email Address
              </label>
              <Badge variant="neutral" size="sm" className="gap-1 text-[10px] py-0 px-2">
                <Lock className="w-2.5 h-2.5 text-text-muted" /> Locked: Login ID
              </Badge>
            </div>
            <div className="relative">
              <input
                type="email"
                value={editFormData.email}
                readOnly
                disabled
                className="w-full h-10 px-3 pr-9 rounded-xl bg-surface-muted/60 border border-border/80 text-xs text-text-secondary cursor-not-allowed select-none font-mono opacity-80"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <Lock className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Email stays locked because it is permanently tied to the staff member's login credentials.
            </p>
          </div>

          <Input
            label="Direct Contact Number"
            required
            placeholder="+1 (555) 019-2834"
            value={editFormData.phone}
            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={editFormData.department}
              onChange={(e) => {
                const newDept = e.target.value
                const matchingRoles = filterRolesForDepartment(roles, newDept)
                const currentStillValid = matchingRoles.some((r) => r.id === editFormData.selectedRoleId)
                const fallbackRole = matchingRoles[0]?.id || roles[0]?.id || ''
                setEditFormData({
                  ...editFormData,
                  department: newDept,
                  selectedRoleId: currentStillValid ? editFormData.selectedRoleId : fallbackRole,
                })
              }}
              options={
                departments.length > 0
                  ? (departments.some((d) => d.name === editFormData.department)
                      ? departments.map((d) => ({ value: d.name, label: d.name }))
                      : [{ value: editFormData.department, label: editFormData.department }, ...departments.map((d) => ({ value: d.name, label: d.name }))].filter((o) => Boolean(o.value)))
                  : [{ value: editFormData.department || 'General Clinic', label: editFormData.department || 'General Clinic' }]
              }
            />
            <Input
              label="Clinical Specialty"
              required
              placeholder="Attending Clinician"
              value={editFormData.specialty}
              onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Assigned Role & Permissions
            </label>
            <select
              value={editFormData.selectedRoleId || filteredEditRoles[0]?.id || roles[0]?.id || ''}
              onChange={(e) => setEditFormData({ ...editFormData, selectedRoleId: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border focus:border-primary text-xs text-text-primary outline-none transition-all"
            >
              {filteredEditRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.permissions?.length || 0} module privileges)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              Changes update this clinician's access privileges across all clinical and administrative modules.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setEditingStaff(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={updateStaffMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffManagementPage
