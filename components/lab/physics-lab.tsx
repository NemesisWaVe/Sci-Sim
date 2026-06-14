'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { LabShell } from './lab-shell'
import { LabSlider, ToggleChip, Readout } from './controls'
import { Lcd } from '@/components/lcd'
import type { Subject } from '@/lib/subjects'
import { unlockAchievement, getAchievements } from '@/lib/achievements'
import { emitAchievement } from '@/components/achievements-panel'
import { Pendulum3D } from './pendulum-3d'

const PLANETS = [
  { name: 'Earth', g: 9.8 },
  { name: 'Moon', g: 1.6 },
  { name: 'Mars', g: 3.7 },
  { name: 'Jupiter', g: 24.8 },
]

export function PhysicsLab({ subject }: { subject: Subject }) {
  const accent = subject.accentVar
  const [started, setStarted] = useState(false)

  // controls
  const [length, setLength] = useState(1.5)
  const [gravity, setGravity] = useState(9.8)
  const [mass, setMass] = useState(1)
  const [damping, setDamping] = useState(0.02)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showTrail, setShowTrail] = useState(false)
  const [showVectors, setShowVectors] = useState(false)

  // camera
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [camZoom, setCamZoom] = useState(1)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  // Speed demon achievement
  useEffect(() => {
    if (speed === 2 && started) {
      const wasNew = unlockAchievement('speed_demon')
      if (wasNew) {
        const a = getAchievements().find((x) => x.id === 'speed_demon')
        if (a) emitAchievement({ ...a, unlocked: true })
      }
    }
  }, [speed, started])

  // live readouts (state for display)
  const [metrics, setMetrics] = useState({
    period: 0,
    angle: 45,
    velocity: 0,
    ke: 0,
    pe: 0,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sim = useRef({ angle: Math.PI / 4, vel: 0, trail: [] as { x: number; y: number }[] })

  // keep latest controls in a ref for the animation loop
  const cfg = useRef({ length, gravity, mass, damping, paused, speed, showTrail, showVectors, isDark, pan, camZoom })
  cfg.current = { length, gravity, mass, damping, paused, speed, showTrail, showVectors, isDark, pan, camZoom }

  const [resetTrigger, setResetTrigger] = useState(0)

  const reset = useCallback(() => {
    setResetTrigger(v => v + 1)
  }, [])

  // The 3D component handles physics and rendering

  const getState = useCallback(
    () =>
      `length=${length}m, gravity=${gravity}m/s^2, mass=${mass}kg, damping=${damping}, period=${metrics.period.toFixed(2)}s, angle=${metrics.angle.toFixed(1)}deg, velocity=${metrics.velocity.toFixed(2)}m/s, KE=${metrics.ke.toFixed(2)}J, PE=${metrics.pe.toFixed(2)}J`,
    [length, gravity, mass, damping, metrics],
  )

  const maxE = mass * gravity * length || 1

  return (
    <LabShell
      subject={subject}
      started={started}
      onStart={() => setStarted(true)}
      getState={getState}
      greeting="Engine initialized. I'm tracking period, angle, velocity and energy in real time. Try enabling the trail to see the bob's path, or switch to Jupiter's gravity and watch the period drop."
      stage={
        <div className="h-full w-full">
          {started && (
            <Pendulum3D
              length={length}
              gravity={gravity}
              mass={mass}
              damping={damping}
              paused={paused}
              speed={speed}
              showTrail={showTrail}
              showVectors={showVectors}
              onMetricsUpdate={setMetrics}
              resetTrigger={resetTrigger}
            />
          )}
        </div>
      }
      readouts={
        started ? (
          <div className="flex flex-wrap gap-2">
            <Readout label="Period T" value={`${metrics.period.toFixed(2)}s`} accent={accent} />
            <Readout label="Angle θ" value={`${metrics.angle.toFixed(1)}°`} />
            <Readout label="Velocity" value={`${metrics.velocity.toFixed(2)} m/s`} />
            <Readout label="KE" value={`${metrics.ke.toFixed(1)} J`} />
            <Readout label="PE" value={`${metrics.pe.toFixed(1)} J`} />
          </div>
        ) : null
      }
      controls={
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Period
              </span>
              <span style={{ color: accent }}>
                <Lcd value={started ? metrics.period.toFixed(2) : '--'} className="text-lg" />
              </span>
            </div>
            <div className="flex gap-1.5">
              <ToggleChip label={paused ? 'Play' : 'Pause'} active={!paused} onClick={() => setPaused((p) => !p)} disabled={!started} accent={accent} />
              <ToggleChip label="Reset" active={false} onClick={reset} disabled={!started} accent={accent} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <LabSlider label="Length" value={length} display={`${length.toFixed(1)} m`} min={0.5} max={3} step={0.1} onChange={setLength} disabled={!started} accent={accent} />
            <LabSlider label="Gravity" value={gravity} display={`${gravity.toFixed(1)} m/s²`} min={1} max={25} step={0.1} onChange={setGravity} disabled={!started} accent={accent} />
            <LabSlider label="Mass" value={mass} display={`${mass.toFixed(1)} kg`} min={0.5} max={5} step={0.1} onChange={setMass} disabled={!started} accent={accent} />
            <LabSlider label="Damping" value={damping} display={damping.toFixed(3)} min={0} max={0.1} step={0.001} onChange={setDamping} disabled={!started} accent={accent} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Planet gravity</span>
            <div className="flex flex-wrap gap-1.5">
              {PLANETS.map((p) => (
                <ToggleChip key={p.name} label={p.name} active={Math.abs(gravity - p.g) < 0.05} onClick={() => setGravity(p.g)} disabled={!started} accent={accent} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              <ToggleChip label="Trail" active={showTrail} onClick={() => setShowTrail((v) => !v)} disabled={!started} accent={accent} />
              <ToggleChip label="Vectors" active={showVectors} onClick={() => setShowVectors((v) => !v)} disabled={!started} accent={accent} />
            </div>
            <div className="flex gap-1.5">
              {[0.5, 1, 2].map((sp) => (
                <ToggleChip key={sp} label={`${sp}×`} active={speed === sp} onClick={() => setSpeed(sp)} disabled={!started} accent={accent} />
              ))}
            </div>
          </div>

          {/* energy bars */}
          <div className="flex flex-col gap-2">
            <EnergyBar label="Kinetic" value={metrics.ke} max={maxE} color="#fbbf24" />
            <EnergyBar label="Potential" value={metrics.pe} max={maxE} color={accent} />
            <EnergyBar label="Total" value={metrics.ke + metrics.pe} max={maxE} color="#34d399" />
          </div>
        </div>
      }
    />
  )
}

function EnergyBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 5) return
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.stroke()
  const a = Math.atan2(dy, dx)
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 10 * Math.cos(a - 0.4), y2 - 10 * Math.sin(a - 0.4))
  ctx.lineTo(x2 - 10 * Math.cos(a + 0.4), y2 - 10 * Math.sin(a + 0.4))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.fillStyle = color
  ctx.font = 'bold 12px monospace'
  ctx.fillText(label, x2 + 6, y2 - 4)
}
