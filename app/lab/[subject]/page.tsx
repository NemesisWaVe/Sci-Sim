import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSubject, SUBJECTS } from '@/lib/subjects'
import { PhysicsLab } from '@/components/lab/physics-lab'
import { ChemistryLab } from '@/components/lab/chemistry-lab'
import { BiologyLab } from '@/components/lab/biology-lab'
import { MathLab } from '@/components/lab/math-lab'

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>
}): Promise<Metadata> {
  const { subject } = await params
  const s = getSubject(subject)
  if (!s) return { title: 'Not found — SciSim' }
  return {
    title: `${s.title} — SciSim`,
    description: s.blurb,
  }
}

export default async function LabSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject } = await params
  const s = getSubject(subject)
  if (!s) notFound()

  if (s.id === 'physics') return <PhysicsLab subject={s} />
  if (s.id === 'chemistry') return <ChemistryLab subject={s} />
  if (s.id === 'math') return <MathLab subject={s} />
  return <BiologyLab subject={s} />
}
