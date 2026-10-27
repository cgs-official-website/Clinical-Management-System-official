import { apiClient } from './client';

export const authApi = {
  /**
   * Real backend authentication
   * Sends email and password to POST /api/auth/login
   * Returns: { success: true, message: string, data: { user, tokens: { accessToken, refreshToken, expiresIn } } }
   */
  async login(email, password) {
    const res = await apiClient.post('/api/auth/login', {
      email: (email || '').trim(),
      password: (password || '').trim(),
    });
    return res.data;
  },

  /**
   * Real backend logout
   * Invalidates refresh token on POST /api/auth/logout
   */
  async logout(refreshToken) {
    try {
      if (refreshToken) {
        await apiClient.post('/api/auth/logout', { refreshToken });
      }
    } catch {
      // Local cleanup proceeds regardless of server offline state
    }
  },

  /**
   * Get current authenticated user profile
   * GET /api/auth/me
   */
  async getMe() {
    const res = await apiClient.get('/api/auth/me');
    return res.data?.data || res.data;
  },

  /**
   * Get dynamic effective permissions for logged-in user
   * GET /api/permissions/user/me
   */
  async getMyPermissions() {
    const res = await apiClient.get('/api/permissions/user/me');
    return res.data?.permissions || res.data?.data || [];
  },

  /**
   * Get role-specific permissions by role identifier
   * GET /api/permissions/:roleId
   */
  async getPermissionsByRole(roleId) {
    const res = await apiClient.get(`/api/permissions/${encodeURIComponent(roleId)}`);
    return res.data?.permissions || res.data?.data || [];
  },
};

export default authApi;
