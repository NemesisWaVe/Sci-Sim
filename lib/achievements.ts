// Achievement definitions and session-only tracking (no persistence)

export type AchievementId =
  | 'first_experiment'
  | 'equivalence_hunter'
  | 'planet_hopper'
  | 'cytologist'
  | 'perfect_focus'
  | 'speed_demon'
  | 'quiz_ace'
  | 'deep_dive'
  | 'parabola_master'
  | 'accessibility_ally'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  icon: string
  subject?: string
  unlocked: boolean
  unlockedAt?: Date
}

const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_experiment',
    title: 'First Steps',
    description: 'Started your first experiment in SciSim.',
    icon: '🔬',
  },
  {
    id: 'equivalence_hunter',
    title: 'Equivalence Hunter',
    description: 'Reached the equivalence point in the titration lab.',
    icon: '⚗️',
    subject: 'chemistry',
  },
  {
    id: 'planet_hopper',
    title: 'Planet Hopper',
    description: 'Switched gravity to at least 3 different planets.',
    icon: '🪐',
    subject: 'physics',
  },
  {
    id: 'cytologist',
    title: 'Cytologist',
    description: 'Revealed all organelles in at least one cell specimen.',
    icon: '🧬',
    subject: 'biology',
  },
  {
    id: 'perfect_focus',
    title: 'Perfect Focus',
    description: 'Reached 100% fine focus in the microscope.',
    icon: '🎯',
    subject: 'biology',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Ran the pendulum at 2× simulation speed.',
    icon: '⚡',
    subject: 'physics',
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Answered all 3 TutorBot questions correctly in one session.',
    icon: '🏆',
  },
  {
    id: 'deep_dive',
    title: 'Deep Dive',
    description: 'Spent over 5 minutes in a single experiment.',
    icon: '🏊',
  },
  {
    id: 'parabola_master',
    title: 'Parabola Master',
    description: 'Found the optimal 45° launch angle for maximum range.',
    icon: '📐',
    subject: 'math',
  },
  {
    id: 'accessibility_ally',
    title: 'Accessibility Ally',
    description: 'Used the accessibility mode.',
    icon: '♿',
  },
]

// Session-only state (resets on page refresh — no persistence needed)
const sessionUnlocked = new Set<AchievementId>()

export function getAchievements(): Achievement[] {
  return DEFAULT_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: sessionUnlocked.has(a.id),
  }))
}

export function unlockAchievement(id: AchievementId): boolean {
  if (sessionUnlocked.has(id)) return false
  sessionUnlocked.add(id)
  return true
}

export function isUnlocked(id: AchievementId): boolean {
  return sessionUnlocked.has(id)
}

export function getUnlockedCount(): number {
  return sessionUnlocked.size
}
