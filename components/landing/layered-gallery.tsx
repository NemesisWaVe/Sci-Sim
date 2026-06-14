'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from 'framer-motion'
import { GALLERY_PANELS, SUBJECTS } from '@/lib/subjects'
import { BigBangParticles } from '@/components/landing/big-bang-particles'
import { KineticText } from '@/components/ui/kinetic-text'
import { TextHoverEffect } from '@/components/ui/text-hover-effect'

const PANEL_COUNT = GALLERY_PANELS.length

function Panel({
  src,
  i,
  progress,
  mouseX,
  mouseY,
}: {
  src: string
  i: number
  progress: MotionValue<number>
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}) {
  // We use a custom transform to calculate the staggered card deck loop.
  const layout = useTransform(progress, (p) => {
    // Prevent NaN crash on first frame before scroll measurements complete
    if (typeof p !== 'number' || isNaN(p)) {
      return { x: 0, y: 0, z: 0, opacity: 0, scale: 1, rotateZ: 0 }
    }

    // Big bang phase: Canvas takes over, so hide the DOM cards.
    if (p > 0.80) {
      return { x: 0, y: 0, z: 0, opacity: 0, scale: 1, rotateZ: 0 }
    }

    // Shuffle phase (0 to 0.80 mapped to 0 to 4 cycles)
    const cycle = (p / 0.80) * PANEL_COUNT
    let rel = (i - cycle) % PANEL_COUNT
    if (rel < 0) rel += PANEL_COUNT

    let x = 0
    let y = 0
    let z = 0
    let opacity = 1
    const scale = 1
    let rotateZ = -2

    if (rel > 3) {
      // Transition from Front (rel=4) to Back (rel=3)
      const t = 4 - rel
      if (t < 0.45) {
        // Phase 1: Pull out gently
        const pPull = t / 0.45
        // Use a gentler sine ease
        const easeOut = Math.sin((pPull * Math.PI) / 2)
        x = easeOut * -140
        y = easeOut * 60
        z = 400 + (easeOut * 150)
        opacity = 1 - Math.pow(pPull, 2)
        rotateZ = -2 - (easeOut * 5)
      } else {
        // Phase 2: Move to the back while invisible, then fade in as it reaches the back
        const pBack = (t - 0.45) / 0.55
        const backX = 3 * 100
        const backY = 3 * -80
        const backZ = 400 - (3 * 200)
        
        x = -140 + pBack * (backX - -140)
        y = 60 + pBack * (backY - 60)
        z = 550 + pBack * (backZ - 550)
        opacity = Math.pow(pBack, 1.5) * (1 - 3 * 0.15) 
        rotateZ = -7 + (pBack * 5)
      }
    } else {
      // Normal staggered stack progression (rel from 3 down to 0)
      x = rel * 100
      y = rel * -80
      z = 400 - (rel * 200)
      opacity = 1 - (rel * 0.15)
    }

    return { x, y, z, opacity, scale, rotateZ }
  })

  // Destructure layout motion value
  const x = useTransform(layout, (l) => l.x)
  const y = useTransform(layout, (l) => l.y)
  const z = useTransform(layout, (l) => l.z)
  const opacity = useTransform(layout, (l) => l.opacity)
  const scaleOut = useTransform(layout, (l) => l.scale)
  const rotateZ = useTransform(layout, (l) => l.rotateZ)

  const depth = i / (PANEL_COUNT - 1)
  const parallaxX = useTransform(mouseX, [-0.5, 0.5], [`${-4 * (1 - depth)}%`, `${4 * (1 - depth)}%`])
  const parallaxY = useTransform(mouseY, [-0.5, 0.5], [`${-3 * (1 - depth)}%`, `${3 * (1 - depth)}%`])

  return (
    <motion.div
      style={{
        z,
        x,
        y,
        opacity,
        rotateY: -18,
        rotateX: 8,
        rotateZ,
        scale: scaleOut,
        translateX: parallaxX,
        translateY: parallaxY,
      }}
      className="absolute left-[40%] top-[60%] h-[58vh] max-h-[560px] w-[64vw] max-w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/15 shadow-2xl shadow-black/40 will-change-transform"
    >
      <Image
        src={src || '/placeholder.svg'}
        alt=""
        fill
        sizes="460px"
        className="object-cover"
        priority={i < 2}
      />
      {/* Light gradient overlay for aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 mix-blend-overlay" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/20" />
    </motion.div>
  )
}

/** Animated perspective grid that tilts with mouse */
function InteractiveGrid({
  mouseX,
  mouseY,
  progress,
}: {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  progress: MotionValue<number>
}) {
  const gridOpacity = useTransform(progress, [0, 0.05, 0.65, 0.80], [0, 0.7, 0.7, 0])
  const tiltX = useTransform(mouseY, [-0.5, 0.5], [8, -8])
  const tiltY = useTransform(mouseX, [-0.5, 0.5], [-8, 8])

  return (
    <motion.div
      style={{ opacity: gridOpacity, rotateX: tiltX, rotateY: tiltY }}
      className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="gridFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="gridMask">
            <rect width="100" height="100" fill="url(#gridFade)" />
          </mask>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" mask="url(#gridMask)" className="text-foreground" />
      </svg>
    </motion.div>
  )
}

/** Floating math/science equations that drift in the background */
function FloatingEquations({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.05, 0.5, 0.80], [0, 0.4, 0.4, 0])
  const EQUATIONS = [
    'E = mc²', 'F = ma', 'pH = -log[H⁺]', '∇²ψ = 0',
    'T = 2π√(L/g)', 'PV = nRT', 'ΔG = ΔH - TΔS', 'e = hf',
    'v = u + at', 'λ = h/p',
  ]

  return (
    <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0 overflow-hidden">
      {EQUATIONS.map((eq, i) => {
        const left = 5 + ((i * 137.5) % 90)
        const top = 8 + ((i * 83.7) % 80)
        const delay = i * 0.4
        return (
          <motion.span
            key={eq}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 0.6, 0.6, 0], y: [10, 0, 0, -10] }}
            transition={{
              duration: 6,
              delay,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
            }}
            className="absolute font-mono text-xs text-foreground/20 select-none"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {eq}
          </motion.span>
        )
      })}
    </motion.div>
  )
}

export function LayeredGallery() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  // Re-trigger hack for particles
  const [progState, setProgState] = useState(0)
  useScroll({ target: ref, offset: ['start start', 'end end'] }).scrollYProgress.on('change', setProgState)

  // Raw mouse position normalized to [-0.5, 0.5]
  const [rawMouse, setRawMouse] = useState({ x: 0, y: 0 })
  const mouseXRaw = rawMouse.x
  const mouseYRaw = rawMouse.y

  // Smoothed mouse springs
  const smoothX = useSpring(0, { stiffness: 60, damping: 18 })
  const smoothY = useSpring(0, { stiffness: 60, damping: 18 })

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setRawMouse({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    smoothX.set(mouseXRaw)
    smoothY.set(mouseYRaw)
  }, [mouseXRaw, mouseYRaw, smoothX, smoothY])

  return (
    <section ref={ref} className="relative h-[150vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* soft science haze */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[12%] top-[18%] size-72 rounded-full bg-physics/20 blur-[120px]" />
          <div className="absolute right-[14%] top-[24%] size-72 rounded-full bg-chemistry/15 blur-[120px]" />
          <div className="absolute bottom-[16%] left-[40%] size-72 rounded-full bg-biology/15 blur-[130px]" />
        </div>

        {/* Interactive perspective grid */}
        <div className="perspective-2000 absolute inset-0">
          <InteractiveGrid mouseX={smoothX} mouseY={smoothY} progress={scrollYProgress} />
        </div>

        {/* Floating equations */}
        <FloatingEquations progress={scrollYProgress} />

        {/* Big Bang Particles overlay */}
        <BigBangParticles triggerProgress={progState} />

        <div className="perspective-2000 absolute inset-0">
          <div className="preserve-3d relative h-full w-full">
            {/* The stack relies on array order to overlap properly. Back cards should be first, front cards last.
                Since Z-index in 3D handles depth, the mapped order matters. */}
            {[...GALLERY_PANELS].reverse().map((src, i) => (
              <Panel key={i} src={src} i={PANEL_COUNT - 1 - i} progress={scrollYProgress} mouseX={smoothX} mouseY={smoothY} />
            ))}
          </div>
        </div>

        {/* heading overlaid on the stack */}
        <HeadingOverlay progress={scrollYProgress} />

        {/* Title Reveal (Explodes out of the big bang) */}
        {progState > 0.80 && (
          <div className="pointer-events-none absolute inset-0 z-[60] flex flex-col items-center justify-center text-center text-foreground">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="pointer-events-auto flex h-[30vh] w-full items-center justify-center px-4 sm:h-[40vh] md:h-[50vh]"
            >
              <TextHoverEffect text="SCI SIM" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
            >
              <KineticText 
                text="Your Virtual Science Lab" 
                className="mt-4 font-mono text-sm uppercase tracking-[0.4em] text-muted-foreground sm:text-base md:text-xl"
                delayBase={0.3}
              />
            </motion.div>
          </div>
        )}

        {/* category counters */}
        <div className="pointer-events-none absolute bottom-6 right-4 z-20 flex flex-col items-end gap-2 md:bottom-10 md:right-10">
          <span className="rounded-full border border-border bg-card/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-foreground backdrop-blur">
            All <sup className="ml-1 text-muted-foreground">04</sup>
          </span>
          {SUBJECTS.map((s) => (
            <Link
              key={s.id}
              href={`/lab/${s.id}`}
              className="pointer-events-auto rounded-full border border-border bg-card/60 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur transition hover:text-foreground"
            >
              {s.tag}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function HeadingOverlay({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.12, 0.3], [1, 1, 0], { clamp: true })
  const y = useTransform(progress, [0, 0.3], ['0%', '-12%'], { clamp: true })
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    return progress.on('change', (v) => {
      setIsVisible(v < 0.4)
    })
  }, [progress])

  if (!isVisible) return null

  return (
    <motion.div
      style={{ opacity, y }}
      className="pointer-events-none relative z-10 mx-auto max-w-3xl px-6 text-center mix-blend-difference text-white"
    >
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-white/70">
        Interactive STEM Education · AI-Powered
      </p>
      <h1 className="text-balance text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
        Explore the universe
        <br />
        in <span className="italic text-primary">real-time</span>
      </h1>
      <p className="mx-auto mt-6 max-w-md text-pretty leading-relaxed text-white/70">
        Four living labs. One AI tutor watching every move. Scroll to see the collection.
      </p>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mt-10 flex flex-col items-center gap-2"
      >
        <div className="h-10 w-5 rounded-full border border-muted-foreground/30 p-1">
          <div className="h-2 w-1.5 rounded-full bg-muted-foreground/50 mx-auto animate-bounce" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scroll</span>
      </motion.div>
    </motion.div>
  )
}
