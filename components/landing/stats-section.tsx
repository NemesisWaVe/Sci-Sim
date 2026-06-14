'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function CountUp({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
}: {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

const STATS = [
  {
    value: 4,
    suffix: '',
    label: 'Interactive Labs',
    sub: 'Physics · Chemistry · Biology · Math',
    color: 'var(--physics)',
  },
  {
    value: 35,
    suffix: '%',
    label: 'Learning Improvement',
    sub: 'Active vs. passive STEM study¹',
    color: 'var(--chemistry)',
  },
  {
    value: 10,
    suffix: '+',
    label: 'Achievement Badges',
    sub: 'Earned through genuine discovery',
    color: 'var(--biology)',
  },
  {
    value: 1,
    suffix: '',
    label: 'AI Tutor',
    sub: 'Reads your live data as you experiment',
    color: 'var(--math)',
  },
]

export function StatsSection() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-foreground py-20">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 size-80 rounded-full bg-physics/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 size-80 rounded-full bg-chemistry/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-background/50">
            By the numbers
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-background md:text-4xl">
            Science, measured
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="mb-2 font-mono text-5xl font-bold tabular-nums md:text-6xl"
                style={{ color: s.color }}
              >
                <CountUp target={s.value} suffix={s.suffix} duration={1.8} />
              </div>
              <p className="text-lg font-semibold text-background">{s.label}</p>
              <p className="mt-1 text-xs text-background/50">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[10px] text-background/30">
          ¹ Freeman et al., 2014, PNAS — Active learning improves STEM exam scores by ~35% vs. traditional lecture.
        </p>
      </div>
    </section>
  )
}
