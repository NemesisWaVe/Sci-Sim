'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, ChevronRight } from 'lucide-react'
import { getAchievements, type Achievement } from '@/lib/achievements'
import { cn } from '@/lib/utils'

interface AchievementToast {
  id: string
  achievement: Achievement
}

// Global event bus for achievement unlocks
const listeners = new Set<(a: Achievement) => void>()

export function emitAchievement(achievement: Achievement) {
  listeners.forEach((fn) => fn(achievement))
}

export function useAchievementEvents(onUnlock: (a: Achievement) => void) {
  useEffect(() => {
    listeners.add(onUnlock)
    return () => { listeners.delete(onUnlock) }
  }, [onUnlock])
}

export function AchievementsPanel({ highContrast = false }: { highContrast?: boolean }) {
  const [toasts, setToasts] = useState<AchievementToast[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])

  const handleUnlock = useCallback((a: Achievement) => {
    const toast: AchievementToast = { id: `${a.id}-${Date.now()}`, achievement: a }
    setToasts((prev) => [...prev, toast])
    setAchievements(getAchievements())
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
    }, 4500)
  }, [])

  useAchievementEvents(handleUnlock)

  useEffect(() => {
    setAchievements(getAchievements())
  }, [])

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <>
      {/* Achievement toasts */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="flex items-center gap-3 rounded-2xl border border-yellow-400/30 bg-background/95 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur"
            >
              <span className="text-2xl">{toast.achievement.icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
                  Achievement Unlocked!
                </p>
                <p className="text-sm font-medium text-foreground">{toast.achievement.title}</p>
                <p className="text-[11px] text-muted-foreground">{toast.achievement.description}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating trophy button */}
      <button
        onClick={() => { setPanelOpen(true); setAchievements(getAchievements()) }}
        className={cn(
          'fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 shadow-lg backdrop-blur transition hover:bg-card',
          highContrast && 'border-2 border-foreground/50',
        )}
        aria-label="View achievements"
      >
        <Trophy className="size-4 text-yellow-400" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground">
          {unlockedCount}/{achievements.length}
        </span>
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setPanelOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto border-r border-border bg-background p-6 shadow-2xl"
              aria-label="Achievements panel"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold tracking-tight">Achievements</h2>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  aria-label="Close achievements"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Progress ring */}
              <div className="mt-6 flex items-center gap-4">
                <div className="relative size-16">
                  <svg viewBox="0 0 64 64" className="size-full -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
                    <circle
                      cx="32" cy="32" r="26"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={`${(unlockedCount / achievements.length) * 163.4} 163.4`}
                      strokeLinecap="round"
                      className="text-yellow-400 transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-foreground">
                    {unlockedCount}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{unlockedCount} of {achievements.length} unlocked</p>
                  <p className="text-xs text-muted-foreground">Keep experimenting to earn more!</p>
                </div>
              </div>

              {/* Achievement list */}
              <div className="mt-6 flex flex-col gap-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-all',
                      a.unlocked
                        ? 'border-yellow-400/30 bg-yellow-400/8 opacity-100'
                        : 'border-border bg-card/40 opacity-50 grayscale',
                    )}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold', a.unlocked ? 'text-foreground' : 'text-muted-foreground')}>
                        {a.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{a.description}</p>
                    </div>
                    {a.unlocked && <ChevronRight className="size-3.5 shrink-0 text-yellow-400" />}
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
