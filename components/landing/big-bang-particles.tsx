'use client'

import { useEffect, useRef } from 'react'
import { GALLERY_PANELS } from '@/lib/subjects'

// Configuration for particle explosion
const PARTICLE_DENSITY = 6 // Higher = fewer particles (pixel step size)
const EXPLOSION_FORCE = 12

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  decay: number
  color: string
}

export function BigBangParticles({ triggerProgress }: { triggerProgress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])

  // Preload images
  useEffect(() => {
    imagesRef.current = GALLERY_PANELS.map((src) => {
      const img = new Image()
      // Needs crossOrigin if from external domains, but these are local paths
      img.src = src
      return img
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let exploded = false

    function generateParticles() {
      if (!canvas || !ctx) return
      
      const vw = canvas.width
      const vh = canvas.height
      
      // We will draw the images to a temporary canvas roughly where the deck is centered
      const cardW = Math.min(vw * 0.5, 400)
      const cardH = cardW * (58 / 64) // approx aspect ratio of the cards in CSS
      const cx = vw / 2
      const cy = vh / 2

      // Draw each image and sample pixels
      imagesRef.current.forEach((img, i) => {
        if (!img.complete || img.naturalWidth === 0) return

        // Stagger positions roughly matching the CSS deck layout
        // Staggering them diagonally up-right
        const staggerX = i * 20
        const staggerY = i * -20
        
        const drawX = cx - cardW / 2 + staggerX
        const drawY = cy - cardH / 2 + staggerY

        // Draw image downscaled to match on-screen size
        ctx.clearRect(0, 0, vw, vh)
        ctx.drawImage(img, drawX, drawY, cardW, cardH)
        
        const imgData = ctx.getImageData(drawX, drawY, cardW, cardH)
        const data = imgData.data

        // Sample pixels to create particles
        for (let y = 0; y < cardH; y += PARTICLE_DENSITY) {
          for (let x = 0; x < cardW; x += PARTICLE_DENSITY) {
            const index = (y * Math.floor(cardW) + x) * 4
            const r = data[index]
            const g = data[index + 1]
            const b = data[index + 2]
            const a = data[index + 3]

            if (a > 128) { // Only solid pixels
              // Calculate explosion vector away from center of the deck
              const px = drawX + x
              const py = drawY + y
              const dx = px - cx
              const dy = py - cy
              const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
              
              const speed = (Math.random() * EXPLOSION_FORCE) + (EXPLOSION_FORCE * 100 / dist)
              
              particlesRef.current.push({
                x: px,
                y: py,
                vx: (dx / dist) * speed + (Math.random() - 0.5) * 5,
                vy: (dy / dist) * speed + (Math.random() - 0.5) * 5,
                life: 1,
                decay: Math.random() * 0.015 + 0.005,
                color: `rgb(${r}, ${g}, ${b})`,
              })
            }
          }
        }
      })
      
      // Clear the temp drawing
      ctx.clearRect(0, 0, vw, vh)
    }

    function loop() {
      if (!ctx || !canvas) return

      if (triggerProgress > 0.80 && !exploded) {
        exploded = true
        particlesRef.current = []
        generateParticles()
      } else if (triggerProgress <= 0.80) {
        exploded = false
        particlesRef.current = []
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      if (exploded) {
        // Clear the canvas cleanly instead of painting black, to allow KineticText to show
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i]
          p.x += p.vx
          p.y += p.vy
          
          // Add some drag
          p.vx *= 0.95
          p.vy *= 0.95
          
          p.life -= p.decay

          if (p.life > 0) {
            ctx.fillStyle = p.color
            // size depends on life
            const size = Math.max(0.5, p.life * (PARTICLE_DENSITY * 0.8))
            ctx.fillRect(p.x, p.y, size, size)
          }
        }
      }

      animationRef.current = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [triggerProgress])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[100] h-full w-full"
    />
  )
}
