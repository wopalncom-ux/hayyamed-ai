'use client'
import { useEffect, useRef, useState } from 'react'

// Lightweight scroll reveal — no animation library, just IntersectionObserver.
// Adds the `.in` class when the element scrolls into view (once). GPU-only
// (opacity/transform) and automatically disabled by prefers-reduced-motion.
export default function Reveal({ children, delay = 0, as: Tag = 'div', style, className = '', ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { setShown(true); io.disconnect() } })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  return (
    <Tag ref={ref} className={`hai-reveal${shown ? ' in' : ''}${className ? ' ' + className : ''}`} style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  )
}
