"use client"

import Image from 'next/image'
import { forwardRef } from 'react'

interface SmartImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  unoptimized?: boolean
}

export const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(
  ({ src, alt, width, height, fill, className, priority, onLoad, onError, unoptimized, ...props }, ref) => {
    // Check if the image is from our API route
    const isApiImage = src.startsWith('/api/drive/image/')
    
    // For API images, use regular img tag to avoid Next.js optimization issues
    if (isApiImage) {
      return (
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={className}
          onLoad={onLoad}
          onError={onError}
          {...props}
        />
      )
    }
    
    // For external images, use Next.js Image component with optimization
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        priority={priority}
        onLoad={onLoad}
        onError={onError}
        unoptimized={unoptimized}
        {...props}
      />
    )
  }
)

SmartImage.displayName = 'SmartImage'
