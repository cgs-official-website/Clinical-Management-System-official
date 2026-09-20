import React, { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Panel Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 mx-auto max-w-xl rounded-2xl border border-danger/30 bg-danger/5 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">
            {this.props.panelTitle || 'Section'} Encountered an Error
          </h3>
          <p className="text-xs text-text-secondary max-w-md mb-4 leading-relaxed">
            {this.state.error?.message ||
              'An unexpected runtime error occurred while rendering this module. You can reload this view.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={this.handleReset}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Section
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
