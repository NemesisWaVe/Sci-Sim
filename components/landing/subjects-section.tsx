'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { SUBJECTS } from '@/lib/subjects'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'

export function SubjectsSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-32">
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            The Collection / 04
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Four labs, infinitely replayable
          </h2>
        </div>
        <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
          Each experiment is fully interactive and guided by a real AI tutor
          that reads your live readings as you go. Earn badges as you discover.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {SUBJECTS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <CardContainer className="w-full">
              <CardBody className="group/card block w-full rounded-2xl border border-border bg-card transition hover:shadow-xl hover:shadow-black/5 [transform-style:preserve-3d]">
                <Link href={`/lab/${s.id}`} className="block h-full w-full [transform-style:preserve-3d]">
                  <CardItem translateZ={30} className="relative aspect-[4/3] w-full rounded-t-2xl overflow-hidden">
                    <Image
                      src={s.image || '/placeholder.svg'}
                      alt={s.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-700 group-hover/card:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground backdrop-blur">
                      {s.index} / {s.tag}
                    </span>
                  </CardItem>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <CardItem translateZ={40} as="h3" className="text-xl font-semibold tracking-tight">
                        {s.title}
                      </CardItem>
                      <CardItem
                        translateZ={50}
                        as="span"
                        className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition group-hover/card:bg-primary group-hover/card:text-primary-foreground"
                      >
                        <ArrowUpRight className="size-4" />
                      </CardItem>
                    </div>
                    <CardItem translateZ={40} as="p" className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {s.blurb}
                    </CardItem>
                    <CardItem
                      translateZ={60}
                      as="span"
                      className="mt-4 inline-block font-mono text-[11px] uppercase tracking-widest"
                      style={{ color: s.accentVar }}
                    >
                      {s.level}
                    </CardItem>
                  </div>
                </Link>
              </CardBody>
            </CardContainer>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
