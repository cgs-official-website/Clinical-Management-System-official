import { create } from 'zustand'

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeModal: null, // modal name/id
  modalData: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}))
