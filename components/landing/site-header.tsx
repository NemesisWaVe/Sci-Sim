import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NoiseBackground } from '@/components/ui/noise-background'

export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between p-4 md:p-6">
      <Link
        href="/"
        className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 backdrop-blur transition hover:bg-card"
      >
        <img src="/gallery/logo.jpeg" alt="Sci Sim Logo" className="size-6 rounded-md object-cover" />
        <div className="flex items-center">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-foreground">
            SciSim
          </span>
          <span className="ml-2 hidden sm:inline-block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            ® Lab
          </span>
        </div>
      </Link>

      <nav className="pointer-events-auto flex items-center gap-2">
        <a
          href="/#about"
          className="hidden rounded-xl border border-border bg-card/70 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur transition hover:text-foreground sm:block"
        >
          About
        </a>
        
        <NoiseBackground
          containerClassName="rounded-xl hidden sm:block p-[1px]"
          gradientColors={['var(--physics)', 'var(--chemistry)', 'var(--biology)', 'var(--math)']}
        >
          <Link
            href="/lab"
            className="flex h-full w-full items-center justify-center rounded-[11px] bg-card/80 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground backdrop-blur transition hover:bg-card/40"
          >
            Experiments
          </Link>
        </NoiseBackground>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="grid size-11 place-items-center rounded-xl border border-border bg-card/70 text-muted-foreground backdrop-blur transition hover:bg-card hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </a>
        <ThemeToggle />
      </nav>

    </header>
  )
}
