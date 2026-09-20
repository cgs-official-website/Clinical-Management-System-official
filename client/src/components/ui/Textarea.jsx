import React from 'react'

export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      className = '',
      id,
      required,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-text-primary mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full rounded-xl border bg-surface/80 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary border-border ${
            error ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-text-secondary">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
