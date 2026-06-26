'use client'
import { useState, useEffect } from 'react'

// Reusable responsive breakpoint hook. Returns true when viewport <= breakpoint.
// SSR-safe (defaults to false until mounted).
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return isMobile
}
