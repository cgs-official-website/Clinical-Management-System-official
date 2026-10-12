/**
 * CLINIC OS / ZUNA HEALTH — CORE COLOR PALETTE
 * Strictly matching the existing website color system from client-website/src/styles/index.css
 */

export const COLORS = {
  // Brand Identity Colors (Emerald / Teal)
  primary: '#26A689',          // rgb(38, 166, 137)
  primaryHover: '#1E8C73',     // rgb(30, 140, 115)
  primaryLight: '#E0F5F0',     // rgb(224, 245, 240) - Subtle teal tint
  primaryDark: '#142924',      // rgb(20, 41, 36)

  // Canvas & Surfaces
  bg: '#FFFFFF',               // Light canvas
  surface: '#F8FAF9',          // Card & Panel surface (rgb 248, 250, 249)
  surfaceElevated: '#FFFFFF',  // Elevated modal/popover surface
  surfaceMuted: '#F1F5F3',     // Muted chip / background

  // Borders & Dividers
  border: '#E2E8E6',           // rgb(226, 232, 230)
  borderLight: '#EDF2F0',
  borderDark: '#CBD5D1',

  // Typography
  textPrimary: '#111815',      // rgb(17, 24, 21) - Rich charcoal
  textSecondary: '#5A6661',    // rgb(90, 102, 97) - Slate clinical gray
  textMuted: '#8E9B96',        // Subtle placeholder/caption
  textInverse: '#FFFFFF',      // White text on dark/primary backgrounds

  // Semantic Status Colors
  success: '#22C55E',          // Confirmed / Completed / Normal
  successLight: '#DCFCE7',
  warning: '#F59E0B',          // Pending / Review / Action required
  warningLight: '#FEF3C7',
  danger: '#EF4444',           // High risk / Overdue / Rejected
  dangerLight: '#FEE2E2',
  info: '#3B82F6',             // In-consultation / Active queue
  infoLight: '#DBEAFE',

  // Accents & Shadow Glow
  glow: 'rgba(38, 166, 137, 0.25)',
  glowLight: 'rgba(38, 166, 137, 0.12)',
  overlay: 'rgba(17, 24, 21, 0.65)',
};

export default COLORS;
