import { apiClient } from './client';
import { DEMO_PRESETS } from '../constants/demoAccounts';

export const authApi = {
  async login(email, password) {
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      return res.data;
    } catch (error) {
      // Offline fallback: if network error, authenticate matching demo preset for seamless testing
      if (!error.response && DEMO_PRESETS.some((d) => d.email.toLowerCase() === (email || '').toLowerCase())) {
        const demo = DEMO_PRESETS.find((d) => d.email.toLowerCase() === (email || '').toLowerCase());
        const mockUser = {
          id: `usr-${demo.role.toLowerCase()}`,
          name: demo.label,
          email: demo.email,
          role: demo.role,
          roleTitle: demo.label,
          userType: demo.role,
          isSuperadmin: demo.role === 'SUPERADMIN',
          isAdmin: demo.role === 'ADMIN' || demo.role === 'SUPERADMIN',
          clinicName: 'Aura Health Memorial',
          permissions: ['*'],
        };
        return {
          success: true,
          data: {
            user: mockUser,
            tokens: {
              accessToken: `mock_jwt_${Date.now()}`,
              refreshToken: `mock_ref_${Date.now()}`,
            },
          },
        };
      }
      throw error;
    }
  },

  async logout(refreshToken) {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch {
      // Local cleanup occurs regardless
    }
  },

  async getMe() {
    try {
      const res = await apiClient.get('/api/auth/me');
      return res.data?.data || res.data;
    } catch (err) {
      return null;
    }
  },

  async getMyPermissions() {
    try {
      const res = await apiClient.get('/api/staff/me/permissions');
      return res.data?.data || res.data;
    } catch {
      return null;
    }
  },
};

export default authApi;
