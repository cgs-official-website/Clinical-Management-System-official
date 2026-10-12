import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'
import { notify } from '../components/ui/Toast'

export const useAuth = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, token, setAuth, logout: storeLogout, sessionExpired } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/api/auth/login', credentials)
      return response.data
    },
    onSuccess: (data) => {
      // Unpack either direct payload or wrapped { data: { user, tokens } }
      const payload = data?.data || data
      const rawUser = payload.user || payload
      const accessToken = payload.tokens?.accessToken || payload.accessToken || payload.token
      const refreshToken = payload.tokens?.refreshToken || payload.refreshToken

      const resolvedRole = (rawUser.role || rawUser.userType || (rawUser.roles && rawUser.roles[0]) || 'STAFF').toUpperCase()
      const isSuperadminEmail = ['superadmin@clinic.io', 'superadmin@clinic.io', 'admin@zuna.com'].includes((rawUser.email || '').toLowerCase())
      const isSuperadmin =
        isSuperadminEmail ||
        resolvedRole === 'SUPERADMIN' ||
        rawUser.userType === 'SUPERADMIN' ||
        (rawUser.isSuperadmin === true && resolvedRole !== 'ADMIN' && rawUser.userType !== 'ADMIN')

      const isAdmin =
        isSuperadmin ||
        rawUser.isAdmin === true ||
        resolvedRole === 'ADMIN' ||
        rawUser.userType === 'ADMIN' ||
        (Array.isArray(rawUser.roles) && rawUser.roles.map(r => (typeof r === 'string' ? r : r.name || '').toUpperCase()).includes('ADMIN'))

      const normalizedUser = {
        ...rawUser,
        role: rawUser.role || resolvedRole,
        userType: rawUser.userType || resolvedRole,
        isSuperadmin,
        isAdmin,
        permissions: rawUser.permissions || rawUser.effectivePermissions || [],
      }

      setAuth(normalizedUser, accessToken, refreshToken)
      queryClient.clear()

      const roleDisplay = normalizedUser.roleTitle || normalizedUser.role || 'Clinical Personnel'
      notify.success(`Welcome back, ${normalizedUser.name || 'User'}!`, {
        title: `Authenticated as ${roleDisplay}`,
      })

      // Dynamic Role-Based Redirection from Single Login Portal
      if (isSuperadmin) {
        navigate('/app/superadmin/dashboard', { replace: true })
      } else if (isAdmin) {
        navigate('/app/admin/dashboard', { replace: true })
      } else {
        navigate('/app/staff/dashboard', { replace: true })
      }
    },
    onError: (error) => {
      notify.error(
        error.response?.data?.message || 'Invalid credentials. Please verify your email and password.',
        { title: 'Login Failed' }
      )
    },
  })

  const logout = () => {
    storeLogout()
    queryClient.clear()
    navigate('/login')
    notify.info('You have been signed out.', { title: 'Logged Out' })
  }

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    sessionExpired,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout,
  }
}

export default useAuth
