import React, { useState } from 'react'

/**
 * LazyImage component with native lazy loading, async decoding,
 * smooth fade-in transition, and skeleton fallback.
 */
export const LazyImage = ({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  width,
  height,
  fallback = null,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return fallback || (
      <div
        className={`bg-surface-elevated/40 border border-border/40 flex items-center justify-center text-text-muted text-xs ${className}`}
        style={{ width, height }}
      >
        <span className="truncate px-1">{alt || 'Image'}</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-primary/5 animate-pulse ${placeholderClassName}`}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          setIsLoaded(true)
          if (onLoad) onLoad(e)
        }}
        onError={(e) => {
          setHasError(true)
          if (onError) onError(e)
        }}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  )
}

export default LazyImage
