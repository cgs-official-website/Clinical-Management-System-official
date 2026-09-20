import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Destructive Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm & Delete',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center sm:text-left sm:items-start sm:flex-row gap-4">
        <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-border">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
