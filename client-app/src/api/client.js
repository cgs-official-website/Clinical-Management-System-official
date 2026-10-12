import axios from 'axios';
import { ENV } from '../config/env';
import { StorageService, STORAGE_KEYS } from '../services/storage';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach JWT Bearer Token and User Context
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await StorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const user = await StorageService.getParsedItem(STORAGE_KEYS.USER_PROFILE);
      if (user?.email) {
        config.headers['x-user-email'] = user.email;
      }
      if (user?.role || user?.userType) {
        config.headers['x-user-role'] = user.role || user.userType;
      }
    } catch {
      // Non-blocking
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token Refresh & Structured Errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await StorageService.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const user = await StorageService.getParsedItem(STORAGE_KEYS.USER_PROFILE);

      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${ENV.API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
          email: user?.email,
          userId: user?.id,
          isSuperadmin: !!user?.isSuperadmin,
        });

        const payload = res.data?.data || res.data;
        const newToken = payload?.accessToken || payload?.token;
        const newRefreshToken = payload?.refreshToken;

        if (newToken) {
          await StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          if (newRefreshToken) {
            await StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
        throw new Error('Refresh failed');
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await StorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await StorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
