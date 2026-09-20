import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppProviders } from './providers'
import { SessionExpiredModal } from '../features/auth/SessionExpiredModal'

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <SessionExpiredModal />
    </AppProviders>
  )
}

export default App
