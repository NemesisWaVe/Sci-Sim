import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { SUBJECTS } from '@/lib/subjects'
import { ThemeToggle } from '@/components/theme-toggle'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { NoiseBackground } from '@/components/ui/noise-background'

export const metadata: Metadata = {
  title: 'The Lab — SciSim',
  description: 'Choose an experiment and start exploring.',
}

export default function LabHubPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <header className="flex items-center justify-between px-4 py-5 md:px-8">
        <Link
          href="/"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-foreground transition hover:bg-secondary"
        >
          <div className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-overlay">
             <NoiseBackground />
          </div>
          <ArrowLeft className="relative z-10 size-3.5" />
          <span className="relative z-10">Home</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hidden sm:inline-block">
            SciSim ® Lab
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-6 md:pt-16">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Experiment Index
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
            What do you want to study today?
          </h1>
          <p className="mt-5 max-w-lg text-pretty leading-relaxed text-muted-foreground">
            Four labs. One AI tutor per experiment. Tweak variables, earn
            achievement badges, and watch the science respond in real time.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {SUBJECTS.map((s) => (
            <CardContainer key={s.id} className="inter-var w-full p-0">
              <CardBody className="group/card relative h-full w-full flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 transition-all">
                <Link href={`/lab/${s.id}`} className="flex flex-1 flex-col h-full w-full">
                  <CardItem translateZ="50" className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={s.image || '/placeholder.svg'}
                      alt={s.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-700 group-hover/card:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span
                      className="absolute left-3 top-3 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white shadow-sm"
                      style={{ backgroundColor: s.accentVar }}
                    >
                      {s.tag}
                    </span>
                  </CardItem>

                  <div className="flex flex-1 flex-col p-5">
                    <CardItem translateZ="30" as="h3" className="text-xl font-semibold tracking-tight">
                      {s.title}
                    </CardItem>
                    
                    <CardItem translateZ="40" as="p" className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {s.blurb}
                    </CardItem>
                    
                    <CardItem translateZ="60" className="mt-5 flex w-full items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        {s.level}
                      </span>
                      <span className="grid size-9 place-items-center rounded-full bg-secondary text-foreground transition group-hover/card:bg-primary group-hover/card:text-primary-foreground relative overflow-hidden">
                        <ArrowUpRight className="relative z-10 size-4" />
                      </span>
                    </CardItem>
                  </div>
                </Link>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </section>
    </main>
  )
}
