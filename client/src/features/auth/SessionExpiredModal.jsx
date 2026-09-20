import React from 'react'
import { AlertCircle, LogIn } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/useAuthStore'

export const SessionExpiredModal = () => {
  const { sessionExpired, returnUrl, setSessionExpired, logout } = useAuthStore()

  const handleReLogin = () => {
    const original = returnUrl || window.location.pathname
    logout()
    setSessionExpired(false)
    window.location.href = `/login?returnUrl=${encodeURIComponent(original)}`
  }

  return (
    <Modal
      isOpen={sessionExpired}
      onClose={() => {}}
      title="Session Expired"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-heading font-bold text-base text-text-primary mb-2">
          Security Timeout
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed mb-6">
          Your active JWT authentication token has expired or been revoked by the security gateway. Please sign in again to resume your clinical session without losing unsaved changes.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={handleReLogin}
          className="w-full"
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In Again
        </Button>
      </div>
    </Modal>
  )
}

export default SessionExpiredModal
