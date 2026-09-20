import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

let externalToastHandler = null
export const notify = {
  success: (msg, opts) => externalToastHandler?.('success', msg, opts),
  error: (msg, opts) => externalToastHandler?.('error', msg, opts),
  warning: (msg, opts) => externalToastHandler?.('warning', msg, opts),
  info: (msg, opts) => externalToastHandler?.('info', msg, opts),
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    const newToast = {
      id,
      type,
      message,
      duration: options.duration || 4000,
      title: options.title || (type.charAt(0).toUpperCase() + type.slice(1)),
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  externalToastHandler = addToast

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
      default:
        return <Info className="w-5 h-5 text-info shrink-0" />
    }
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-colors bg-surface/95 border-border"
            >
              {getToastIcon(toast.type)}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-text-primary capitalize">{toast.title}</h4>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    return notify
  }
  return {
    success: (msg, opts) => context.addToast('success', msg, opts),
    error: (msg, opts) => context.addToast('error', msg, opts),
    warning: (msg, opts) => context.addToast('warning', msg, opts),
    info: (msg, opts) => context.addToast('info', msg, opts),
    remove: context.removeToast,
  }
}
