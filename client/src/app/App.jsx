import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppProviders } from './providers'
import { SessionExpiredModal } from '../features/auth/SessionExpiredModal'
import { Chatbot } from '../components/common/Chatbot'

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <SessionExpiredModal />
      <Chatbot />
    </AppProviders>
  )
}

export default App
