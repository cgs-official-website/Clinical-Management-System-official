import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { notify } from '../components/ui/Toast'
import { handleSimulatedRequest } from './devApiSimulator'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5001' : '')
const useMockApi = import.meta.env.VITE_ENABLE_DEV_MOCK_SERVER === 'true'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15001,
})

// Custom adapter for dev API simulator
if (useMockApi) {
  api.defaults.adapter = async (config) => {
    try {
      const [status, data] = await handleSimulatedRequest(config)
      const validateStatus = config.validateStatus || ((s) => s >= 200 && s < 300)
      if (validateStatus(status)) {
        return {
          data,
          status,
          statusText: status === 200 || status === 201 ? 'OK' : 'Success',
          headers: { 'content-type': 'application/json' },
          config,
          request: {},
        }
      }

      const message =
        data?.message || data?.error || `Request failed with status code ${status}`
      const error = new Error(message)
      error.name = 'AxiosError'
      error.config = config
      error.request = {}
      error.response = {
        data,
        status,
        statusText: status === 403 ? 'Forbidden' : status === 401 ? 'Unauthorized' : 'Error',
        headers: { 'content-type': 'application/json' },
        config,
        request: {},
      }
      error.isAxiosError = true
      error.status = status
      return Promise.reject(error)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

// Request Interceptor: Attach JWT token and user context
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const user = useAuthStore.getState().user
    if (user?.email) {
      config.headers['x-user-email'] = user.email
    }
    if (user?.role || user?.userType) {
      config.headers['x-user-role'] = user.role || user.userType
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Token refresh and global error handling
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Network error or backend offline: gracefully fallback to dev simulator only if explicitly enabled
    if (useMockApi && (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) && originalRequest && !originalRequest._isFallback) {
      originalRequest._isFallback = true
      try {
        const [simStatus, simData] = await handleSimulatedRequest(originalRequest)
        const validateStatus = originalRequest.validateStatus || ((s) => s >= 200 && s < 300)
        if (validateStatus(simStatus)) {
          return {
            data: simData,
            status: simStatus,
            statusText: 'OK (Dev Fallback)',
            headers: { 'content-type': 'application/json' },
            config: originalRequest,
            request: {},
          }
        }
      } catch (fallbackErr) {
        // Fallback failed, continue with original network error
      }
    }

    // 5xx Server Error notification
    if (error.response?.status >= 500) {
      notify.error(
        error.response?.data?.message || 'Server encountered an unexpected error. Please try again.',
        { title: 'Server Error' }
      )
      return Promise.reject(error)
    }

    // 401 Unauthorized handling & auto token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().setSessionExpired(true, window.location.pathname)
        isRefreshing = false
        return Promise.reject(error)
      }

      try {
        const user = useAuthStore.getState().user
        const isSuper = !!(
          user?.isSuperadmin ||
          user?.userType === 'SUPERADMIN' ||
          user?.role === 'SUPERADMIN' ||
          user?.email === 'admin@zuna.com'
        )
        const res = await api.post('/api/auth/refresh', {
          refreshToken,
          email: user?.email,
          userId: user?.id,
          isSuperadmin: isSuper,
        })
        const payload = res.data?.data || res.data
        const newToken = payload?.accessToken || payload?.token
        const newRefreshToken = payload?.refreshToken
        if (newToken) {
          useAuthStore.getState().setTokens(newToken, newRefreshToken)
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
        throw new Error('Invalid refresh response: no access token provided')
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        useAuthStore.getState().setSessionExpired(true, window.location.pathname)
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // 403 Forbidden handling: do NOT attempt token refresh (refresh tokens do not alter role permissions and causes infinite retry storms)
    if (error.response?.status === 403) {
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
