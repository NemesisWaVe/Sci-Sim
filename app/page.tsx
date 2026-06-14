import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/landing/site-header'
import { LayeredGallery } from '@/components/landing/layered-gallery'
import { SubjectsSection } from '@/components/landing/subjects-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { StatsSection } from '@/components/landing/stats-section'
import { NoiseBackground } from '@/components/ui/noise-background'

export default function HomePage() {
  return (
    <main className="relative">
      <SiteHeader />
      <LayeredGallery />

      <SubjectsSection />

      <FeaturesSection />

      <StatsSection />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-28 md:px-6" id="about">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-foreground px-6 py-16 text-center text-background md:py-24">
          {/* Background particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[10%] top-[20%] size-48 rounded-full bg-physics/20 blur-[80px]" />
            <div className="absolute right-[10%] bottom-[20%] size-48 rounded-full bg-chemistry/20 blur-[80px]" />
          </div>
          <p className="relative font-mono text-xs uppercase tracking-[0.3em] text-background/60">
            Step into the lab
          </p>
          <h2 className="relative mx-auto mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Learn science by doing it, not reading it.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-background/60">
            Four experiments. One AI tutor. Endless curiosity. No sign-up required.
          </p>
          <div className="mt-8 flex justify-center">
            <NoiseBackground
              containerClassName="rounded-full mx-auto"
              gradientColors={[
                'var(--physics)',
                'var(--chemistry)',
                'var(--biology)',
                'var(--math)'
              ]}
            >
              <Link
                href="/lab"
                className="relative inline-flex items-center gap-2 rounded-full bg-background px-8 py-3.5 font-medium text-foreground transition hover:opacity-90 active:scale-95"
              >
                Open the lab
                <ArrowRight className="size-4" />
              </Link>
            </NoiseBackground>
          </div>
        </div>

      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            SciSim ® Lab
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Interactive STEM Education · AI × Science
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
            >
              GitHub
            </a>
            <Link
              href="/lab"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
            >
              Experiments
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
