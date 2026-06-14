'use client'

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LabShell } from './lab-shell'
import { LabSlider, ToggleGroup, ToggleChip, Readout } from './controls'
import { Lcd } from '@/components/lcd'
import type { Subject } from '@/lib/subjects'
import { unlockAchievement, getAchievements } from '@/lib/achievements'
import { emitAchievement } from '@/components/achievements-panel'

type SpecimenId = 'plant' | 'animal' | 'bacteria'
type Light = 'bright' | 'dark' | 'fluorescent'

interface Organelle {
  id: string
  label: string
  desc: string
  x: number
  y: number
  revealAt: number
  color: string
}

const SPECIMENS: Record<
  SpecimenId,
  { name: string; image: string; blurb: string; organelles: Organelle[] }
> = {
  plant: {
    name: 'Plant Cell',
    image: '/specimens/plant.png',
    blurb:
      'Rigid cell wall, large central vacuole, and chloroplasts for photosynthesis.',
    organelles: [
      { id: 'wall', label: 'Cell Wall', desc: 'Rigid cellulose layer giving the cell its shape.', x: 14, y: 20, revealAt: 100, color: '#7dd3a0' },
      { id: 'vacuole', label: 'Central Vacuole', desc: 'Stores water and maintains turgor pressure.', x: 50, y: 52, revealAt: 220, color: '#5fb3d4' },
      { id: 'nucleus', label: 'Nucleus', desc: 'Houses DNA and directs cell activity.', x: 70, y: 34, revealAt: 320, color: '#c98bdb' },
      { id: 'chloroplast', label: 'Chloroplast', desc: 'Captures light energy to make glucose.', x: 32, y: 68, revealAt: 420, color: '#4ade80' },
    ],
  },
  animal: {
    name: 'Animal Cell',
    image: '/specimens/animal.png',
    blurb:
      'No cell wall — a flexible membrane with mitochondria and a defined nucleus.',
    organelles: [
      { id: 'membrane', label: 'Cell Membrane', desc: 'Flexible boundary controlling what enters and exits.', x: 16, y: 22, revealAt: 100, color: '#f0a3c0' },
      { id: 'nucleus', label: 'Nucleus', desc: 'Control center containing genetic material.', x: 52, y: 48, revealAt: 240, color: '#c98bdb' },
      { id: 'mito', label: 'Mitochondria', desc: 'Powerhouse — produces ATP through respiration.', x: 72, y: 66, revealAt: 360, color: '#fb923c' },
      { id: 'ribosome', label: 'Ribosomes', desc: 'Tiny machines that synthesize proteins.', x: 30, y: 70, revealAt: 460, color: '#fbbf24' },
    ],
  },
  bacteria: {
    name: 'Bacteria',
    image: '/specimens/bacteria.png',
    blurb:
      'Prokaryote — no membrane-bound nucleus; DNA floats freely in the cytoplasm.',
    organelles: [
      { id: 'wall', label: 'Cell Wall', desc: 'Protective layer; basis of Gram staining.', x: 22, y: 30, revealAt: 120, color: '#a78bfa' },
      { id: 'nucleoid', label: 'Nucleoid', desc: 'Region where the circular DNA is concentrated.', x: 55, y: 50, revealAt: 280, color: '#f472b6' },
      { id: 'flagellum', label: 'Flagellum', desc: 'Whip-like tail used for movement.', x: 78, y: 64, revealAt: 420, color: '#60a5fa' },
    ],
  },
}

const LIGHT_FILTERS: Record<Light, string> = {
  bright: 'none',
  dark: 'brightness(0.55) contrast(1.4)',
  fluorescent: 'hue-rotate(60deg) saturate(1.6) brightness(1.1)',
}

export function BiologyLab({ subject }: { subject: Subject }) {
  const accent = subject.accentVar
  const [started, setStarted] = useState(false)

  const [specimenId, setSpecimenId] = useState<SpecimenId>('plant')
  const [zoom, setZoom] = useState(100)
  const [focus, setFocus] = useState(80)
  const [light, setLight] = useState<Light>('bright')
  const [selected, setSelected] = useState<string | null>(null)

  const specimen = SPECIMENS[specimenId]
  const visible = useMemo(
    () => specimen.organelles.filter((o) => zoom >= o.revealAt),
    [specimen, zoom],
  )

  const blur = Math.max(0, (100 - focus) / 12)
  const scale = zoom / 100
  const selectedOrg = specimen.organelles.find((o) => o.id === selected)

  // Cytologist: all organelles revealed
  useEffect(() => {
    if (started && visible.length === specimen.organelles.length && specimen.organelles.length > 0) {
      const wasNew = unlockAchievement('cytologist')
      if (wasNew) {
        const a = getAchievements().find((x) => x.id === 'cytologist')
        if (a) emitAchievement({ ...a, unlocked: true })
      }
    }
  }, [started, visible.length, specimen.organelles.length])

  // Perfect focus: fine focus at 100%
  useEffect(() => {
    if (started && focus === 100) {
      const wasNew = unlockAchievement('perfect_focus')
      if (wasNew) {
        const a = getAchievements().find((x) => x.id === 'perfect_focus')
        if (a) emitAchievement({ ...a, unlocked: true })
      }
    }
  }, [started, focus])

  const getState = useCallback(
    () =>
      `specimen=${specimen.name}, magnification=${zoom}x, focus=${focus}%, illumination=${light}, visibleOrganelles=[${visible.map((o) => o.label).join(', ') || 'none yet'}]`,
    [specimen.name, zoom, focus, light, visible],
  )

  return (
    <LabShell
      subject={subject}
      started={started}
      onStart={() => setStarted(true)}
      getState={getState}
      greeting="Microscope online. Increase magnification to progressively reveal organelles, switch the illumination, and click any marker to read its function. Try comparing a plant cell with a bacterium."
      stage={
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="relative aspect-square h-full max-h-[440px]">
            {/* eyepiece ring */}
            <div className="absolute inset-0 rounded-full border-4 border-border bg-black/5 shadow-[0_0_0_10px_rgba(0,0,0,0.1),inset_0_0_60px_rgba(0,0,0,0.2)] dark:bg-black dark:shadow-[0_0_0_10px_rgba(0,0,0,0.45),inset_0_0_60px_rgba(0,0,0,0.9)]" />
            <div 
              className="absolute inset-3 overflow-hidden rounded-full"
              onWheel={(e) => {
                e.preventDefault()
                setZoom((z) => Math.max(100, Math.min(500, z - e.deltaY * 0.5)))
              }}
            >
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                drag
                dragConstraints={{ left: -400, right: 400, top: -400, bottom: 400 }}
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              >
                <div className="absolute inset-0" style={{ filter: `blur(${blur}px) ${LIGHT_FILTERS[light]}` }}>
                <Image
                  src={specimen.image || '/placeholder.svg'}
                  alt={`${specimen.name} under the microscope`}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="440px"
                  crossOrigin="anonymous"
                  draggable={false}
                />
                </div>

                {started &&
                  visible.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(o.id)
                      }}
                      className="group absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${o.x}%`, top: `${o.y}%` }}
                      aria-label={o.label}
                    >
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1 / scale, opacity: 1 }} // inverse scale so dot doesn't get huge
                        className="block size-4 rounded-full ring-2 ring-white/70"
                        style={{ backgroundColor: o.color }}
                      />
                      <span 
                        className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ transform: `translateX(-50%) scale(${1 / scale})`, transformOrigin: 'top center' }}
                      >
                        {o.label}
                      </span>
                    </button>
                  ))}
              </motion.div>

              <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,0.3)] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]" />
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/10 dark:bg-white/10" />
              <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        </div>
      }
      readouts={
        started ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Mag
              </span>
              <span style={{ color: accent }}>
                <Lcd value={`${zoom}`} className="text-base" />
              </span>
            </div>
            <Readout label="Specimen" value={specimen.name} />
            <Readout label="In view" value={`${visible.length} parts`} />
            {selectedOrg && (
              <span
                className="rounded-xl border px-3 py-2 font-mono text-xs"
                style={{
                  borderColor: `${selectedOrg.color}66`,
                  color: selectedOrg.color,
                  backgroundColor: `${selectedOrg.color}1a`,
                }}
              >
                {selectedOrg.label}
              </span>
            )}
          </div>
        ) : null
      }
      controls={
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleGroup
              label="Specimen"
              value={specimenId}
              onChange={(v) => {
                setSpecimenId(v)
                setSelected(null)
                setZoom(100)
              }}
              disabled={!started}
              accent={accent}
              options={[
                { value: 'plant', label: 'Plant' },
                { value: 'animal', label: 'Animal' },
                { value: 'bacteria', label: 'Bacteria' },
              ]}
            />
            <ToggleGroup
              label="Illumination"
              value={light}
              onChange={setLight}
              disabled={!started}
              accent={accent}
              options={[
                { value: 'bright', label: 'Bright field' },
                { value: 'dark', label: 'Dark field' },
                { value: 'fluorescent', label: 'Fluorescent' },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <LabSlider
              label="Magnification"
              value={zoom}
              display={`${zoom}×`}
              min={100}
              max={500}
              step={10}
              onChange={setZoom}
              disabled={!started}
              accent={accent}
            />
            <LabSlider
              label="Fine focus"
              value={focus}
              display={`${focus}%`}
              min={0}
              max={100}
              step={1}
              onChange={setFocus}
              disabled={!started}
              accent={accent}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Quick zoom
            </span>
            {[100, 250, 400, 500].map((z) => (
              <ToggleChip
                key={z}
                label={`${z}×`}
                active={zoom === z}
                onClick={() => setZoom(z)}
                disabled={!started}
                accent={accent}
              />
            ))}
            <ToggleChip
              label="Auto-focus"
              active={focus === 100}
              onClick={() => setFocus(100)}
              disabled={!started}
              accent={accent}
            />
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Field notes
            </p>
            {selectedOrg ? (
              <div className="mt-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: selectedOrg.color }}
                  />
                  {selectedOrg.label}
                </p>
                <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {selectedOrg.desc}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground">
                {specimen.blurb} Raise magnification to reveal organelles, then
                click a marker to inspect it.
              </p>
            )}
          </div>
        </div>
      }
    />
  )
}
