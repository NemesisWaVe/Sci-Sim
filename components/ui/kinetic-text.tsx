'use client'

import { useRef, useEffect } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

interface KineticTextProps {
  text: string
  className?: string
  delayBase?: number
}

function KineticLetter({ 
  letter, 
  i, 
  delayBase, 
  mouseX, 
  mouseY 
}: { 
  letter: string
  i: number
  delayBase: number
  mouseX: any
  mouseY: any
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useSpring(0, { stiffness: 200, damping: 15 })
  const y = useSpring(0, { stiffness: 200, damping: 15 })

  useEffect(() => {
    const unsubscribe = mouseX.on('change', (mx: number) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const my = mouseY.get()

      const dx = mx - centerX
      const dy = my - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = 150

      if (dist < maxDist) {
        // Push away (repulsion)
        const force = (maxDist - dist) / maxDist
        x.set(-dx * force * 0.3)
        y.set(-dy * force * 0.3)
      } else {
        x.set(0)
        y.set(0)
      }
    })
    return () => unsubscribe()
  }, [mouseX, mouseY, x, y])

  return (
    <motion.span
      initial={{ y: '100%', opacity: 0, rotateX: -90 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 12,
        delay: delayBase + i * 0.04,
      }}
      className="inline-block"
    >
      <motion.span ref={ref} style={{ x, y }} className="inline-block will-change-transform">
        {letter === ' ' ? '\u00A0' : letter}
      </motion.span>
    </motion.span>
  )
}

export function KineticText({ text, className, delayBase = 0 }: KineticTextProps) {
  const letters = text.split('')
  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <span className={cn('inline-block overflow-hidden', className)}>
      {letters.map((letter, i) => (
        <KineticLetter 
          key={i} 
          letter={letter} 
          i={i} 
          delayBase={delayBase} 
          mouseX={mouseX} 
          mouseY={mouseY} 
        />
      ))}
    </span>
  )
}
