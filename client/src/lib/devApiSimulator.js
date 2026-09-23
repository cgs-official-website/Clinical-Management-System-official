/**
 * Dev API Simulator
 * Intercepts Axios requests when VITE_ENABLE_DEV_MOCK_SERVER is enabled or backend is unreachable.
 * Implements 100% compliant REST contract specifications with realistic stateful persistence in localStorage.
 */

const STORAGE_KEY = 'clinic_simulated_db_inr_v1'

// Initial database seed
const getInitialDb = () => {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (!parsed.pendingRegistrations) {
        parsed.pendingRegistrations = [
          {
            id: 'reg-demo-1',
            clinicName: 'Zenith Cardiology & Vascular Institute',
            subdomain: 'zenith-cardio',
            adminName: 'Dr. Rajesh Nair',
            email: 'rajesh.nair@zenithcardio.com',
            phone: '+91 98450 12345',
            specialty: 'Interventional Cardiology',
            region: 'Asia / India (INR ₹)',
            plan: 'Enterprise',
            status: 'pending',
            submittedAt: '2026-09-09T10:15:00.000Z',
          },
          {
            id: 'reg-demo-2',
            clinicName: 'Pinnacle Pediatrics & Child Care',
            subdomain: 'pinnacle-peds',
            adminName: 'Dr. Ananya Roy',
            email: 'ananya@pinnaclepeds.org',
            phone: '+91 98230 67890',
            specialty: 'Pediatrics & Neonatology',
            region: 'Asia / India (INR ₹)',
            plan: 'Professional',
            status: 'pending',
            submittedAt: '2026-09-09T11:40:00.000Z',
          },
        ]
      }
      if (!parsed.approvedRegistrations) {
        parsed.approvedRegistrations = []
      }
      if (!parsed.triageQueue) {
        parsed.triageQueue = [
          {
            id: 'tr-101',
            tokenNumber: 'TK-101',
            patientId: 'pat-101',
            patientName: 'Eleanor Vance-Bishop',
            patientPhone: '+1 (555) 912-3401',
            patientGender: 'Female',
            patientAge: 46,
            weight: '68 kg',
            bp: '138/88 mmHg',
            sugarLevel: '108 mg/dL (Fasting)',
            currentMedications: 'Amlodipine 5mg OD, Multivitamin tabs',
            doctorName: 'Dr. Sarah Al-Mansoor',
            notes: 'Follow-up on mild morning headache and occasional palpitations',
            status: 'WAITING_FOR_DOCTOR',
            recordedAt: '2026-09-09T09:15:00.000Z',
            recordedBy: 'Elena Rostova (Front Desk)'
          },
          {
            id: 'tr-102',
            tokenNumber: 'TK-102',
            patientId: 'pat-102',
            patientName: 'Liam Alexander Reyes',
            patientPhone: '+1 (555) 834-2900',
            patientGender: 'Male',
            patientAge: 38,
            weight: '82 kg',
            bp: '124/80 mmHg',
            sugarLevel: '154 mg/dL (Random)',
            currentMedications: 'Metformin 1000mg BD, Alpha-Lipoic Acid 600mg',
            doctorName: 'Dr. Sarah Al-Mansoor',
            notes: 'Complains of tingling in fingertips after long work shifts',
            status: 'PRESCRIBED',
            recordedAt: '2026-09-09T09:40:00.000Z',
            recordedBy: 'Elena Rostova (Front Desk)'
          },
          {
            id: 'tr-103',
            tokenNumber: 'TK-103',
            patientId: 'pat-103',
            patientName: 'Sophia Maria Gonzalez',
            patientPhone: '+1 (555) 745-1192',
            patientGender: 'Female',
            patientAge: 29,
            weight: '59 kg',
            bp: '118/76 mmHg',
            sugarLevel: '92 mg/dL (Fasting)',
            currentMedications: 'None currently',
            doctorName: 'Dr. Sarah Al-Mansoor',
            notes: 'Routine health check-up before marathon training',
            status: 'WAITING_FOR_DOCTOR',
            recordedAt: '2026-09-09T10:05:00.000Z',
            recordedBy: 'Elena Rostova (Front Desk)'
          }
        ]
      }
      return parsed
    } catch (e) {
      console.warn('Failed to parse saved DB, reinitializing...')
    }
  }

  const initial = {
    pendingRegistrations: [
      {
        id: 'reg-demo-1',
        clinicName: 'Zenith Cardiology & Vascular Institute',
        subdomain: 'zenith-cardio',
        adminName: 'Dr. Rajesh Nair',
        email: 'rajesh.nair@zenithcardio.com',
        phone: '+91 98450 12345',
        specialty: 'Interventional Cardiology',
        region: 'Asia / India (INR ₹)',
        plan: 'Enterprise',
        status: 'pending',
        submittedAt: '2026-09-09T10:15:00.000Z',
      },
      {
        id: 'reg-demo-2',
        clinicName: 'Pinnacle Pediatrics & Child Care',
        subdomain: 'pinnacle-peds',
        adminName: 'Dr. Ananya Roy',
        email: 'ananya@pinnaclepeds.org',
        phone: '+91 98230 67890',
        specialty: 'Pediatrics & Neonatology',
        region: 'Asia / India (INR ₹)',
        plan: 'Professional',
        status: 'pending',
        submittedAt: '2026-09-09T11:40:00.000Z',
      },
    ],
    approvedRegistrations: [],
    clinics: [
      {
        id: 'clinic-1',
        name: 'Aura Health Memorial',
        slug: 'aura-health',
        plan: 'Enterprise',
        status: 'active',
        staffCount: 42,
        patientsCount: 12450,
        createdAt: '2025-01-15',
        region: 'North America (East)',
        contactEmail: 'admin@aurahealth.org',
        domain: 'aura.clinic.io',
      },
      {
        id: 'clinic-2',
        name: 'Apex Orthopedic & Neuro Institute',
        slug: 'apex-ortho',
        plan: 'Professional',
        status: 'active',
        staffCount: 28,
        patientsCount: 6820,
        createdAt: '2025-03-22',
        region: 'North America (West)',
        contactEmail: 'operations@apexneuro.com',
        domain: 'apex.clinic.io',
      },
      {
        id: 'clinic-3',
        name: 'St. Jude Pediatric Specialists',
        slug: 'st-jude-peds',
        plan: 'Enterprise',
        status: 'active',
        staffCount: 64,
        patientsCount: 19800,
        createdAt: '2024-11-10',
        region: 'Europe (Central)',
        contactEmail: 'director@stjudepeds.eu',
        domain: 'stjude.clinic.io',
      },
      {
        id: 'clinic-4',
        name: 'Beacon Urgent Care Network',
        slug: 'beacon-urgent',
        plan: 'Starter',
        status: 'suspended',
        staffCount: 12,
        patientsCount: 3100,
        createdAt: '2025-06-05',
        region: 'North America (Central)',
        contactEmail: 'desk@beaconurgent.com',
        domain: 'beacon.clinic.io',
      },
    ],
    admins: [
      {
        id: 'admin-1',
        name: 'Dr. Evelyn Vance',
        email: 'evelyn.vance@aurahealth.org',
        clinicId: 'clinic-1',
        clinicName: 'Aura Health Memorial',
        role: 'ADMIN',
        status: 'active',
        twoFactorEnabled: true,
        lastLogin: '2026-09-08 19:42',
      },
      {
        id: 'admin-2',
        name: 'Marcus Sterling',
        email: 'marcus@apexneuro.com',
        clinicId: 'clinic-2',
        clinicName: 'Apex Orthopedic & Neuro Institute',
        role: 'ADMIN',
        status: 'active',
        twoFactorEnabled: false,
        lastLogin: '2026-09-07 11:20',
      },
      {
        id: 'admin-3',
        name: 'Dr. Hannah Schmidt',
        email: 'hannah@stjudepeds.eu',
        clinicId: 'clinic-3',
        clinicName: 'St. Jude Pediatric Specialists',
        role: 'ADMIN',
        status: 'active',
        twoFactorEnabled: true,
        lastLogin: '2026-09-08 14:15',
      },
    ],
    permissionModules: [
      { id: 'patients', name: 'Patients', description: 'Patient records, charts, demographics and medical history' },
      { id: 'appointments', name: 'Appointments', description: 'Clinical scheduling, calendar grids and bookings' },
      { id: 'prescriptions', name: 'Prescriptions & Notes', description: 'Clinical encounter notes and drug prescriptions' },
      { id: 'billing', name: 'Billing & Invoices', description: 'Financial ledger, insurance claims and patient invoices' },
      { id: 'inventory', name: 'Pharmacy & Stock', description: 'Medication supplies, medical consumables and reorder thresholds' },
      { id: 'staff', name: 'Staff Management', description: 'Clinical staff profiles, credentials and duty rosters' },
      { id: 'roles', name: 'Roles & Permissions', description: 'Granular security privileges and access matrix' },
      { id: 'reports', name: 'Analytics & Reports', description: 'Clinical performance, KPI trends and export tools' },
      { id: 'clinical_config', name: 'Clinical Config', description: 'Departments, specialties, operating slots and doctor hours' },
    ],
    roles: [
      {
        id: 'role-admin',
        name: 'Clinical Administrator',
        description: 'Complete clinic administrative and operational control',
        staffCount: 3,
        createdAt: '2025-01-16',
        permissions: [
          'patients.view', 'patients.create', 'patients.edit', 'patients.delete', 'patients.export',
          'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.export', 'appointments.approve',
          'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.delete', 'prescriptions.export',
          'billing.view', 'billing.create', 'billing.edit', 'billing.delete', 'billing.export',
          'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.export',
          'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.export',
          'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
          'reports.view', 'reports.export',
          'clinical_config.view', 'clinical_config.edit',
        ],
      },
      {
        id: 'role-doctor',
        name: 'Senior Attending Physician',
        description: 'Direct care provider with diagnosis, prescription and appointment controls',
        staffCount: 14,
        createdAt: '2025-01-18',
        permissions: [
          'patients.view', 'patients.edit', 'patients.export',
          'appointments.view', 'appointments.create', 'appointments.edit',
          'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.export',
          'inventory.view',
          'reports.view',
        ],
      },
      {
        id: 'role-receptionist',
        name: 'Front Desk & Receptionist',
        description: 'Patient check-in, registration, scheduling and initial intake billing',
        staffCount: 8,
        createdAt: '2025-01-20',
        permissions: [
          'patients.view', 'patients.create', 'patients.edit',
          'appointments.view', 'appointments.create', 'appointments.edit',
          'billing.view', 'billing.create',
        ],
      },
      {
        id: 'role-nurse',
        name: 'Registered Clinical Nurse',
        description: 'Patient vitals recording, triage, medication administration and chart viewing',
        staffCount: 12,
        createdAt: '2025-01-22',
        permissions: [
          'patients.view', 'patients.edit',
          'appointments.view',
          'prescriptions.view',
          'inventory.view',
        ],
      },
      {
        id: 'role-biller',
        name: 'Billing & Insurance Officer',
        description: 'Invoicing, claim adjudications, payment collections and financial reports',
        staffCount: 5,
        createdAt: '2025-02-01',
        permissions: [
          'patients.view',
          'billing.view', 'billing.create', 'billing.edit', 'billing.export',
          'reports.view', 'reports.export',
        ],
      },
    ],
    staff: [],
    patients: [
      {
        id: 'pat-101',
        mrn: 'MRN-84920',
        fullName: 'Eleanor Vance-Bishop',
        dob: '1984-06-14',
        age: 41,
        gender: 'Female',
        bloodGroup: 'A+',
        phone: '+1 (555) 912-3401',
        email: 'eleanor.vb@gmail.com',
        address: '482 Maplecrest Blvd, Suite 4A',
        primaryDoctor: 'Dr. Sarah Al-Mansoor',
        allergies: ['Penicillin', 'Sulfa Drugs'],
        chronicConditions: ['Hypertension', 'Mild Asthma'],
        lastVisit: '2026-09-02',
        status: 'Active',
      },
      {
        id: 'pat-102',
        mrn: 'MRN-84921',
        fullName: 'Liam Alexander Reyes',
        dob: '1992-11-28',
        age: 33,
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '+1 (555) 834-2900',
        email: 'liam.reyes@techmail.com',
        address: '109 Pine Ridge Terrace',
        primaryDoctor: 'Dr. Gregory House',
        allergies: ['No Known Drug Allergies (NKDA)'],
        chronicConditions: ['Type 2 Diabetes'],
        lastVisit: '2026-08-28',
        status: 'Active',
      },
      {
        id: 'pat-103',
        mrn: 'MRN-84922',
        fullName: 'Sophia Maria Gonzalez',
        dob: '2001-03-09',
        age: 25,
        gender: 'Female',
        bloodGroup: 'B-',
        phone: '+1 (555) 745-1192',
        email: 'sophia.gonzalez@univ.edu',
        address: '77 West Horizon St',
        primaryDoctor: 'Dr. Sarah Al-Mansoor',
        allergies: ['Latex'],
        chronicConditions: ['None'],
        lastVisit: '2026-09-06',
        status: 'Active',
      },
      {
        id: 'pat-104',
        mrn: 'MRN-84923',
        fullName: 'Arthur Pendelton III',
        dob: '1958-09-19',
        age: 67,
        gender: 'Male',
        bloodGroup: 'AB+',
        phone: '+1 (555) 623-8819',
        email: 'pendelton.arthur@heritage.org',
        address: '1240 Oakridge Lane',
        primaryDoctor: 'Dr. Gregory House',
        allergies: ['Aspirin', 'Iodine Contrast'],
        chronicConditions: ['Coronary Artery Disease', 'Osteoarthritis'],
        lastVisit: '2026-08-15',
        status: 'Active',
      },
      {
        id: 'pat-105',
        mrn: 'MRN-84924',
        fullName: 'Nadia Yasmin Patel',
        dob: '1996-07-22',
        age: 29,
        gender: 'Female',
        bloodGroup: 'O-',
        phone: '+1 (555) 431-7720',
        email: 'nadiapatel@designstudio.io',
        address: '320 Highland Avenue',
        primaryDoctor: 'Dr. Sarah Al-Mansoor',
        allergies: ['NKDA'],
        chronicConditions: ['None'],
        lastVisit: '2026-09-07',
        status: 'Active',
      },
    ],
    appointments: [
      {
        id: 'apt-501',
        patientId: 'pat-101',
        patientName: 'Eleanor Vance-Bishop',
        patientPhone: '+1 (555) 912-3401',
        doctorName: 'Dr. Sarah Al-Mansoor',
        department: 'Cardiology',
        dateTime: '2026-09-09T09:30:00',
        durationMinutes: 30,
        type: 'In-Person Consultation',
        reason: 'Quarterly cardiac stress test evaluation & blood pressure check',
        status: 'Scheduled',
        room: 'Exam Room 3B',
      },
      {
        id: 'apt-502',
        patientId: 'pat-102',
        patientName: 'Liam Alexander Reyes',
        patientPhone: '+1 (555) 834-2900',
        doctorName: 'Dr. Gregory House',
        department: 'Diagnostic Medicine',
        dateTime: '2026-09-09T10:15:00',
        durationMinutes: 45,
        type: 'Diagnostic Follow-up',
        reason: 'Recurrent neurological numbness in left extremities',
        status: 'In-Progress',
        room: 'Consult Suite A',
      },
      {
        id: 'apt-503',
        patientId: 'pat-103',
        patientName: 'Sophia Maria Gonzalez',
        patientPhone: '+1 (555) 745-1192',
        doctorName: 'Dr. Sarah Al-Mansoor',
        department: 'Cardiology',
        dateTime: '2026-09-09T11:30:00',
        durationMinutes: 20,
        type: 'Telehealth',
        reason: 'Holter monitor result review',
        status: 'Scheduled',
        room: 'Virtual Room 2',
      },
      {
        id: 'apt-504',
        patientId: 'pat-104',
        patientName: 'Arthur Pendelton III',
        patientPhone: '+1 (555) 623-8819',
        doctorName: 'Dr. Gregory House',
        department: 'Diagnostic Medicine',
        dateTime: '2026-09-09T14:00:00',
        durationMinutes: 30,
        type: 'In-Person Consultation',
        reason: 'Annual comprehensive geriatric review',
        status: 'Confirmed',
        room: 'Exam Room 1A',
      },
      {
        id: 'apt-505',
        patientId: 'pat-105',
        patientName: 'Nadia Yasmin Patel',
        patientPhone: '+1 (555) 431-7720',
        doctorName: 'Dr. Sarah Al-Mansoor',
        department: 'Cardiology',
        dateTime: '2026-09-09T15:15:00',
        durationMinutes: 30,
        type: 'Initial Consultation',
        reason: 'Palpitations after intense cardio exercises',
        status: 'Scheduled',
        room: 'Exam Room 3B',
      },
    ],
    triageQueue: [
      {
        id: 'tr-101',
        tokenNumber: 'TK-101',
        patientId: 'pat-101',
        patientName: 'Eleanor Vance-Bishop',
        patientPhone: '+1 (555) 912-3401',
        patientGender: 'Female',
        patientAge: 46,
        weight: '68 kg',
        bp: '138/88 mmHg',
        sugarLevel: '108 mg/dL (Fasting)',
        currentMedications: 'Amlodipine 5mg OD, Multivitamin tabs',
        doctorName: 'Dr. Sarah Al-Mansoor',
        notes: 'Follow-up on mild morning headache and occasional palpitations',
        status: 'WAITING_FOR_DOCTOR',
        recordedAt: '2026-09-09T09:15:00.000Z',
        recordedBy: 'Elena Rostova (Front Desk)'
      },
      {
        id: 'tr-102',
        tokenNumber: 'TK-102',
        patientId: 'pat-102',
        patientName: 'Liam Alexander Reyes',
        patientPhone: '+1 (555) 834-2900',
        patientGender: 'Male',
        patientAge: 38,
        weight: '82 kg',
        bp: '124/80 mmHg',
        sugarLevel: '154 mg/dL (Random)',
        currentMedications: 'Metformin 1000mg BD, Alpha-Lipoic Acid 600mg',
        doctorName: 'Dr. Sarah Al-Mansoor',
        notes: 'Complains of tingling in fingertips after long work shifts',
        status: 'PRESCRIBED',
        recordedAt: '2026-09-09T09:40:00.000Z',
        recordedBy: 'Elena Rostova (Front Desk)'
      },
      {
        id: 'tr-103',
        tokenNumber: 'TK-103',
        patientId: 'pat-103',
        patientName: 'Sophia Maria Gonzalez',
        patientPhone: '+1 (555) 745-1192',
        patientGender: 'Female',
        patientAge: 29,
        weight: '59 kg',
        bp: '118/76 mmHg',
        sugarLevel: '92 mg/dL (Fasting)',
        currentMedications: 'None currently',
        doctorName: 'Dr. Sarah Al-Mansoor',
        notes: 'Routine health check-up before marathon training',
        status: 'WAITING_FOR_DOCTOR',
        recordedAt: '2026-09-09T10:05:00.000Z',
        recordedBy: 'Elena Rostova (Front Desk)'
      }
    ],
    prescriptions: [
      {
        id: 'rx-701',
        tokenNumber: 'TK-101',
        patientId: 'pat-101',
        patientName: 'Eleanor Vance-Bishop',
        doctorName: 'Dr. Sarah Al-Mansoor',
        date: '2026-09-02',
        diagnosis: 'Stage 1 Essential Hypertension (ICD-10 I10)',
        medications: [
          { drug: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily in the morning', duration: '90 days', refills: 3 },
          { drug: 'Hydrochlorothiazide', dosage: '12.5mg', frequency: 'Once daily with food', duration: '90 days', refills: 3 },
        ],
        notes: '[Token: TK-101] Advised daily low-sodium diet and twice-daily BP log. Return in 3 months.',
        status: 'Fulfilled',
      },
      {
        id: 'rx-702',
        tokenNumber: 'TK-102',
        patientId: 'pat-102',
        patientName: 'Liam Alexander Reyes',
        doctorName: 'Dr. Sarah Al-Mansoor',
        date: '2026-09-09',
        diagnosis: 'Type 2 Diabetes Mellitus with Neuropathy risk (ICD-10 E11.40)',
        medications: [
          { drug: 'Metformin HCl ER', dosage: '1000mg', frequency: 'Twice daily with evening meal', duration: '60 days', refills: 2 },
          { drug: 'Alpha-Lipoic Acid', dosage: '600mg', frequency: 'Once daily before breakfast', duration: '60 days', refills: 1 },
        ],
        notes: '[Token: TK-102] Patient undergoing fasting blood glucose panels and peripheral reflex testing.',
        status: 'Pending Dispense',
      },
    ],
    invoices: [
      {
        id: 'inv-8801',
        invoiceNumber: 'INV-2026-0081',
        patientId: 'pat-101',
        patientName: 'Eleanor Vance-Bishop',
        date: '2026-09-02',
        dueDate: '2026-10-02',
        amount: 3500.00,
        insuranceCoverage: 2800.00,
        patientResponsibility: 700.00,
        status: 'Paid',
        paymentMethod: 'UPI / Net Banking',
        items: [
          { description: 'Comprehensive Cardiology Specialist Consultation', code: 'CPT-99214', fee: 2500.00 },
          { description: '12-Lead Electrocardiogram (ECG) with interpretation', code: 'CPT-93000', fee: 1000.00 },
        ],
      },
      {
        id: 'inv-8802',
        invoiceNumber: 'INV-2026-0082',
        patientId: 'pat-102',
        patientName: 'Liam Alexander Reyes',
        date: '2026-08-28',
        dueDate: '2026-09-28',
        amount: 5200.00,
        insuranceCoverage: 4160.00,
        patientResponsibility: 1040.00,
        status: 'Pending',
        paymentMethod: 'Insurance Claim Submitted',
        items: [
          { description: 'Specialist Diagnostic Consultation', code: 'CPT-99204', fee: 3200.00 },
          { description: 'Comprehensive Metabolic Panel (CMP)', code: 'CPT-80053', fee: 2000.00 },
        ],
      },
      {
        id: 'inv-8803',
        invoiceNumber: 'INV-2026-0083',
        patientId: 'pat-104',
        patientName: 'Arthur Pendelton III',
        date: '2026-08-15',
        dueDate: '2026-09-15',
        amount: 1900.00,
        insuranceCoverage: 1900.00,
        patientResponsibility: 0.00,
        status: 'Paid',
        paymentMethod: 'Mediclaim Cashless',
        items: [
          { description: 'Routine Chronic Care Management Assessment', code: 'CPT-99490', fee: 1900.00 },
        ],
      },
    ],
    inventory: [
      {
        id: 'inv-item-1',
        itemCode: 'MED-AMLO-5',
        name: 'Amlodipine Besylate 5mg Tablets',
        category: 'Cardiovascular',
        stockQuantity: 840,
        unit: 'Tablets',
        minReorderThreshold: 200,
        batchNumber: 'BCH-2026-042',
        expiryDate: '2027-11-30',
        unitCost: 0.18,
        sellingPrice: 0.85,
        status: 'Optimal',
      },
      {
        id: 'inv-item-2',
        itemCode: 'MED-MET-1000',
        name: 'Metformin Extended-Release 1000mg',
        category: 'Endocrinology',
        stockQuantity: 140,
        unit: 'Tablets',
        minReorderThreshold: 250,
        batchNumber: 'BCH-2025-911',
        expiryDate: '2027-04-15',
        unitCost: 0.22,
        sellingPrice: 1.10,
        status: 'Low Stock',
      },
      {
        id: 'inv-item-3',
        itemCode: 'SURG-GLV-M',
        name: 'Sterile Nitrile Surgical Gloves (Size M)',
        category: 'Medical Consumables',
        stockQuantity: 2400,
        unit: 'Pairs',
        minReorderThreshold: 500,
        batchNumber: 'GLV-9942',
        expiryDate: '2028-12-31',
        unitCost: 0.45,
        sellingPrice: 1.20,
        status: 'Optimal',
      },
      {
        id: 'inv-item-4',
        itemCode: 'DIAG-IV-1000',
        name: '0.9% Sodium Chloride Normal Saline 1000ml',
        category: 'IV Fluids',
        stockQuantity: 65,
        unit: 'Bags',
        minReorderThreshold: 100,
        batchNumber: 'IV-8831',
        expiryDate: '2026-10-31',
        unitCost: 2.10,
        sellingPrice: 8.50,
        status: 'Critical Low',
      },
      {
        id: 'inv-item-5',
        itemCode: 'VAC-FLUZ-26',
        name: 'Quadrivalent Influenza Vaccine 0.5ml Syringe',
        category: 'Vaccines',
        stockQuantity: 420,
        unit: 'Doses',
        minReorderThreshold: 150,
        batchNumber: 'FL-2026-X',
        expiryDate: '2027-06-30',
        unitCost: 14.50,
        sellingPrice: 35.00,
        status: 'Optimal',
      },
    ],
    auditLogs: [
      {
        id: 'audit-901',
        timestamp: '2026-09-08 20:41:12',
        actorEmail: 'admin@aurahealth.org',
        actorRole: 'ADMIN',
        action: 'UPDATE_ROLE_PERMISSIONS',
        module: 'roles',
        details: 'Added "prescriptions.export" privilege to Senior Attending Physician role',
        ipAddress: '192.168.1.104',
        clinicName: 'Aura Health Memorial',
      },
      {
        id: 'audit-902',
        timestamp: '2026-09-08 19:14:05',
        actorEmail: 'superadmin@clinic.io',
        actorRole: 'SUPERADMIN',
        action: 'PROVISION_CLINIC',
        module: 'clinics',
        details: 'Provisioned new clinic tenant: St. Jude Pediatric Specialists (Enterprise tier)',
        ipAddress: '10.0.4.12',
        clinicName: 'System-Wide',
      },
      {
        id: 'audit-903',
        timestamp: '2026-09-08 18:22:40',
        actorEmail: 'admin@aurahealth.org',
        actorRole: 'ADMIN',
        action: 'ASSIGN_STAFF_ROLE',
        module: 'staff',
        details: 'Assigned "Front Desk & Receptionist" role to Elena Rostova',
        ipAddress: '192.168.1.104',
        clinicName: 'Aura Health Memorial',
      },
      {
        id: 'audit-904',
        timestamp: '2026-09-08 16:05:19',
        actorEmail: 'doctor@clinic.io',
        actorRole: 'STAFF',
        action: 'CREATE_PRESCRIPTION',
        module: 'prescriptions',
        details: 'Created prescription Rx-701 for Eleanor Vance-Bishop (MRN-84920)',
        ipAddress: '192.168.1.189',
        clinicName: 'Aura Health Memorial',
      },
      {
        id: 'audit-905',
        timestamp: '2026-09-08 14:30:22',
        actorEmail: 'superadmin@clinic.io',
        actorRole: 'SUPERADMIN',
        action: 'UPDATE_GLOBAL_SETTINGS',
        module: 'settings',
        details: 'Toggled system feature flag: "enable_biometric_auth" -> true',
        ipAddress: '10.0.4.12',
        clinicName: 'System-Wide',
      },
    ],
    clinicalConfig: {
      operatingHours: [
        { day: 'Monday', opens: '08:00', closes: '18:00', isClosed: false },
        { day: 'Tuesday', opens: '08:00', closes: '18:00', isClosed: false },
        { day: 'Wednesday', opens: '08:00', closes: '18:00', isClosed: false },
        { day: 'Thursday', opens: '08:00', closes: '18:00', isClosed: false },
        { day: 'Friday', opens: '08:00', closes: '17:00', isClosed: false },
        { day: 'Saturday', opens: '09:00', closes: '14:00', isClosed: false },
        { day: 'Sunday', opens: '09:00', closes: '13:00', isClosed: true },
      ],
      slotDurationMinutes: 30,
      bufferBetweenSlotsMinutes: 5,
      allowTelehealth: true,
      maxAdvanceBookingDays: 60,
      departments: [
        'Cardiology',
        'Diagnostic Medicine',
        'Emergency & Critical Care',
        'Pediatrics',
        'Orthopedics',
        'Neurology',
        'Outpatient Services',
        'Radiology',
      ],
      specialties: [
        'Interventional Cardiologist',
        'Head of Diagnostics',
        'Charge Nurse BSN, RN',
        'Senior Medical Biller',
        'Pediatric Intensivist',
        'Orthopedic Surgeon',
        'Lead Patient Coordinator',
      ],
    },
    globalSettings: {
      platformName: 'clinic Health Network',
      supportEmail: 'support@clinic.io',
      enforceTwoFactor: true,
      sessionTimeoutMinutes: 60,
      maintenanceMode: false,
      featureFlags: {
        aiTriageAssistant: true,
        biometricLogin: false,
        telehealthVideoWebRTC: true,
        fhirV4Export: true,
        automatedSmsReminders: true,
      },
    },
    publicSiteContent: {
      hero: {
        badge: 'Next-Gen Clinical Intelligence OS',
        title: 'Precision Healthcare Operations, Engineered for the Future',
        subtitle: 'Unify clinical scheduling, zero-trust granular permissions, smart EHR charts, and financial analytics in a single ultra-responsive platform.',
        primaryCta: 'Explore Live Platform',
        secondaryCta: 'Schedule Architecture Demo',
      },
      stats: {
        patientsManaged: '4.8M+',
        clinicsOnboarded: '1,420+',
        uptimePercent: '99.99%',
        satisfactionRate: '98.6%',
      },
      features: [
        {
          id: 'feat-1',
          icon: 'ShieldCheck',
          title: 'Dynamic Multi-Tenant RBAC',
          description: 'Customizable permission matrices per module and action with instant visual preview of effective staff entitlements.',
        },
        {
          id: 'feat-2',
          icon: 'CalendarClock',
          title: 'Intelligent Schedule Engine',
          description: 'Multi-provider timeline views, drag-to-reschedule conflicts protection, automated SMS reminders and telehealth rooms.',
        },
        {
          id: 'feat-3',
          icon: 'Activity',
          title: 'Clinical Vitals & Rx Pipeline',
          description: 'Prescription builder with drug interaction checks, structured clinical encounter notes and ICD-10 search.',
        },
        {
          id: 'feat-4',
          icon: 'DollarSign',
          title: 'Automated Billing & Claims',
          description: 'Instant insurance co-pay calculation, CPT-coded invoices, automated claims generation and digital payments.',
        },
        {
          id: 'feat-5',
          icon: 'Boxes',
          title: 'Pharmacy & Stock Tracking',
          description: 'Batch expiry monitoring, automated low-stock reorder triggers, and real-time dispensing audit trails.',
        },
        {
          id: 'feat-6',
          icon: 'Cpu',
          title: 'Real-time System Observability',
          description: 'Superadmin tenant observability, cluster health metrics, Redis queue status, and exportable audit logs.',
        },
      ],
      workflowSteps: [
        {
          role: 'Superadmin',
          description: 'Provisions enterprise clinic tenants, configures global feature flags, and monitors platform telemetry.',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          role: 'Clinic Admin',
          description: 'Designs dynamic role matrices, configures operating slots, and assigns staff with live effective privileges preview.',
          color: 'from-teal-500 to-cyan-600',
        },
        {
          role: 'Roles & Permissions',
          description: 'Dynamic security gateway enforcing field-level and module-level authorization across all API routes.',
          color: 'from-cyan-500 to-blue-600',
        },
        {
          role: 'Clinical Staff',
          description: 'Accesses only authorized clinical modules (Patients, Scheduling, Rx, Billing) with full audit trail logging.',
          color: 'from-blue-500 to-emerald-600',
        },
      ],
      pricingTiers: [
        {
          name: 'Starter Clinic',
          price: '₹24,999',
          period: '/month',
          description: 'Essential management for independent practices and single specialty clinics.',
          features: ['Up to 10 clinical staff', 'Patient charts & scheduling', 'Standard billing & invoicing', 'Email support'],
          highlighted: false,
        },
        {
          name: 'Professional Health Center',
          price: '₹59,999',
          period: '/month',
          description: 'Comprehensive solution for multi-provider clinics and growing health centers.',
          features: ['Up to 50 clinical staff', 'Dynamic RBAC permission matrix', 'Pharmacy & inventory tracking', 'Priority 24/7 SLA', 'Clinical analytics & reports'],
          highlighted: true,
        },
        {
          name: 'Enterprise Hospital Network',
          price: 'Custom',
          period: 'annual billing',
          description: 'Full white-label deployment for health networks with dedicated infrastructure.',
          features: ['Unlimited staff & locations', 'Dedicated tenant cluster & custom domain', 'FHIR / HL7 API integration', 'Custom audit export & SSO / SAML', 'Dedicated Solutions Engineer'],
          highlighted: false,
        },
      ],
      faqs: [
        {
          q: 'How does the dynamic permission matrix work?',
          a: 'Admins can construct custom roles by selecting granular actions (View, Create, Edit, Delete, Export, Approve) across all clinical modules. When a staff member is assigned multiple roles, clinic computes their effective merged permission set in real time.',
        },
        {
          q: 'Is patient health information secure?',
          a: 'clinic is engineered with HIPAA and GDPR compliance as first-class architectural requirements, featuring TLS 1.3 encryption in transit, AES-256 at rest, strict audit logging, and role-based zero-trust authorization.',
        },
        {
          q: 'Can we connect clinic with existing laboratory or pharmacy systems?',
          a: 'Yes. clinic exposes standardized REST and FHIR APIs with webhook subscriptions for lab results, pharmacy dispensing orders, and billing clearinghouses.',
        },
      ],
    },
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  }
  return initial
}

let db = getInitialDb()

export const syncDb = () => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed) {
          // Purge any legacy dummy staff from cached localStorage
          if (Array.isArray(parsed.staff)) {
            parsed.staff = parsed.staff.filter((s) => {
              const email = (s.email || '').toLowerCase()
              return (
                !email.includes('doctor@clinic.io') &&
                !email.includes('reception@clinic.io') &&
                !email.includes('james.rodriguez@clinic.io') &&
                !email.includes('amara.chen@clinic.io') &&
                !email.includes('g.house@clinic.io') &&
                !s.name?.includes('Al-Mansoor') &&
                !s.name?.includes('Rostova') &&
                !s.name?.includes('Gregory House')
              )
            })
          }
          db = parsed
        }
      } catch (e) {
        console.warn('Failed to parse saved DB during sync', e)
      }
    }
  }
  return db
}

const saveDb = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  }
}

export const resetDevDb = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
  db = getInitialDb()
  return db
}

// Simulated network delay helper
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Handle simulated dev requests
 */
export const handleSimulatedRequest = async (config) => {
  syncDb()
  let rawUrl = config.url || ''
  try {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const parsed = new URL(rawUrl)
      rawUrl = parsed.pathname
    }
  } catch (e) { }
  const url = rawUrl.split('?')[0].replace(/^\/api/, '')
  const method = (config.method || 'get').toLowerCase()
  const data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {}
  const params = config.params || {}

  await delay(200 + Math.random() * 150) // Realistic server latency

  // 1. PUBLIC ENDPOINTS
  if (url === '/chat' && method === 'post') {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
      const backendRes = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (backendRes.ok) {
        const backendData = await backendRes.json()
        return [200, backendData]
      }
    } catch (err) {
      // Backend offline fallback
    }
    return [200, { success: true, reply: "The AI Assistant backend is processing your request. Make sure your backend server is running (`npm run dev` in server) with your OPENROUTER_API_KEY." }]
  }

  if (url === '/public/site-content' && method === 'get') {
    return [200, db.publicSiteContent]
  }

  if (url === '/public/newsletter' && method === 'post') {
    return [200, { success: true, message: 'Successfully subscribed to clinic Health updates!' }]
  }

  if (url === '/public/register' && method === 'post') {
    const {
      clinicName = '',
      subdomain = '',
      adminName = '',
      email = '',
      password = '',
      phone = '',
      specialty = 'General Medicine',
      region = 'Asia / India (INR ₹)',
      plan = 'Professional',
    } = data

    // 1. Field validation
    if (!clinicName || clinicName.trim().length < 2) {
      return [
        400,
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Clinic name must be at least 2 characters long.',
          },
        },
      ]
    }
    if (!email || !email.includes('@')) {
      return [
        400,
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please provide a valid email address.',
          },
        },
      ]
    }
    if (!password || password.length < 6) {
      return [
        400,
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 6 characters long.',
          },
        },
      ]
    }
    if (!adminName || adminName.trim().length < 2) {
      return [
        400,
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Administrator name is required.',
          },
        },
      ]
    }

    const normalizedEmail = (email || '').toLowerCase().trim()
    const cleanSubdomain = (subdomain || clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-')).toLowerCase().trim()

    // 2. Duplicate email check
    const emailInPending = (db.pendingRegistrations || []).some(
      (r) => (r.email || '').toLowerCase().trim() === normalizedEmail
    )
    const emailInApproved = (db.approvedRegistrations || []).some(
      (r) => (r.email || '').toLowerCase().trim() === normalizedEmail
    )
    const emailInAdmins = (db.admins || []).some(
      (a) => (a.email || '').toLowerCase().trim() === normalizedEmail
    )
    if (emailInPending || emailInApproved || emailInAdmins) {
      return [
        409,
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: `An account with email "${normalizedEmail}" already exists. If your registration is pending, please await administrator approval.`,
          },
        },
      ]
    }

    // 3. Duplicate subdomain check
    const subdomainInPending = (db.pendingRegistrations || []).some(
      (r) => (r.subdomain || '').toLowerCase().trim() === cleanSubdomain
    )
    const subdomainInApproved = (db.approvedRegistrations || []).some(
      (r) => (r.subdomain || '').toLowerCase().trim() === cleanSubdomain
    )
    const subdomainInClinics = (db.clinics || []).some(
      (c) => (c.slug || '').toLowerCase().trim() === cleanSubdomain
    )
    if (subdomainInPending || subdomainInApproved || subdomainInClinics) {
      return [
        409,
        {
          success: false,
          error: {
            code: 'DUPLICATE_SUBDOMAIN',
            message: `The clinic subdomain "${cleanSubdomain}" is already in use. Please select a different subdomain.`,
          },
        },
      ]
    }

    // 4. Safe Database Insert & Storage
    const regId = 'reg-' + Date.now()
    const registration = {
      id: regId,
      clinicName: clinicName.trim(),
      subdomain: cleanSubdomain,
      adminName: adminName.trim(),
      email: normalizedEmail,
      password,
      phone,
      specialty,
      region,
      plan,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }

    try {
      if (!db.pendingRegistrations) db.pendingRegistrations = []
      db.pendingRegistrations.unshift(registration)
      saveDb()

      // Cross-tab broadcast & beacon
      if (typeof window !== 'undefined') {
        try {
          const bc = new BroadcastChannel('clinic_registration_channel')
          bc.postMessage({
            type: 'REGISTRATION_CREATED',
            registrationId: regId,
            clinicName: clinicName.trim(),
            email: normalizedEmail,
            subdomain: cleanSubdomain,
            submittedAt: registration.submittedAt,
          })
          bc.close()
        } catch (e) { }

        try {
          localStorage.setItem(
            'clinic_last_created_registration',
            JSON.stringify({
              timestamp: Date.now(),
              registrationId: regId,
              clinicName: clinicName.trim(),
              email: normalizedEmail,
            })
          )
        } catch (e) { }
      }
    } catch (saveErr) {
      return [
        500,
        {
          success: false,
          error: {
            code: 'STORAGE_ERROR',
            message: 'Failed to write registration to database storage: ' + saveErr.message,
          },
        },
      ]
    }

    return [
      201,
      {
        success: true,
        message: 'Clinic registration submitted successfully and is awaiting Super Admin verification.',
        registrationId: regId,
        registration,
      },
    ]
  }

  if (url === '/public/register-staff' && method === 'post') {
    const { email = '', name = '', password = '', staffId = '', role = '', department = '', specialty = '' } = data
    const normalizedEmail = (email || '').toLowerCase().trim()

    let staffMember = (db.staff || []).find(
      (s) => (staffId && s.id === staffId) || (s.email || '').toLowerCase() === normalizedEmail
    )

    if (staffMember) {
      if (name) staffMember.name = name
      staffMember.password = password
      staffMember.status = 'active'
      staffMember.isRegistered = true
      staffMember.registeredAt = new Date().toISOString()
      if (role && !staffMember.role) staffMember.role = role
    } else {
      staffMember = {
        id: staffId || 'staff-' + (db.staff?.length || 0 + 1),
        name: name || 'Clinical Staff Member',
        email: normalizedEmail,
        password,
        phone: '+1 (555) 019-8822',
        role: role || 'STAFF',
        roles: [role || 'STAFF'],
        department: department || 'General Clinical Medicine',
        specialty: specialty || role || 'Clinical Staff',
        status: 'active',
        clinicId: 'clinic-1',
        clinicName: 'Aura Health Memorial',
        isRegistered: true,
      }
      if (!db.staff) db.staff = []
      db.staff.unshift(staffMember)
    }
    saveDb()

    // Resolve matching roles & permissions
    const matchingRoles = (db.roles || []).filter(
      (r) =>
        (staffMember.roles || []).includes(r.id) ||
        (staffMember.roles || []).includes(r.name) ||
        r.name.toLowerCase() === (staffMember.role || '').toLowerCase()
    )
    const resolvedPermissions = Array.from(new Set(matchingRoles.flatMap((r) => r.permissions || [])))

    const newUser = {
      id: staffMember.id,
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role ? staffMember.role.toUpperCase().replace(/\s+/g, '_') : 'STAFF',
      roleTitle: matchingRoles[0]?.name || staffMember.role || staffMember.specialty || 'Clinical Staff Member',
      userType: 'STAFF',
      isSuperadmin: false,
      isAdmin: false,
      clinicId: staffMember.clinicId || 'clinic-1',
      clinicName: staffMember.clinicName || 'Aura Health Memorial',
      roles: matchingRoles.map((r) => r.name).length > 0 ? matchingRoles.map((r) => r.name) : [staffMember.role || 'Staff'],
      permissions: resolvedPermissions.length > 0 ? resolvedPermissions : ['patients.view', 'appointments.view', 'prescriptions.view'],
      effectivePermissions: resolvedPermissions.length > 0 ? resolvedPermissions : ['patients.view', 'appointments.view', 'prescriptions.view'],
      avatar: staffMember.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    }

    const tokens = {
      accessToken: 'jwt_token_staff_' + Date.now(),
      refreshToken: 'refresh_token_staff_' + Date.now(),
    }

    return [
      200,
      {
        success: true,
        message: 'Staff account successfully registered and activated.',
        user: newUser,
        tokens,
      },
    ]
  }

  if (url.startsWith('/public/registration-status/') && method === 'get') {
    const id = url.split('/')[3]
    const pending = (db.pendingRegistrations || []).find((r) => r.id === id)
    if (pending) {
      return [200, { status: 'pending', registration: pending }]
    }

    const approved = (db.approvedRegistrations || []).find((r) => r.id === id)
    if (approved) {
      return [
        200,
        {
          status: 'approved',
          registration: approved,
          tokens: approved.tokens,
          user: approved.user,
        },
      ]
    }

    const rejected = (db.rejectedRegistrations || []).find((r) => r.id === id)
    if (rejected) {
      return [
        200,
        {
          status: 'rejected',
          registration: rejected,
          rejectionReason: rejected.rejectionReason || 'Registration criteria not met',
          rejectedAt: rejected.rejectedAt || new Date().toISOString(),
        },
      ]
    }

    return [404, { error: 'Registration request not found' }]
  }

  // 2. AUTH ENDPOINTS
  if (url === '/auth/me' && method === 'get') {
    let currentUser = null
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('clinic_user')
        if (raw) currentUser = JSON.parse(raw)
      }
    } catch (e) { }

    if (!currentUser) {
      currentUser = {
        id: 'usr-admin-1',
        name: 'Dr. Evelyn Vance',
        email: 'admin@aurahealth.org',
        role: 'ADMIN',
        roleTitle: 'Clinic Administrator',
        userType: 'ADMIN',
        isAdmin: true,
        isSuperadmin: false,
        clinicName: 'Aura Health Memorial',
        roles: ['ADMIN', 'Clinical Administrator'],
        permissions: ['*'],
      }
    }
    return [200, { success: true, data: currentUser, user: currentUser }]
  }

  if (url === '/auth/refresh' && method === 'post') {
    let userEmail = (data.email || '').toLowerCase().trim()
    if (!userEmail) {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('clinic_user')
          if (raw) userEmail = JSON.parse(raw)?.email || ''
        }
      } catch (e) { }
    }
    const tokenIdentifier = userEmail || 'admin@aurahealth.org'
    const tokenPayload = {
      accessToken: 'jwt_token_' + tokenIdentifier + '_' + Date.now(),
      refreshToken: 'sim_ref_' + Date.now(),
      expiresIn: 900,
    }
    return [200, { success: true, data: tokenPayload, ...tokenPayload }]
  }

  if (url === '/auth/login' && method === 'post') {
    const { email = '', password = '', role: requestedRole = '' } = data
    const normalizedEmail = (email || '').toLowerCase().trim()
    const targetRole = (requestedRole || '').toUpperCase()

    // 1. Strict approval check: Block pending hospital/clinic registrations
    const pendingHospital = (db.pendingRegistrations || []).find(
      (r) => (r.email || '').toLowerCase().trim() === normalizedEmail
    )
    if (pendingHospital) {
      return [
        403,
        {
          success: false,
          code: 'HOSPITAL_PENDING_APPROVAL',
          message:
            'Your registration is currently awaiting Super Admin approval. Login will remain locked until your registration is approved. Once approved, your clinic administrator workspace will be fully accessible.',
          registration: {
            id: pendingHospital.id,
            clinicName: pendingHospital.clinicName,
            email: pendingHospital.email,
          },
        },
      ]
    }

    // 2. Strict approval check: Block pending or inactive staff accounts
    const staffMatch = (db.staff || []).find(
      (s) => (s.email || '').toLowerCase().trim() === normalizedEmail
    )
    if (staffMatch) {
      if (staffMatch.status === 'pending' || staffMatch.isApproved === false) {
        return [
          403,
          {
            success: false,
            code: 'STAFF_PENDING_APPROVAL',
            message:
              'Your clinical staff account is pending administrator approval. Please await clinic admin approval before signing in.',
          },
        ]
      }
      if (staffMatch.status === 'inactive' || staffMatch.status === 'deactivated') {
        return [
          403,
          {
            success: false,
            code: 'ACCOUNT_DEACTIVATED',
            message:
              'Your account has been deactivated. Please contact your hospital administrator for reactivation.',
          },
        ]
      }
    }

    let mockUser = null
    const mockToken = 'jwt_token_' + (normalizedEmail || 'user') + '_' + Date.now()

    // 3. Superadmin Platform Accounts
    if (
      normalizedEmail === 'admin@zuna.com' ||
      normalizedEmail === 'superadmin@clinic.io' ||
      normalizedEmail === 'superadmin@clinic.io' ||
      normalizedEmail.startsWith('superadmin@')
    ) {
      mockUser = {
        id: 'usr-superadmin',
        name: 'Alexander Sterling (Zuna Super Admin)',
        email: normalizedEmail || 'admin@zuna.com',
        role: 'SUPERADMIN',
        roleTitle: 'Platform Superadministrator',
        userType: 'SUPERADMIN',
        isSuperadmin: true,
        isAdmin: true,
        clinicId: 'system-wide',
        clinicName: 'Zuna Global Platform Operations',
        roles: ['SUPERADMIN'],
        permissions: ['*'],
        effectivePermissions: ['*'],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      }
    }
    // 4. Approved Hospital Registration Accounts (Granted Admin Panel)
    else if ((db.approvedRegistrations || []).some((r) => (r.email || '').toLowerCase().trim() === normalizedEmail)) {
      const approvedHospital = db.approvedRegistrations.find(
        (r) => (r.email || '').toLowerCase().trim() === normalizedEmail
      )
      // Check password if stored
      if (approvedHospital.password && password && approvedHospital.password !== password) {
        return [
          401,
          {
            success: false,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Please verify your credentials.',
          },
        ]
      }
      const adminRole = db.roles.find((r) => r.id === 'role-admin')
      mockUser = approvedHospital.user || {
        id: approvedHospital.id || 'usr-admin-' + Date.now(),
        name: approvedHospital.adminName || 'Hospital Administrator',
        email: normalizedEmail,
        role: 'ADMIN',
        roleTitle: 'Clinic Director & Administrator',
        userType: 'ADMIN',
        isSuperadmin: false,
        isAdmin: true,
        clinicId: approvedHospital.clinicId || 'clinic-new',
        clinicName: approvedHospital.clinicName || 'Clinical Workspace',
        roles: ['ADMIN', 'Clinical Administrator'],
        permissions: adminRole ? adminRole.permissions : [
          'patients.view', 'patients.create', 'patients.edit', 'patients.delete', 'patients.export',
          'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.export',
          'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.delete', 'prescriptions.export',
          'billing.view', 'billing.create', 'billing.edit', 'billing.delete', 'billing.export',
          'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.export',
          'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.export',
          'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
          'reports.view', 'reports.export',
          'clinical_config.view', 'clinical_config.edit',
          'settings.view', 'settings.edit'
        ],
        effectivePermissions: ['*'],
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
      }
    }
    // 5. Existing Clinic Admin Accounts
    else if (
      (db.admins || []).some((a) => (a.email || '').toLowerCase().trim() === normalizedEmail) ||
      normalizedEmail === 'admin@aurahealth.org' ||
      normalizedEmail === 'admin@clinic.io' ||
      normalizedEmail.includes('vance')
    ) {
      const clinicAdmin = (db.admins || []).find((a) => (a.email || '').toLowerCase().trim() === normalizedEmail)
      if (clinicAdmin && clinicAdmin.password && password && clinicAdmin.password !== password) {
        return [
          401,
          {
            success: false,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Please verify your credentials.',
          },
        ]
      }
      const adminRole = db.roles.find((r) => r.id === 'role-admin')
      mockUser = {
        id: clinicAdmin ? clinicAdmin.id : 'usr-admin',
        name: clinicAdmin ? clinicAdmin.name : 'Dr. Evelyn Vance',
        email: normalizedEmail || 'admin@aurahealth.org',
        role: 'ADMIN',
        roleTitle: 'Clinic Administrator',
        userType: 'ADMIN',
        isSuperadmin: false,
        isAdmin: true,
        clinicId: clinicAdmin ? clinicAdmin.clinicId : 'clinic-1',
        clinicName: clinicAdmin ? clinicAdmin.clinicName : 'Aura Health Memorial',
        roles: ['ADMIN', 'Clinical Administrator'],
        permissions: adminRole ? adminRole.permissions : [
          'patients.view', 'patients.create', 'patients.edit', 'patients.delete', 'patients.export',
          'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.export',
          'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.delete', 'prescriptions.export',
          'billing.view', 'billing.create', 'billing.edit', 'billing.delete', 'billing.export',
          'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.export',
          'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.export',
          'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
          'reports.view', 'reports.export',
          'clinical_config.view', 'clinical_config.edit',
          'settings.view', 'settings.edit'
        ],
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
      }
    }
    // 6. Active Staff Member Accounts
    else if (staffMatch && staffMatch.status === 'active') {
      const staffMember = staffMatch
      const assignedRoleIds = Array.isArray(staffMember.roles) ? staffMember.roles : [staffMember.roles].filter(Boolean)
      const matchingRoles = (db.roles || []).filter(
        (r) => assignedRoleIds.includes(r.id) || assignedRoleIds.includes(r.name) || r.name.toLowerCase() === (staffMember.role || '').toLowerCase()
      )
      const resolvedPermissions = Array.from(new Set(matchingRoles.flatMap((r) => r.permissions || [])))
      const roleTitles = matchingRoles.map((r) => r.name)

      mockUser = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: matchingRoles[0]?.name ? matchingRoles[0].name.toUpperCase().replace(/\s+/g, '_') : (staffMember.role || 'STAFF').toUpperCase(),
        roleTitle: matchingRoles[0]?.name || staffMember.specialty || 'Clinical Staff Member',
        userType: 'STAFF',
        isSuperadmin: false,
        isAdmin: false,
        clinicId: staffMember.clinicId || 'clinic-1',
        clinicName: staffMember.clinicName || 'Aura Health Memorial',
        roles: roleTitles.length > 0 ? roleTitles : ['Staff'],
        permissions: resolvedPermissions,
        effectivePermissions: resolvedPermissions,
        avatar: staffMember.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      }
    }
    // 7. Demo Accounts for Staff Roles
    else if (
      normalizedEmail.startsWith('reception@') ||
      targetRole === 'RECEPTIONIST'
    ) {
      const receptionRole = db.roles.find((r) => r.id === 'role-receptionist')
      mockUser = {
        id: 'staff-2',
        name: 'Elena Rostova',
        email: normalizedEmail || 'reception@clinic.io',
        role: 'RECEPTIONIST',
        roleTitle: 'Front Desk & Receptionist',
        userType: 'STAFF',
        isSuperadmin: false,
        isAdmin: false,
        clinicId: 'clinic-1',
        clinicName: 'Aura Health Memorial',
        roles: ['RECEPTIONIST', 'Front Desk & Receptionist'],
        permissions: receptionRole ? receptionRole.permissions : [
          'patients.view', 'patients.create', 'patients.edit',
          'appointments.view', 'appointments.create', 'appointments.edit',
          'billing.view', 'billing.create'
        ],
        avatar: 'https://images.unsplash.com/photo-1594824813572-c24458514131?auto=format&fit=crop&q=80&w=300',
      }
    } else if (
      normalizedEmail.startsWith('nurse@') ||
      targetRole === 'NURSE'
    ) {
      const nurseRole = db.roles.find((r) => r.id === 'role-nurse')
      mockUser = {
        id: 'staff-3',
        name: 'James C. Rodriguez',
        email: normalizedEmail || 'nurse@clinic.io',
        role: 'NURSE',
        roleTitle: 'Registered Clinical Nurse',
        userType: 'STAFF',
        isSuperadmin: false,
        isAdmin: false,
        clinicId: 'clinic-1',
        clinicName: 'Aura Health Memorial',
        roles: ['NURSE', 'Registered Clinical Nurse'],
        permissions: nurseRole ? nurseRole.permissions : [
          'patients.view', 'patients.edit',
          'appointments.view',
          'prescriptions.view',
          'inventory.view'
        ],
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      }
    } else if (
      normalizedEmail.startsWith('biller@') ||
      targetRole === 'BILLER'
    ) {
      const billerRole = db.roles.find((r) => r.id === 'role-biller')
      mockUser = {
        id: 'staff-4',
        name: 'Amara Chen',
        email: normalizedEmail || 'biller@clinic.io',
        role: 'BILLER',
        roleTitle: 'Billing & Insurance Specialist',
        userType: 'STAFF',
        isSuperadmin: false,
        isAdmin: false,
        clinicId: 'clinic-1',
        clinicName: 'Aura Health Memorial',
        roles: ['BILLER', 'Billing & Insurance Specialist'],
        permissions: billerRole ? billerRole.permissions : [
          'patients.view',
          'billing.view', 'billing.create', 'billing.edit', 'billing.export',
          'reports.view', 'reports.export'
        ],
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      }
    } else if (
      normalizedEmail.startsWith('doctor@') ||
      targetRole === 'DOCTOR'
    ) {
      const doctorRole = db.roles.find((r) => r.id === 'role-doctor')
      mockUser = {
        id: 'staff-1',
        name: 'Dr. Sarah Al-Mansoor',
        email: normalizedEmail || 'doctor@clinic.io',
        role: 'DOCTOR',
        roleTitle: 'Senior Attending Physician',
        userType: 'STAFF',
        isSuperadmin: false,
        isAdmin: false,
        clinicId: 'clinic-1',
        clinicName: 'Aura Health Memorial',
        roles: ['DOCTOR', 'Senior Attending Physician'],
        permissions: doctorRole ? doctorRole.permissions : [
          'patients.view', 'patients.edit', 'patients.export',
          'appointments.view', 'appointments.create', 'appointments.edit',
          'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.export',
          'inventory.view',
          'reports.view'
        ],
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      }
    } else {
      // 8. Block all unrecognized/unapproved accounts with clear error (do not default to doctor!)
      return [
        401,
        {
          success: false,
          code: 'UNAPPROVED_OR_INVALID',
          message:
            'Invalid credentials or account not yet approved. If you recently registered, please await administrator approval before logging in.',
        },
      ]
    }

    mockUser.effectivePermissions = mockUser.permissions

    const tokenPayload = {
      accessToken: mockToken,
      refreshToken: 'refresh_token_' + Date.now(),
      expiresIn: 900,
    }

    return [
      200,
      {
        success: true,
        message: 'Authentication successful',
        data: {
          user: mockUser,
          tokens: tokenPayload,
        },
        user: mockUser,
        tokens: tokenPayload,
        accessToken: mockToken,
        refreshToken: tokenPayload.refreshToken,
      },
    ]
  }

  if (url === '/auth/refresh' && method === 'post') {
    return [200, { accessToken: 'jwt_refreshed_' + Date.now() }]
  }

  if (url === '/auth/forgot-password' && method === 'post') {
    return [200, { success: true, message: 'Password reset link has been dispatched to your email address.' }]
  }

  if (url === '/auth/reset-password' && method === 'post') {
    return [200, { success: true, message: 'Password has been successfully updated.' }]
  }

  if (url === '/auth/2fa' && method === 'post') {
    return [200, { verified: true, message: '2FA authentication verified successfully.' }]
  }

  // 3. SUPERADMIN ENDPOINTS
  if (url === '/superadmin/kpis' && method === 'get') {
    const totalClinics = (db.clinics || []).length
    const activeTenants = (db.clinics || []).filter((c) => c.status === 'active').length
    const totalStaff = (db.staff || []).length + 42
    const totalAdmins = (db.admins || []).length || 3
    const monthlyRecurringRevenue = 285001 + (totalClinics * 25001)

    return [
      200,
      {
        totalClinics,
        activeTenants,
        totalStaff,
        totalAdmins,
        monthlyRecurringRevenue,
        mrrGrowthPercentage: 14.8,
        activeSessions: 184,
        systemHealth: '99.99% Operational',
        revenueTrends: [
          { month: 'Apr', revenue: 195001, clinics: Math.max(1, totalClinics - 4) },
          { month: 'May', revenue: 215001, clinics: Math.max(2, totalClinics - 3) },
          { month: 'Jun', revenue: 240000, clinics: Math.max(3, totalClinics - 2) },
          { month: 'Jul', revenue: 260000, clinics: Math.max(4, totalClinics - 1) },
          { month: 'Aug', revenue: 275001, clinics: Math.max(5, totalClinics) },
          { month: 'Sep', revenue: monthlyRecurringRevenue, clinics: totalClinics },
        ],
      },
    ]
  }

  if (url === '/superadmin/pending-registrations' && method === 'get') {
    return [
      200,
      {
        registrations: db.pendingRegistrations || [],
        total: (db.pendingRegistrations || []).length,
      },
    ]
  }

  if (url.startsWith('/superadmin/registrations/') && url.endsWith('/approve') && method === 'post') {
    const id = url.split('/')[3]
    const regIndex = (db.pendingRegistrations || []).findIndex((r) => r.id === id)
    if (regIndex === -1) {
      return [404, { error: 'Registration request not found or already processed' }]
    }

    const reg = db.pendingRegistrations[regIndex]
    const newClinicId = 'clinic-' + (db.clinics.length + 1)
    const provisionedClinic = {
      id: newClinicId,
      name: reg.clinicName,
      slug: reg.subdomain || reg.clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      plan: reg.plan || 'Professional',
      status: 'active',
      staffCount: 1,
      patientsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      region: reg.region || 'Asia / India (INR ₹)',
      contactEmail: reg.email,
      domain: `${reg.subdomain || 'clinic'}.clinic.io`,
      needsEnvironmentSetup: true,
    }
    db.clinics.unshift(provisionedClinic)

    const newAdminUser = {
      id: 'usr-admin-' + Date.now(),
      name: reg.adminName,
      email: reg.email,
      role: 'ADMIN',
      roleTitle: 'Clinic Director & Administrator',
      userType: 'ADMIN',
      isSuperadmin: false,
      isAdmin: true,
      clinicId: newClinicId,
      clinicName: reg.clinicName,
      roles: ['ADMIN', 'Clinical Administrator'],
      permissions: [
        'patients.view', 'patients.create', 'patients.edit', 'patients.delete', 'patients.export',
        'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.export',
        'prescriptions.view', 'prescriptions.create', 'prescriptions.edit', 'prescriptions.delete', 'prescriptions.export',
        'billing.view', 'billing.create', 'billing.edit', 'billing.delete', 'billing.export',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.export',
        'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.export',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'reports.view', 'reports.export',
        'clinical_config.view', 'clinical_config.edit',
        'settings.view', 'settings.edit'
      ],
      effectivePermissions: ['*'],
      needsEnvironmentSetup: true,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    }

    db.admins.unshift({
      id: 'admin-' + (db.admins.length + 1),
      name: reg.adminName,
      email: reg.email,
      password: reg.password,
      clinicId: newClinicId,
      clinicName: reg.clinicName,
      role: 'ADMIN',
      status: 'active',
      twoFactorEnabled: false,
      lastLogin: 'Never',
    })

    db.pendingRegistrations.splice(regIndex, 1)
    if (!db.approvedRegistrations) db.approvedRegistrations = []

    const tokenPayload = {
      accessToken: 'jwt_token_admin_' + Date.now(),
      refreshToken: 'refresh_token_admin_' + Date.now(),
      expiresIn: 900,
    }

    const approvedRecord = {
      ...reg,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      user: newAdminUser,
      tokens: tokenPayload,
    }
    db.approvedRegistrations.unshift(approvedRecord)
    saveDb()

    // 1. BroadcastChannel notification for zero-latency cross-tab sync
    try {
      const channel = new BroadcastChannel('clinic_registration_channel')
      channel.postMessage({
        type: 'REGISTRATION_APPROVED',
        registrationId: id,
        clinic: provisionedClinic,
        user: newAdminUser,
        tokens: tokenPayload,
      })
      channel.close()
    } catch (e) { }

    // 2. LocalStorage beacon for cross-tab storage event
    localStorage.setItem(
      'clinic_last_approved_registration',
      JSON.stringify({
        registrationId: id,
        timestamp: Date.now(),
        user: newAdminUser,
        tokens: tokenPayload,
      })
    )

    return [
      200,
      {
        success: true,
        message: `Clinic "${reg.clinicName}" approved and provisioned successfully!`,
        clinic: provisionedClinic,
        user: newAdminUser,
      },
    ]
  }

  if (url.startsWith('/superadmin/registrations/') && url.endsWith('/reject') && method === 'post') {
    const id = url.split('/')[3]
    const reg = (db.pendingRegistrations || []).find((r) => r.id === id)
    const reason = data?.reason || data?.rejection_reason || 'Registration criteria not met'
    const rejectedAt = new Date().toISOString()

    db.pendingRegistrations = (db.pendingRegistrations || []).filter((r) => r.id !== id)
    if (!db.rejectedRegistrations) db.rejectedRegistrations = []
    if (reg) {
      db.rejectedRegistrations.unshift({
        ...reg,
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt,
      })
    }
    saveDb()

    try {
      const channel = new BroadcastChannel('clinic_registration_channel')
      channel.postMessage({
        type: 'REGISTRATION_REJECTED',
        registrationId: id,
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt,
      })
      channel.close()
    } catch (e) { }

    try {
      localStorage.setItem(
        'clinic_last_rejected_registration',
        JSON.stringify({
          registrationId: id,
          timestamp: Date.now(),
          status: 'rejected',
          rejectionReason: reason,
          rejectedAt,
        })
      )
    } catch (e) { }

    return [200, { success: true, message: 'Registration request rejected.' }]
  }

  if (url === '/superadmin/clinics' && method === 'get') {
    return [200, { clinics: db.clinics, total: db.clinics.length }]
  }

  if (url === '/superadmin/clinics' && method === 'post') {
    const newClinic = {
      id: 'clinic-' + (db.clinics.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      staffCount: 1,
      patientsCount: 0,
      status: 'active',
      ...data,
    }
    db.clinics.unshift(newClinic)
    saveDb()
    return [201, newClinic]
  }

  if (url.startsWith('/superadmin/clinics/') && method === 'put') {
    const id = url.split('/')[3]
    const index = db.clinics.findIndex((c) => c.id === id)
    if (index !== -1) {
      db.clinics[index] = { ...db.clinics[index], ...data }
      saveDb()
      return [200, db.clinics[index]]
    }
    return [404, { error: 'Clinic tenant not found' }]
  }

  if (url.startsWith('/superadmin/clinics/') && method === 'delete') {
    const id = url.split('/')[3]
    db.clinics = db.clinics.filter((c) => c.id !== id)
    saveDb()
    return [200, { success: true }]
  }

  if (url === '/superadmin/admins' && method === 'get') {
    return [200, { admins: db.admins, total: db.admins.length }]
  }

  if (url === '/superadmin/admins' && method === 'post') {
    const newAdmin = {
      id: 'admin-' + (db.admins.length + 1),
      status: 'active',
      twoFactorEnabled: true,
      lastLogin: 'Never',
      ...data,
    }
    db.admins.unshift(newAdmin)
    saveDb()
    return [201, newAdmin]
  }

  if (url.startsWith('/superadmin/admins/') && method === 'put') {
    const id = url.split('/')[3]
    const idx = db.admins.findIndex((a) => a.id === id)
    if (idx !== -1) {
      db.admins[idx] = { ...db.admins[idx], ...data }
      saveDb()
      return [200, db.admins[idx]]
    }
    return [404, { error: 'Admin account not found' }]
  }

  if (url === '/superadmin/settings' && method === 'get') {
    return [200, db.globalSettings]
  }

  if (url === '/superadmin/settings' && method === 'put') {
    db.globalSettings = { ...db.globalSettings, ...data }
    saveDb()
    return [200, db.globalSettings]
  }

  if (url === '/superadmin/audit-logs' && method === 'get') {
    return [200, { logs: db.auditLogs, total: db.auditLogs.length }]
  }

  if (url === '/superadmin/health' && method === 'get') {
    return [
      200,
      {
        status: 'HEALTHY',
        apiLatencyMs: 24,
        uptimeSeconds: 849200,
        redisStatus: 'CONNECTED (Latency 1.2ms)',
        databaseStatus: 'CONNECTED (PostgreSQL 16, 12 active pools)',
        activeWorkers: 8,
        memoryUsageMb: 312,
        cpuUsagePercent: 8.4,
      },
    ]
  }

  // 4. ADMIN ENDPOINTS
  if (url === '/admin/kpis' && method === 'get') {
    return [
      200,
      {
        patientsToday: 42,
        appointmentsScheduled: 36,
        staffOnDuty: 18,
        dailyRevenue: 482000,
        appointmentStatusBreakdown: [
          { name: 'Completed', value: 21, color: '#22C55E' },
          { name: 'In-Progress', value: 6, color: '#3B82F6' },
          { name: 'Scheduled', value: 9, color: '#F59E0B' },
        ],
        weeklyPatientTrends: [
          { day: 'Mon', count: 48 },
          { day: 'Tue', count: 52 },
          { day: 'Wed', count: 46 },
          { day: 'Thu', count: 58 },
          { day: 'Fri', count: 64 },
          { day: 'Sat', count: 32 },
          { day: 'Sun', count: 14 },
        ],
      },
    ]
  }

  if (url === '/admin/permission-modules' && method === 'get') {
    return [200, { modules: db.permissionModules }]
  }

  if (url === '/admin/roles' && method === 'get') {
    return [200, { roles: db.roles, total: db.roles.length }]
  }

  if (url === '/admin/roles' && method === 'post') {
    const newRole = {
      id: 'role-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      staffCount: 0,
      permissions: [],
      ...data,
    }
    db.roles.push(newRole)
    saveDb()
    return [201, newRole]
  }

  if (url.startsWith('/admin/roles/') && method === 'put') {
    const id = url.split('/')[3]
    const idx = db.roles.findIndex((r) => r.id === id)
    if (idx !== -1) {
      db.roles[idx] = { ...db.roles[idx], ...data }
      saveDb()

      // Broadcast permissions update live across active tabs
      try {
        const channel = new BroadcastChannel('clinic_permissions_channel')
        channel.postMessage({
          type: 'ROLE_PERMISSIONS_UPDATED',
          roleId: id,
          roleName: db.roles[idx].name,
          permissions: db.roles[idx].permissions,
          timestamp: Date.now(),
        })
        channel.close()
      } catch (e) { }

      localStorage.setItem(
        'clinic_last_role_update',
        JSON.stringify({
          roleId: id,
          roleName: db.roles[idx].name,
          permissions: db.roles[idx].permissions,
          timestamp: Date.now(),
        })
      )

      return [200, db.roles[idx]]
    }
    return [404, { error: 'Role not found' }]
  }

  if (url.startsWith('/admin/roles/') && method === 'delete') {
    const id = url.split('/')[3]
    db.roles = db.roles.filter((r) => r.id !== id)
    saveDb()
    return [200, { success: true }]
  }

  if (url === '/admin/staff' && method === 'get') {
    let currentUser = null
    try {
      const authRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('clinic_user') : null
      if (authRaw) currentUser = JSON.parse(authRaw)
    } catch (e) { }

    const userTenantId = currentUser?.tenantId || currentUser?.clinicId

    // Filter staff strictly by active tenant and ensure dummy staff are eliminated
    const tenantStaff = (db.staff || []).filter((s) => {
      const email = (s.email || '').toLowerCase()
      const isDummy =
        email.includes('doctor@clinic.io') ||
        email.includes('reception@clinic.io') ||
        email.includes('james.rodriguez@clinic.io') ||
        email.includes('amara.chen@clinic.io') ||
        email.includes('g.house@clinic.io') ||
        s.name?.includes('Al-Mansoor') ||
        s.name?.includes('Rostova')
      if (isDummy) return false

      if (userTenantId) {
        return s.tenantId === userTenantId || s.clinicId === userTenantId
      }
      return true
    })

    // Enrich staff with their roles object and effective permissions
    const enrichedStaff = tenantStaff.map((s) => {
      const assignedRoles = db.roles.filter((r) => s.roles?.includes(r.id))
      const effectivePermissions = Array.from(
        new Set(assignedRoles.flatMap((r) => r.permissions || []))
      )
      return {
        ...s,
        roleObjects: assignedRoles,
        effectivePermissions,
      }
    })
    return [200, { staff: enrichedStaff, data: enrichedStaff, total: enrichedStaff.length }]
  }

  if (url === '/admin/staff' && method === 'post') {
    const newStaff = {
      id: 'staff-' + Date.now(),
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      ...data,
    }
    db.staff.unshift(newStaff)
    saveDb()

    try {
      const channel = new BroadcastChannel('clinic_permissions_channel')
      channel.postMessage({
        type: 'STAFF_CREATED',
        staff: newStaff,
        timestamp: Date.now(),
      })
      channel.close()
    } catch (e) { }

    return [201, newStaff]
  }

  if (url.startsWith('/admin/staff/') && method === 'put') {
    const rawId = url.split('/')[3]?.split('?')[0]
    const id = decodeURIComponent(rawId || '')
    if (!db.staff) db.staff = []
    let idx = db.staff.findIndex((s) => String(s.id) === String(id) || s.email === id)
    if (idx === -1 && data.email) {
      idx = db.staff.findIndex((s) => (s.email || '').toLowerCase() === data.email.toLowerCase())
    }

    if (idx !== -1) {
      db.staff[idx] = { ...db.staff[idx], ...data }
      saveDb()

      try {
        const channel = new BroadcastChannel('clinic_permissions_channel')
        channel.postMessage({
          type: 'STAFF_UPDATED',
          staffId: id,
          staff: db.staff[idx],
          timestamp: Date.now(),
        })
        channel.close()
      } catch (e) { }

      return [200, db.staff[idx]]
    }

    // Graceful fallback: create or update without returning 404
    const newStaff = {
      id: id || 'staff-' + Date.now(),
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      ...data,
    }
    db.staff.push(newStaff)
    saveDb()
    return [200, newStaff]
  }

  if (url.startsWith('/admin/staff/') && method === 'get') {
    const rawId = url.split('/')[3]?.split('?')[0]
    const id = decodeURIComponent(rawId || '')
    const found = (db.staff || []).find((s) => String(s.id) === String(id) || s.email === id)
    return [200, found || { id, name: 'Clinical Staff Member', role: 'STAFF' }]
  }

  if (url.startsWith('/admin/staff/') && method === 'delete') {
    const rawId = url.split('/')[3]?.split('?')[0]
    const id = decodeURIComponent(rawId || '')
    db.staff = (db.staff || []).filter((s) => String(s.id) !== String(id))
    saveDb()
    return [200, { success: true }]
  }

  if (url === '/admin/clinical-config' && method === 'get') {
    return [200, db.clinicalConfig]
  }

  if (url === '/admin/clinical-config' && method === 'put') {
    db.clinicalConfig = { ...db.clinicalConfig, ...data }
    saveDb()
    return [200, db.clinicalConfig]
  }

  if (url === '/admin/environment-setup' && method === 'post') {
    const {
      currency = '₹ INR',
      timezone = 'Asia/Kolkata (IST)',
      departments,
      activeModules,
      operatingHours,
      clinicName,
    } = data

    if (!db.clinicalConfig) db.clinicalConfig = {}
    db.clinicalConfig = {
      ...db.clinicalConfig,
      currency,
      timezone,
      departments: departments || db.clinicalConfig.departments || [
        'General Medicine',
        'Cardiology',
        'Pediatrics',
        'Orthopedics',
        'Emergency',
      ],
      activeModules: activeModules || {
        patients: true,
        appointments: true,
        prescriptions: true,
        billing: true,
        inventory: true,
      },
      operatingHours: operatingHours || {
        mondayFriday: '08:00 - 20:00',
        saturday: '09:00 - 17:00',
        sunday: 'Emergency Only',
      },
      environmentConfigured: true,
      configuredAt: new Date().toISOString(),
    }

    if (clinicName && db.clinics) {
      const clinic = db.clinics.find((c) => c.name === clinicName) || db.clinics[0]
      if (clinic) clinic.needsEnvironmentSetup = false
    }

    saveDb()
    return [
      200,
      {
        success: true,
        message: 'Clinic environment successfully configured!',
        config: db.clinicalConfig,
      },
    ]
  }

  if (url === '/admin/reports' && method === 'get') {
    return [
      200,
      {
        departmentWorkload: [
          { department: 'Cardiology', patients: 184, procedures: 42, satisfaction: 98 },
          { department: 'Diagnostic Med', patients: 142, procedures: 36, satisfaction: 96 },
          { department: 'Emergency', patients: 260, procedures: 95, satisfaction: 94 },
          { department: 'Pediatrics', patients: 112, procedures: 18, satisfaction: 99 },
          { department: 'Orthopedics', patients: 88, procedures: 29, satisfaction: 97 },
        ],
        revenueByService: [
          { name: 'Consultations', value: 45 },
          { name: 'Diagnostics & Imaging', value: 28 },
          { name: 'In-office Procedures', value: 17 },
          { name: 'Pharmacy Dispensing', value: 10 },
        ],
      },
    ]
  }

  // 5. STAFF ENDPOINTS
  if (url === '/staff/patients' && method === 'get') {
    return [200, { patients: db.patients, total: db.patients.length }]
  }

  if (url === '/staff/patients' && method === 'post') {
    const newPat = {
      id: 'pat-' + Date.now(),
      mrn: 'MRN-' + Math.floor(10000 + Math.random() * 90000),
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'Active',
      ...data,
    }
    db.patients.unshift(newPat)
    saveDb()
    return [201, newPat]
  }

  if (url === '/staff/appointments' && method === 'get') {
    return [200, { appointments: db.appointments, total: db.appointments.length }]
  }

  if (url === '/staff/appointments' && method === 'post') {
    const newApt = {
      id: 'apt-' + Date.now(),
      status: 'Scheduled',
      ...data,
    }
    db.appointments.unshift(newApt)
    saveDb()
    return [201, newApt]
  }

  if (url.startsWith('/staff/appointments/') && method === 'put') {
    const id = url.split('/')[3]
    const idx = db.appointments.findIndex((a) => a.id === id)
    if (idx !== -1) {
      db.appointments[idx] = { ...db.appointments[idx], ...data }
      saveDb()
      return [200, db.appointments[idx]]
    }
    return [404, { error: 'Appointment not found' }]
  }

  // OUTPATIENT TRIAGE & TOKEN QUEUE
  if (url === '/staff/triage' && method === 'get') {
    if (!db.triageQueue) db.triageQueue = []
    return [200, { success: true, data: db.triageQueue, total: db.triageQueue.length }]
  }

  if (url === '/staff/triage' && method === 'post') {
    if (!db.triageQueue) db.triageQueue = []
    const tokenNumber = data.tokenNumber ? String(data.tokenNumber).trim() : `TK-${Math.floor(100 + Math.random() * 900)}`

    // Check if patient exists or add walk-in
    let patient = db.patients.find(p => p.id === data.patientId || (data.patientName && (p.fullName === data.patientName || p.name === data.patientName)))
    if (!patient && (data.patientName || data.name)) {
      patient = {
        id: 'pat-' + Date.now(),
        mrn: 'MRN-' + Math.floor(10000 + Math.random() * 90000),
        fullName: data.patientName || data.name,
        name: data.patientName || data.name,
        phone: data.phone || data.patientPhone || '+91 98000 00000',
        gender: data.gender || 'Female',
        dob: data.dob || '1990-01-01',
        bloodGroup: data.bloodGroup || 'O+',
        lastVisit: new Date().toISOString().split('T')[0],
        status: 'Active'
      }
      db.patients.unshift(patient)
    }

    const newTriage = {
      id: 'tr-' + Date.now(),
      tokenNumber,
      patientId: patient?.id || data.patientId || 'pat-' + Date.now(),
      patientName: patient?.fullName || patient?.name || data.patientName || data.name || 'Outpatient',
      patientPhone: patient?.phone || data.phone || data.patientPhone || '',
      patientGender: patient?.gender || data.gender || 'Female',
      weight: data.weight ? `${data.weight}` : '',
      bp: data.bp ? `${data.bp}` : '',
      sugarLevel: data.sugarLevel ? `${data.sugarLevel}` : '',
      currentMedications: data.currentMedications ? `${data.currentMedications}` : '',
      doctorName: data.doctorName || 'Dr. Sarah Al-Mansoor',
      notes: data.notes || '',
      status: 'WAITING_FOR_DOCTOR',
      recordedAt: new Date().toISOString(),
      recordedBy: 'Elena Rostova (Front Desk)'
    }

    db.triageQueue.unshift(newTriage)

    // Also add to appointments if needed
    const newApt = {
      id: 'apt-' + Date.now(),
      patientId: newTriage.patientId,
      patientName: newTriage.patientName,
      patientPhone: newTriage.patientPhone,
      doctorName: newTriage.doctorName,
      department: 'General Medicine',
      dateTime: new Date().toISOString(),
      durationMinutes: 30,
      type: 'In-Person Consultation',
      reason: `[Token: ${tokenNumber}] ${newTriage.notes || 'Outpatient Consultation'}`,
      status: 'In-Progress',
      room: 'Consultation Room 1'
    }
    db.appointments.unshift(newApt)

    saveDb()
    return [201, { success: true, message: `Token ${tokenNumber} issued and vitals recorded`, triageReport: newTriage, patient }]
  }

  if (url === '/staff/prescriptions' && method === 'get') {
    return [200, { prescriptions: db.prescriptions, total: db.prescriptions.length }]
  }

  if (url === '/staff/prescriptions' && method === 'post') {
    const tokenNumber = data.tokenNumber || null
    let notes = data.notes || ''
    if (tokenNumber && !notes.includes(tokenNumber)) {
      notes = `[Token: ${tokenNumber}] ${notes}`.trim()
    }

    const newRx = {
      id: 'rx-' + Date.now(),
      tokenNumber,
      date: new Date().toISOString().split('T')[0],
      status: data.status || 'Pending Dispense',
      ...data,
      notes
    }
    db.prescriptions.unshift(newRx)

    // Update matching triage item status to PRESCRIBED
    if (tokenNumber && db.triageQueue) {
      const match = db.triageQueue.find(t => t.tokenNumber === tokenNumber)
      if (match) {
        match.status = 'PRESCRIBED'
      }
    }

    saveDb()
    return [201, newRx]
  }

  if (url.startsWith('/staff/prescriptions/') && url.endsWith('/fulfill') && method === 'patch') {
    const id = url.split('/')[3]
    const idx = db.prescriptions.findIndex(r => r.id === id)
    if (idx !== -1) {
      const rx = db.prescriptions[idx]
      rx.status = 'Fulfilled'
      rx.fulfilledAt = new Date().toISOString()
      rx.fulfilledBy = data?.dispensedBy || 'Pharmacy Staff'
      rx.notes = (rx.notes ? rx.notes + '\n' : '') + `[Fulfilled by ${rx.fulfilledBy} on ${new Date().toLocaleDateString()}]: ${data?.notes || 'Medications dispensed and verified'}`

      // Update matching triageQueue item to PHARMACY_FULFILLED
      if (db.triageQueue && (rx.tokenNumber || rx.patientName)) {
        const match = db.triageQueue.find(t => (rx.tokenNumber && t.tokenNumber === rx.tokenNumber) || t.patientName === rx.patientName)
        if (match) {
          match.status = 'PHARMACY_FULFILLED'
        }
      }

      saveDb()
      return [200, { success: true, message: 'Prescription fulfilled and medications dispensed', data: rx, ...rx }]
    }
    return [404, { error: 'Prescription not found' }]
  }

  if (url.startsWith('/staff/prescriptions/') && method === 'patch') {
    const id = url.split('/')[3]
    const idx = db.prescriptions.findIndex(r => r.id === id)
    if (idx !== -1) {
      db.prescriptions[idx] = { ...db.prescriptions[idx], ...data }
      saveDb()
      return [200, { success: true, data: db.prescriptions[idx] }]
    }
    return [404, { error: 'Prescription not found' }]
  }

  if (url === '/staff/billing' && method === 'get') {
    return [200, { invoices: db.invoices, total: db.invoices.length }]
  }

  if (url === '/staff/billing' && method === 'post') {
    const newInv = {
      id: 'inv-' + Date.now(),
      invoiceNumber: 'INV-2026-00' + (db.invoices.length + 84),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      ...data,
    }
    db.invoices.unshift(newInv)
    saveDb()
    return [201, newInv]
  }

  if (url === '/staff/inventory' && method === 'get') {
    return [200, { inventory: db.inventory, total: db.inventory.length }]
  }

  if (url === '/staff/inventory' && method === 'post') {
    const newItem = {
      id: 'inv-item-' + Date.now(),
      status: 'Optimal',
      ...data,
    }
    db.inventory.unshift(newItem)
    saveDb()
    return [201, newItem]
  }

  if ((url === '/pharmacy/inventory/bulk-import' || url === '/staff/inventory/bulk-import') && method === 'post') {
    if (data?.commit && Array.isArray(data?.validRows)) {
      data.validRows.forEach((r) => {
        const d = r.data || {}
        db.inventory.unshift({
          id: 'inv-item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: d.name,
          category: d.category || 'General Supplies',
          stockQuantity: d.stockQuantity || 0,
          unit: d.unit || 'Units',
          sellingPrice: d.sellingPrice || 0,
          unitCost: d.unitCost || 0,
          batchNumber: d.batchNumber,
          expiryDate: d.expiryDate,
          schedule: d.schedule || 'OTC',
          brandName: d.brandName,
          status: 'Optimal',
        })
      })
      saveDb()
      return [
        200,
        {
          success: true,
          importedCount: data.validRows.length,
          createdCount: data.validRows.length,
          updatedCount: 0,
          importBatchId: 'IMP-DEV-' + Date.now(),
          message: `Successfully imported ${data.validRows.length} items in dev simulator.`,
        },
      ]
    }
  }
  if (url === '/staff/reports' && method === 'get') {
    return [
      200,
      {
        personalMetrics: {
          encountersCompleted: 142,
          prescriptionsWritten: 89,
          averageConsultTimeMins: 22,
          patientReviewScore: 4.9,
        },
        weeklyLoad: [
          { day: 'Mon', count: 12 },
          { day: 'Tue', count: 15 },
          { day: 'Wed', count: 11 },
          { day: 'Thu', count: 16 },
          { day: 'Fri', count: 18 },
        ],
      },
    ]
  }

  if (url === '/staff/me/permissions' && method === 'get') {
    return [
      200,
      {
        permissions: ['*'],
        effectivePermissions: ['*'],
      },
    ]
  }

  console.warn(`[DevApiSimulator 404] Unhandled route requested: ${method.toUpperCase()} "${url}" (Original config.url: "${config.url}")`)
  return [404, { error: `Endpoint ${method.toUpperCase()} ${config.url} not found` }]
}
