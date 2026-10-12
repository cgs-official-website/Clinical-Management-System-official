import { apiClient } from './client';

export const clinicalApi = {
  // PATIENTS
  async getPatients() {
    try {
      const res = await apiClient.get('/api/staff/patients');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'pat-1',
          name: 'Priya Sharma',
          mrn: 'MRN-2026-081',
          age: 32,
          gender: 'Female',
          phone: '+91 98450 12345',
          bloodGroup: 'B+',
          primaryDoctor: 'Dr. Sarah Al-Mansoor',
          lastVisit: 'Today, 09:30 AM',
          status: 'In Consultation',
          allergies: ['Penicillin', 'Sulfa'],
        },
        {
          id: 'pat-2',
          name: 'Rajesh Kumar',
          mrn: 'MRN-2026-042',
          age: 48,
          gender: 'Male',
          phone: '+91 97123 45678',
          bloodGroup: 'O+',
          primaryDoctor: 'Dr. Sarah Al-Mansoor',
          lastVisit: 'Today, 10:15 AM',
          status: 'Awaiting Vitals',
          allergies: ['None'],
        },
        {
          id: 'pat-3',
          name: 'Ananya Deshmukh',
          mrn: 'MRN-2026-119',
          age: 26,
          gender: 'Female',
          phone: '+91 98234 87654',
          bloodGroup: 'A+',
          primaryDoctor: 'Dr. Sarah Al-Mansoor',
          lastVisit: 'Yesterday',
          status: 'Completed',
          allergies: ['Aspirin'],
        },
      ];
    }
  },

  async createPatient(payload) {
    const res = await apiClient.post('/api/staff/patients', payload);
    return res.data?.data || res.data;
  },

  // APPOINTMENTS
  async getAppointments() {
    try {
      const res = await apiClient.get('/api/staff/appointments');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'apt-1',
          patientName: 'Priya Sharma',
          mrn: 'MRN-2026-081',
          doctorName: 'Dr. Sarah Al-Mansoor',
          time: '10:00 AM',
          date: 'Today',
          type: 'General Follow-up',
          room: 'Exam Room 3',
          status: 'In-Person',
        },
        {
          id: 'apt-2',
          patientName: 'Rajesh Kumar',
          mrn: 'MRN-2026-042',
          doctorName: 'Dr. Sarah Al-Mansoor',
          time: '11:30 AM',
          date: 'Today',
          type: 'Hypertension Review',
          room: 'Exam Room 1',
          status: 'Scheduled',
        },
        {
          id: 'apt-3',
          patientName: 'Aarav Patel',
          mrn: 'MRN-2026-094',
          doctorName: 'Dr. Evelyn Vance',
          time: '02:15 PM',
          date: 'Today',
          type: 'Dental Checkup',
          room: 'Dental Suite A',
          status: 'Scheduled',
        },
      ];
    }
  },

  async createAppointment(payload) {
    const res = await apiClient.post('/api/staff/appointments', payload);
    return res.data?.data || res.data;
  },

  async updateAppointment(id, payload) {
    const res = await apiClient.patch(`/api/staff/appointments/${id}`, payload);
    return res.data?.data || res.data;
  },

  // PATIENT FLOW / TRIAGE QUEUE
  async getTriageQueue() {
    try {
      const res = await apiClient.get('/api/staff/triage');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'trg-1',
          patientName: 'Priya Sharma',
          tokenNumber: 'A-01',
          stage: 'CONSULTATION',
          bp: '120/80',
          pulse: '72 bpm',
          temperature: '98.4 °F',
          spo2: '99%',
          nurseNotes: 'Patient complains of mild persistent migraine for 2 days.',
        },
        {
          id: 'trg-2',
          patientName: 'Rajesh Kumar',
          tokenNumber: 'A-02',
          stage: 'TRIAGE',
          bp: '142/92',
          pulse: '84 bpm',
          temperature: '98.6 °F',
          spo2: '97%',
          nurseNotes: 'Routine BP follow-up. Mild elevated systolic.',
        },
        {
          id: 'trg-3',
          patientName: 'Kavita Pillai',
          tokenNumber: 'A-03',
          stage: 'PHARMACY',
          bp: '118/76',
          pulse: '68 bpm',
          temperature: '98.1 °F',
          spo2: '100%',
          nurseNotes: 'Consultation completed. Awaiting prescription fulfillment.',
        },
      ];
    }
  },

  // PRESCRIPTIONS
  async getPrescriptions() {
    try {
      const res = await apiClient.get('/api/staff/prescriptions');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'rx-1',
          patientName: 'Priya Sharma',
          mrn: 'MRN-2026-081',
          doctorName: 'Dr. Sarah Al-Mansoor',
          diagnosis: 'Acute Tension Headache & Cervical Strain',
          date: '12 Oct 2026',
          status: 'Dispensed',
          medications: [
            { name: 'Paracetamol 650mg', dosage: '1 tab TDS', duration: '5 days', instructions: 'After meals' },
            { name: 'Pantoprazole 40mg', dosage: '1 tab OD', duration: '5 days', instructions: 'Before breakfast' },
          ],
        },
        {
          id: 'rx-2',
          patientName: 'Rajesh Kumar',
          mrn: 'MRN-2026-042',
          doctorName: 'Dr. Sarah Al-Mansoor',
          diagnosis: 'Essential Hypertension (Stage 1)',
          date: '12 Oct 2026',
          status: 'Pending Pharmacy',
          medications: [
            { name: 'Telmisartan 40mg', dosage: '1 tab OD', duration: '30 days', instructions: 'Morning' },
            { name: 'Amlodipine 5mg', dosage: '1 tab OD', duration: '30 days', instructions: 'Bedtime' },
          ],
        },
      ];
    }
  },

  async fulfillPrescription(id) {
    const res = await apiClient.patch(`/api/staff/prescriptions/${id}/fulfill`, {});
    return res.data?.data || res.data;
  },

  // BILLING & INVOICES (INR ₹)
  async getInvoices() {
    try {
      const res = await apiClient.get('/api/staff/invoices');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'inv-101',
          invoiceNumber: 'INV-2026-00101',
          patientName: 'Priya Sharma',
          date: '12 Oct 2026',
          totalAmount: 1850,
          status: 'PAID',
          paymentMethod: 'UPI / QR',
          items: [
            { description: 'Specialist Outpatient Consultation', amount: 800 },
            { description: 'Pharmacy Prescription Dispensing', amount: 1050 },
          ],
        },
        {
          id: 'inv-102',
          invoiceNumber: 'INV-2026-00102',
          patientName: 'Rajesh Kumar',
          date: '12 Oct 2026',
          totalAmount: 1200,
          status: 'PENDING',
          paymentMethod: 'Cash',
          items: [
            { description: 'General Practice Consultation', amount: 500 },
            { description: 'Automated 12-Lead ECG Analysis', amount: 700 },
          ],
        },
      ];
    }
  },

  async updateInvoiceStatus(id, status) {
    const res = await apiClient.patch(`/api/staff/invoices/${id}/status`, { status });
    return res.data?.data || res.data;
  },

  // INVENTORY
  async getInventory() {
    try {
      const res = await apiClient.get('/api/staff/inventory');
      return res.data?.data || res.data || [];
    } catch {
      return [
        {
          id: 'inv-item-1',
          name: 'Amoxicillin + Clavulanic Acid 625mg',
          sku: 'MED-AMX-625',
          category: 'Antibiotics',
          quantity: 240,
          unit: 'Strips',
          unitPrice: 185,
          schedule: 'Schedule H',
          minThreshold: 50,
          expiryDate: '11/2027',
        },
        {
          id: 'inv-item-2',
          name: 'Telmisartan 40mg',
          sku: 'MED-TEL-040',
          category: 'Cardiovascular',
          quantity: 35,
          unit: 'Strips',
          unitPrice: 95,
          schedule: 'Schedule H',
          minThreshold: 50,
          expiryDate: '08/2027',
        },
        {
          id: 'inv-item-3',
          name: 'Paracetamol 650mg (Dolo-650)',
          sku: 'MED-PCM-650',
          category: 'Analgesics',
          quantity: 520,
          unit: 'Strips',
          unitPrice: 32,
          schedule: 'OTC',
          minThreshold: 100,
          expiryDate: '03/2028',
        },
      ];
    }
  },

  // REPORTS & METRICS
  async getReports() {
    try {
      const res = await apiClient.get('/api/staff/reports');
      return res.data?.data || res.data;
    } catch {
      return {
        todayPatients: 28,
        activeConsultations: 4,
        pendingTriage: 3,
        totalRevenueToday: 38450,
        pendingPrescriptions: 5,
        lowStockAlerts: 2,
      };
    }
  },
};

export default clinicalApi;
