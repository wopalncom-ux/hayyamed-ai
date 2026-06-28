'use client'
import { useEffect, useRef } from 'react'

const HLS_SRC = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8'

// Client island: the HLS background video only. All hero text/markup is
// server-rendered by the parent (HeroVideo) for SEO.
export default function HeroVideoBg() {
  const videoRef = useRef(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let hls, cancelled = false
    const play = () => video.play().catch(() => {})
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_SRC
      video.addEventListener('loadedmetadata', play)
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return
        hls = new Hls({ enableWorker: false })
        hls.loadSource(HLS_SRC)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, play)
      }).catch(() => {})
    }
    return () => { cancelled = true; if (hls) hls.destroy() }
  }, [])
  return (
    <video ref={videoRef} muted loop playsInline autoPlay preload="auto" aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, zIndex: 0 }} />
  )
}
