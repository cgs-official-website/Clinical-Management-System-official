import { apiClient } from './client';

export const adminApi = {
  /* =========================================================================
   * SUPERADMIN: PLATFORM GOVERNANCE & TENANTS
   * ========================================================================= */

  /**
   * Get all clinic tenants
   * GET /api/superadmin/clinics
   */
  async getClinics() {
    const res = await apiClient.get('/api/superadmin/clinics');
    return res.data?.data || res.data?.clinics || [];
  },

  /**
   * Update clinic status (ACTIVE, SUSPENDED, DECOMMISSIONED, REJECTED)
   * PATCH /api/superadmin/clinics/:id/status
   */
  async updateClinicStatus(id, status, reason = '') {
    const res = await apiClient.patch(`/api/superadmin/clinics/${id}/status`, { status, reason });
    return res.data?.data || res.data;
  },

  /**
   * Get global platform KPIs & system metrics
   * GET /api/superadmin/kpis
   */
  async getPlatformKpis() {
    const res = await apiClient.get('/api/superadmin/kpis');
    return res.data?.data || res.data;
  },

  /**
   * Get clinic categories (Cardiology, Dental Care, Physiotherapy, etc.)
   * GET /api/superadmin/clinic-categories
   */
  async getClinicCategories() {
    const res = await apiClient.get('/api/superadmin/clinic-categories');
    return res.data?.data || [];
  },

  /**
   * Get all registered clinic admin accounts
   * GET /api/superadmin/admins
   */
  async getAdmins() {
    const res = await apiClient.get('/api/superadmin/admins');
    return res.data?.admins || res.data?.data || [];
  },

  /**
   * Get system health metrics
   * GET /api/superadmin/health
   */
  async getSystemHealth() {
    const res = await apiClient.get('/api/superadmin/health');
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * CLINIC ADMIN: STAFF, ROLES & CLINIC OPS
   * ========================================================================= */

  /**
   * Get clinic staff directory
   * GET /api/admin/staff
   */
  async getStaff() {
    const res = await apiClient.get('/api/admin/staff');
    return res.data?.data || res.data?.staff || [];
  },

  /**
   * Create staff member
   * POST /api/admin/staff
   */
  async createStaff(payload) {
    const res = await apiClient.post('/api/admin/staff', payload);
    return res.data?.data || res.data;
  },

  /**
   * Update staff member
   * PUT /api/admin/staff/:id
   */
  async updateStaff(id, payload) {
    const res = await apiClient.put(`/api/admin/staff/${id}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Delete staff member
   * DELETE /api/admin/staff/:id
   */
  async deleteStaff(id) {
    const res = await apiClient.delete(`/api/admin/staff/${id}`);
    return res.data?.data || res.data;
  },

  /**
   * Get clinic admin KPI stats
   * GET /api/admin/kpis
   */
  async getAdminKpis() {
    const res = await apiClient.get('/api/admin/kpis');
    return res.data?.data || res.data?.stats || res.data;
  },

  /**
   * Get clinic role definitions
   * GET /api/admin/roles
   */
  async getRoles() {
    const res = await apiClient.get('/api/admin/roles');
    return res.data?.roles || res.data?.data || [];
  },

  /**
   * Get clinic clinical configuration
   * GET /api/admin/clinical-config
   */
  async getClinicalConfig() {
    const res = await apiClient.get('/api/admin/clinical-config');
    return res.data?.data || res.data;
  },

  /**
   * Update clinical configuration
   * PUT /api/admin/clinical-config
   */
  async updateClinicalConfig(payload) {
    const res = await apiClient.put('/api/admin/clinical-config', payload);
    return res.data?.data || res.data;
  },
};

export default adminApi;
