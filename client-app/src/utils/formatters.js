import { COLORS } from '../constants/colors';

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return `₹${amount}`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const getStatusStyle = (status = '') => {
  const norm = status.toUpperCase();
  switch (norm) {
    case 'ACTIVE':
    case 'PAID':
    case 'COMPLETED':
    case 'DISPENSED':
      return {
        bg: COLORS.successLight,
        text: COLORS.success,
        border: '#86EFAC',
      };
    case 'PENDING':
    case 'SCHEDULED':
    case 'AWAITING VITALS':
    case 'PENDING PHARMACY':
      return {
        bg: COLORS.warningLight,
        text: COLORS.warning,
        border: '#FDE68A',
      };
    case 'REJECTED':
    case 'CANCELLED':
    case 'OVERDUE':
    case 'HIGH RISK':
      return {
        bg: COLORS.dangerLight,
        text: COLORS.danger,
        border: '#FCA5A5',
      };
    case 'IN-PERSON':
    case 'IN CONSULTATION':
    case 'TRIAGE':
    case 'PHARMACY':
      return {
        bg: COLORS.primaryLight,
        text: COLORS.primary,
        border: '#A7F3D0',
      };
    default:
      return {
        bg: COLORS.surfaceMuted,
        text: COLORS.textSecondary,
        border: COLORS.border,
      };
  }
};

export const getRoleDisplay = (user) => {
  if (!user) return 'Staff';
  if (user.isSuperadmin || user.userType === 'SUPERADMIN' || user.role === 'SUPERADMIN') {
    return 'Super Admin';
  }
  if (user.isAdmin || user.userType === 'ADMIN' || user.role === 'ADMIN') {
    return user.roleTitle || 'Clinic Admin';
  }
  return user.roleTitle || user.role || 'Clinical Staff';
};
