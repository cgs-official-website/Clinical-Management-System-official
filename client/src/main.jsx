import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/index.css'

// Filter deprecated THREE.Clock and transient WebGL context lost warnings
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('THREE.Clock: This module has been deprecated') ||
       args[0].includes('THREE.WebGLRenderer: Context Lost'))
    ) {
      return
    }
    originalWarn.apply(console, args)
  }

  const originalError = console.error
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('THREE.WebGLRenderer: Context Lost')
    ) {
      return
    }
    originalError.apply(console, args)
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
