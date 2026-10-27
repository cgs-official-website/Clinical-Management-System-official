import { apiClient } from './client';

export const clinicalApi = {
  /* =========================================================================
   * PATIENTS
   * ========================================================================= */

  /**
   * Get patients registry
   * GET /api/staff/patients
   */
  async getPatients(params = {}) {
    const res = await apiClient.get('/api/staff/patients', { params });
    const list = res.data?.data || res.data?.patients || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Get single patient record by ID
   * GET /api/staff/patients/:id
   */
  async getPatientById(id) {
    const res = await apiClient.get(`/api/staff/patients/${id}`);
    return res.data?.data || res.data;
  },

  /**
   * Register new patient
   * POST /api/staff/patients
   */
  async createPatient(payload) {
    const res = await apiClient.post('/api/staff/patients', payload);
    return res.data?.data || res.data;
  },

  /**
   * Update patient demographics or medical profile
   * PATCH /api/staff/patients/:id
   */
  async updatePatient(id, payload) {
    const res = await apiClient.patch(`/api/staff/patients/${id}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Delete patient record
   * DELETE /api/staff/patients/:id
   */
  async deletePatient(id) {
    const res = await apiClient.delete(`/api/staff/patients/${id}`);
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * APPOINTMENTS & CALENDAR
   * ========================================================================= */

  /**
   * Get scheduled clinical appointments
   * GET /api/staff/appointments
   */
  async getAppointments(params = {}) {
    const res = await apiClient.get('/api/staff/appointments', { params });
    const list = res.data?.data || res.data?.appointments || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Schedule new appointment
   * POST /api/staff/appointments
   */
  async createAppointment(payload) {
    const res = await apiClient.post('/api/staff/appointments', payload);
    return res.data?.data || res.data;
  },

  /**
   * Update appointment status or time
   * PATCH /api/staff/appointments/:id
   */
  async updateAppointment(id, payload) {
    const res = await apiClient.patch(`/api/staff/appointments/${id}`, payload);
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * PATIENT FLOW & TRIAGE QUEUE (RECEPTION -> TRIAGE -> DOCTOR -> PHARMACY)
   * ========================================================================= */

  /**
   * Get outpatient triage & flow token queue
   * GET /api/staff/triage
   */
  async getTriageQueue() {
    const res = await apiClient.get('/api/staff/triage');
    const list = res.data?.data || res.data?.triage || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Record vitals & advance patient in triage flow
   * POST /api/staff/triage
   */
  async recordTriage(payload) {
    const res = await apiClient.post('/api/staff/triage', payload);
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * PRESCRIPTIONS & PHARMACY FULFILLMENT
   * ========================================================================= */

  /**
   * Get active and dispensed prescriptions
   * GET /api/staff/prescriptions
   */
  async getPrescriptions(params = {}) {
    const res = await apiClient.get('/api/staff/prescriptions', { params });
    const list = res.data?.data || res.data?.prescriptions || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Create digital prescription
   * POST /api/staff/prescriptions
   */
  async createPrescription(payload) {
    const res = await apiClient.post('/api/staff/prescriptions', payload);
    return res.data?.data || res.data;
  },

  /**
   * Mark prescription as dispensed and decrement stock
   * PATCH /api/staff/prescriptions/:id/fulfill
   */
  async fulfillPrescription(id) {
    const res = await apiClient.patch(`/api/staff/prescriptions/${id}/fulfill`, {});
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * BILLING & INVOICES (INR ₹)
   * ========================================================================= */

  /**
   * Get invoices
   * GET /api/staff/invoices
   */
  async getInvoices(params = {}) {
    const res = await apiClient.get('/api/staff/invoices', { params });
    const list = res.data?.data || res.data?.invoices || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Create itemized invoice
   * POST /api/staff/invoices
   */
  async createInvoice(payload) {
    const res = await apiClient.post('/api/staff/invoices', payload);
    return res.data?.data || res.data;
  },

  /**
   * Update invoice payment status (PAID, PENDING, CANCELLED)
   * PATCH /api/staff/invoices/:id/status
   */
  async updateInvoiceStatus(id, status) {
    const res = await apiClient.patch(`/api/staff/invoices/${id}/status`, { status });
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * INVENTORY & PHARMACY STOCK
   * ========================================================================= */

  /**
   * Get medicine and supplies inventory
   * GET /api/staff/inventory
   */
  async getInventory(params = {}) {
    const res = await apiClient.get('/api/staff/inventory', { params });
    const list = res.data?.data || res.data?.inventory || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Add new stock SKU
   * POST /api/staff/inventory
   */
  async createInventoryItem(payload) {
    const res = await apiClient.post('/api/staff/inventory', payload);
    return res.data?.data || res.data;
  },

  /**
   * Update inventory stock levels
   * PATCH /api/staff/inventory/:id
   */
  async updateInventoryItem(id, payload) {
    const res = await apiClient.patch(`/api/staff/inventory/${id}`, payload);
    return res.data?.data || res.data;
  },

  /* =========================================================================
   * CLINICAL REPORTS & DAILY METRICS
   * ========================================================================= */

  /**
   * Get clinical analytics and summary stats
   * GET /api/staff/reports
   */
  async getReports() {
    const res = await apiClient.get('/api/staff/reports');
    return res.data?.data || res.data;
  },
};

export default clinicalApi;
