import { PatientsScreen } from '../screens/clinical/PatientsScreen';
import { AppointmentsScreen } from '../screens/clinical/AppointmentsScreen';
import { PrescriptionsScreen } from '../screens/clinical/PrescriptionsScreen';
import { BillingScreen } from '../screens/clinical/BillingScreen';
import { InventoryScreen } from '../screens/clinical/InventoryScreen';
import { PatientFlowScreen } from '../screens/clinical/PatientFlowScreen';
import { StaffManagementScreen } from '../screens/admin/StaffManagementScreen';
import { CardiologyScreen } from '../screens/specialty/CardiologyScreen';
import { PhysiotherapyScreen } from '../screens/specialty/PhysiotherapyScreen';
import { DentalScreen } from '../screens/specialty/DentalScreen';
import { ComingSoonScreen } from '../screens/modules/ComingSoonScreen';

// website route -> app screen (+ initial tab for the specialty screens)
export const MODULE_REGISTRY = {
    '/app/staff/patients': { component: PatientsScreen },
    '/app/staff/appointments': { component: AppointmentsScreen },
    '/app/staff/prescriptions': { component: PrescriptionsScreen },
    '/app/staff/billing': { component: BillingScreen },
    '/app/staff/inventory': { component: InventoryScreen },
    '/app/staff/flow': { component: PatientFlowScreen },
    '/app/admin/staff': { component: StaffManagementScreen },

    '/app/cardio/ecg-records': { component: CardiologyScreen, params: { tab: 'ECG' } },
    '/app/cardio/echo-reports': { component: CardiologyScreen, params: { tab: 'ECHO' } },
    '/app/cardio/cath-lab': { component: CardiologyScreen, params: { tab: 'CATH' } },
    '/app/cardio/risk-assessment': { component: CardiologyScreen, params: { tab: 'RISK' } },

    '/app/physio/treatment-plans': { component: PhysiotherapyScreen, params: { tab: 'PLANS' } },
    '/app/physio/exercise-tracker': { component: PhysiotherapyScreen, params: { tab: 'EXERCISES' } },
    '/app/physio/progress-notes': { component: PhysiotherapyScreen, params: { tab: 'NOTES' } },

    '/app/dental/chart': { component: DentalScreen, params: { tab: 'CHART' } },
    '/app/dental/treatment-plans': { component: DentalScreen, params: { tab: 'PLANS' } },
    '/app/dental/xrays': { component: DentalScreen, params: { tab: 'XRAY' } },
    '/app/dental/orthodontics': { component: DentalScreen, params: { tab: 'ORTHO' } },
    '/app/dental/implants': { component: DentalScreen, params: { tab: 'IMPLANT' } },
    '/app/dental/lab-orders': { component: DentalScreen, params: { tab: 'LAB' } },
};

export const resolveModule = (route) =>
    MODULE_REGISTRY[route] || { component: ComingSoonScreen };

// Preferred order for the 3 quick-access bottom tabs
export const TAB_PRIORITY = [
    '/app/staff/patients',
    '/app/staff/appointments',
    '/app/staff/flow',
    '/app/staff/prescriptions',
    '/app/dental/chart',
    '/app/cardio/ecg-records',
    '/app/physio/treatment-plans',
    '/app/staff/billing',
    '/app/staff/inventory',
];
