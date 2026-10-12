import { create } from 'zustand'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('clinic_user')
    if (!raw) return null
    const user = JSON.parse(raw)
    const isExplicitSuperadminEmail = [
      'superadmin@clinic.io',
      'superadmin@clinic.io',
      'admin@zuna.com',
    ].includes((user.email || '').toLowerCase())

    const isClinicAdmin =
      (user.role === 'ADMIN' || user.userType === 'ADMIN') &&
      !isExplicitSuperadminEmail &&
      user.role !== 'SUPERADMIN' &&
      user.userType !== 'SUPERADMIN'

    if (isClinicAdmin && user.isSuperadmin) {
      user.isSuperadmin = false
    }

    // Clean up any stale outdated test bindings from previous local sessions
    if ((user.role || '').toLowerCase() === 'pharmacy & stock' || (user.roleTitle || '').toLowerCase() === 'pharmacy & stock') {
      const remainingRole = Array.isArray(user.roles)
        ? user.roles.find(r => (typeof r === 'string' ? r : r?.name || '').toLowerCase() !== 'pharmacy & stock')
        : null
      user.role = remainingRole || 'Senior Attending Physician'
      user.roleTitle = user.role
    }
    if (Array.isArray(user.roles)) {
      user.roles = user.roles.filter(r => (typeof r === 'string' ? r : r?.name || '').toLowerCase() !== 'pharmacy & stock')
    }

    localStorage.setItem('clinic_user', JSON.stringify(user))
    return user
  } catch {
    return null
  }
}

const getStoredToken = (currentUser) => {
  try {
    const token = localStorage.getItem('clinic_access_token')
    if (!token) return null
    if (!currentUser) return token

    const base64Url = token.split('.')[1]
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(jsonPayload)
      if (payload && payload.email && currentUser.email) {
        if (payload.email.toLowerCase() !== currentUser.email.toLowerCase()) {
          console.warn('[useAuthStore] Detected mismatched token. Discarding stale token.')
          localStorage.removeItem('clinic_access_token')
          return null
        }
      }
    }
    return token
  } catch {
    return localStorage.getItem('clinic_access_token') || null
  }
}

const initialUser = getStoredUser()

export const useAuthStore = create((set) => ({
  user: initialUser,
  token: getStoredToken(initialUser),
  refreshToken: localStorage.getItem('clinic_refresh_token') || null,
  sessionExpired: false,
  returnUrl: null,

  setAuth: (user, token, refreshToken = null) => {
    if (token) localStorage.setItem('clinic_access_token', token)
    if (refreshToken) localStorage.setItem('clinic_refresh_token', refreshToken)
    if (user) localStorage.setItem('clinic_user', JSON.stringify(user))
    set({ user, token, refreshToken, sessionExpired: false })
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('clinic_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('clinic_user')
    }
    set({ user })
  },

  setTokens: (token, refreshToken = null) => {
    if (!token && !refreshToken) return
    const update = {}
    if (token) {
      localStorage.setItem('clinic_access_token', token)
      update.token = token
    }
    if (refreshToken) {
      localStorage.setItem('clinic_refresh_token', refreshToken)
      update.refreshToken = refreshToken
    }
    set(update)
  },

  setSessionExpired: (expired, returnUrl = null) => {
    set({ sessionExpired: expired, returnUrl: returnUrl || null })
  },

  logout: () => {
    localStorage.removeItem('clinic_access_token')
    localStorage.removeItem('clinic_refresh_token')
    localStorage.removeItem('clinic_user')
    set({ user: null, token: null, refreshToken: null, sessionExpired: false, returnUrl: null })
  },
}))
