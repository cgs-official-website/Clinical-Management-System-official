import React from 'react'
import { Loader2 } from 'lucide-react'

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

    const sizeStyles = {
      xs: 'text-xs px-2.5 py-1.5 gap-1.5',
      sm: 'text-xs px-3 py-2 gap-2 font-medium',
      md: 'text-sm px-4 py-2.5 gap-2 font-semibold',
      lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
    }

    const variantStyles = {
      primary:
        'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-glow/40 border border-primary/20',
      secondary:
        'bg-surface text-text-primary hover:bg-border/40 border border-border shadow-soft',
      outline:
        'bg-transparent border border-border hover:border-primary/60 hover:text-primary text-text-primary',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent',
      danger:
        'bg-danger text-white hover:bg-red-600 shadow-sm hover:shadow-red-500/20 border border-danger/20',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
