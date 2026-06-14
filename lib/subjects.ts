export type SubjectId = 'physics' | 'chemistry' | 'biology' | 'math'

export interface Subject {
  id: SubjectId
  index: string
  tag: string
  title: string
  blurb: string
  level: string
  image: string
  accentClass: string
  accentVar: string
}

export const SUBJECTS: Subject[] = [
  {
    id: 'physics',
    index: '01',
    tag: 'Physics',
    title: 'Pendulum Dynamics',
    blurb:
      'Master simple harmonic motion. Tune mass, length, and gravity to uncover how period, energy, and force vectors evolve in real time.',
    level: 'Beginner Friendly',
    image: '/gallery/physics.png',
    accentClass: 'text-physics',
    accentVar: 'var(--physics)',
  },
  {
    id: 'chemistry',
    index: '02',
    tag: 'Chemistry',
    title: 'Acid-Base Titration',
    blurb:
      'Run a virtual titration with precision. Add base drop by drop, watch the pH curve build, and catch the exact moment of neutralization.',
    level: 'Intermediate',
    image: '/gallery/chemistry.png',
    accentClass: 'text-chemistry',
    accentVar: 'var(--chemistry)',
  },
  {
    id: 'biology',
    index: '03',
    tag: 'Biology',
    title: 'Microscopic Worlds',
    blurb:
      'Zoom into the cellular level. Reveal organelles progressively as magnification climbs and switch illumination to see hidden structures.',
    level: 'Advanced',
    image: '/gallery/biology.png',
    accentClass: 'text-biology',
    accentVar: 'var(--biology)',
  },
  {
    id: 'math',
    index: '04',
    tag: 'Mathematics',
    title: 'Projectile Motion',
    blurb:
      'Launch projectiles across worlds. Discover how angle, velocity, and gravity shape every parabola — from the peak to the landing.',
    level: 'Intermediate',
    image: '/gallery/maths.png',
    accentClass: 'text-math',
    accentVar: 'var(--math)',
  },
]

// Extra abstract panels used purely as visual depth in the landing gallery.
export const GALLERY_PANELS: string[] = [
  '/gallery/biology.png',
  '/gallery/dna.png',
  '/gallery/chemistry.png',
  '/gallery/crystal.png',
  '/gallery/physics.png',
  '/gallery/cosmos.png',
]

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}
