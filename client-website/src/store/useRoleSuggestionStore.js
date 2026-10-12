import { create } from 'zustand'

export const useRoleSuggestionStore = create((set) => ({
  roleNameQuery: '',
  matchedKeywords: [],
  suggestedPermissions: [],
  suggestedCodes: [],
  suggestionStatus: 'idle', // 'idle' | 'suggested' | 'not_found'
  suggestionMessage: '',
  isBannerVisible: false,

  setRoleNameQuery: (name) => set({ roleNameQuery: name }),

  applySuggestions: ({ matchedKeywords = [], permissions = [], permissionCodes = [], message = '' }) => {
    const hasMatches = matchedKeywords.length > 0 && permissions.length > 0
    set({
      matchedKeywords,
      suggestedPermissions: permissions,
      suggestedCodes: permissionCodes,
      suggestionStatus: hasMatches ? 'suggested' : 'not_found',
      suggestionMessage: message || (hasMatches 
        ? 'Suggested based on role name — review before saving.' 
        : 'No matching template found. Please select permissions manually.'),
      isBannerVisible: true
    })
  },

  dismissBanner: () => set({ isBannerVisible: false }),

  resetSuggestions: () => set({
    roleNameQuery: '',
    matchedKeywords: [],
    suggestedPermissions: [],
    suggestedCodes: [],
    suggestionStatus: 'idle',
    suggestionMessage: '',
    isBannerVisible: false
  })
}))

export default useRoleSuggestionStore
