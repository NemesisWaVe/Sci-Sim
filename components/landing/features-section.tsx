'use client'

import { motion } from 'framer-motion'
import { Brain, Atom, Trophy, Accessibility } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    color: 'var(--physics)',
    title: 'Proactive AI Tutor',
    description:
      'TutorBot doesn\'t wait to be asked. It observes your live simulation readings and nudges you toward discovery — then quizzes you on exactly what you just learned.',
    badge: 'AI Coaching',
  },
  {
    icon: Atom,
    color: 'var(--chemistry)',
    title: 'Real Physics Engines',
    description:
      'Every simulation runs genuine equations — pendulum dynamics with Runge-Kutta integration, real Henderson-Hasselbalch chemistry, and parabolic kinematics — not approximations.',
    badge: 'True Science',
  },
  {
    icon: Trophy,
    color: 'var(--biology)',
    title: 'Achievement System',
    description:
      'Earn badges as you experiment: catch the equivalence point, launch at 45° for maximum range, or switch between four planetary gravities. Science feels like exploration.',
    badge: 'Gamification',
  },
  {
    icon: Accessibility,
    color: 'var(--math)',
    title: 'Accessible by Design',
    description:
      'High-contrast mode, screen-reader live regions on every readout, keyboard shortcuts for all controls. STEM education should be for everyone — not just those without barriers.',
    badge: 'Inclusive',
  },
]

export function FeaturesSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-32">
      {/* Section label */}
      <div className="mb-12 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Why SciSim works
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Built for the way students <span className="italic text-primary">actually</span> learn
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          Active experimentation with immediate AI feedback outperforms passive reading by 3–5×.
          SciSim puts that principle into practice.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ backgroundColor: f.color, opacity: 0 }}
            />
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-20"
              style={{ backgroundColor: f.color }}
            />

            <div
              className="mb-4 grid size-10 place-items-center rounded-xl"
              style={{ backgroundColor: `color-mix(in oklch, ${f.color} 15%, transparent)` }}
            >
              <f.icon
                className="size-5"
                style={{ color: f.color }}
              />
            </div>

            <span
              className="mb-3 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
              style={{
                color: f.color,
                backgroundColor: `color-mix(in oklch, ${f.color} 12%, transparent)`,
              }}
            >
              {f.badge}
            </span>

            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
