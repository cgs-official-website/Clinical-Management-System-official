import React, { useState } from 'react'

export const Avatar = ({
  src,
  name = '',
  size = 'md',
  status,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-lg font-bold',
  }

  const getInitials = (n) => {
    if (!n) return '?'
    const parts = n.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return n.substring(0, 2).toUpperCase()
  }

  const statusStyles = {
    online: 'bg-success ring-surface',
    busy: 'bg-danger ring-surface',
    away: 'bg-warning ring-surface',
    offline: 'bg-text-secondary/40 ring-surface',
  }

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`relative flex items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary border border-primary/20 ${sizeStyles[size]} ${className}`}
      >
        {src && !imgError ? (
          <>
            {!isLoaded && (
              <span className="absolute inset-0 flex items-center justify-center bg-primary/10 text-primary animate-pulse">
                {getInitials(name)}
              </span>
            )}
            <img
              src={src}
              alt={name || 'Avatar'}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ${statusStyles[status]}`}
        />
      )}
    </div>
  )
}

export default Avatar
