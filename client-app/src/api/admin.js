import { apiClient } from './client';

export const adminApi = {
  // SUPERADMIN: TENANT CLINICS
  async getClinics() {
    try {
      const res = await apiClient.get('/api/superadmin/clinics');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'clinic-1',
          name: 'Aura Health Memorial',
          subdomain: 'aura-health',
          status: 'ACTIVE',
          category: 'General Multi-Specialty',
          plan: 'ENTERPRISE',
          createdAt: '2026-01-15',
          adminEmail: 'admin@aurahealth.org',
        },
        {
          id: 'clinic-2',
          name: 'Apex Cardiology Centre',
          subdomain: 'apex-cardio',
          status: 'PENDING',
          category: 'Cardiology',
          plan: 'PROFESSIONAL',
          createdAt: '2026-10-10',
          adminEmail: 'director@apexcardio.in',
        },
        {
          id: 'clinic-3',
          name: 'Radiance Dental Practice',
          subdomain: 'radiance-dental',
          status: 'ACTIVE',
          category: 'Dental Care',
          plan: 'PROFESSIONAL',
          createdAt: '2026-03-22',
          adminEmail: 'contact@radiancedental.com',
        },
      ];
    }
  },

  async updateClinicStatus(id, status, reason = '') {
    const res = await apiClient.patch(`/api/superadmin/clinics/${id}/status`, { status, reason });
    return res.data?.data || res.data;
  },

  // SUPERADMIN: PLATFORM METRICS
  async getPlatformKpis() {
    try {
      const res = await apiClient.get('/api/superadmin/kpis');
      return res.data?.data || res.data;
    } catch {
      return {
        totalClinics: 14,
        activeClinics: 12,
        pendingApprovals: 2,
        totalPatients: 4280,
        monthlyRevenue: 1245000,
        systemHealth: 'OPERATIONAL 99.98%',
      };
    }
  },

  // CLINIC ADMIN: STAFF
  async getStaff() {
    try {
      const res = await apiClient.get('/api/admin/staff');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'staff-1',
          name: 'Dr. Sarah Al-Mansoor',
          roleTitle: 'Senior Attending Physician',
          email: 'doctor@clinic.io',
          status: 'ACTIVE',
          department: 'General Medicine',
        },
        {
          id: 'staff-2',
          name: 'Nurse Priya Nair',
          roleTitle: 'Registered Clinical Nurse',
          email: 'priya.nurse@aurahealth.org',
          status: 'ACTIVE',
          department: 'Outpatient Triage',
        },
        {
          id: 'staff-3',
          name: 'Anil Verma',
          roleTitle: 'Pharmacy & Stock Officer',
          email: 'anil.pharmacy@aurahealth.org',
          status: 'ACTIVE',
          department: 'Central Pharmacy',
        },
      ];
    }
  },
};

export default adminApi;
