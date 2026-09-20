import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { ToastProvider } from '../components/ui/Toast'

export const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}

export default AppProviders
