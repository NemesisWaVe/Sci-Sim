'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LabShell } from './lab-shell'
import { LabSlider, ToggleGroup, ToggleChip, Readout } from './controls'
import { Lcd } from '@/components/lcd'
import type { Subject } from '@/lib/subjects'
import { unlockAchievement } from '@/lib/achievements'
import { Projectile3D } from './projectile-3d'

const GRAVITY_PRESETS = [
  { name: 'Earth', g: 9.8 },
  { name: 'Moon', g: 1.62 },
  { name: 'Mars', g: 3.72 },
  { name: 'Jupiter', g: 24.79 },
]

interface Metrics {
  range: number
  maxHeight: number
  timeOfFlight: number
  vx: number
  vy: number
  currentX: number
  currentY: number
}

export function MathLab({ subject }: { subject: Subject }) {
  const accent = subject.accentVar
  const [started, setStarted] = useState(false)

  const [angle, setAngle] = useState(45)
  const [velocity, setVelocity] = useState(20)
  const [gravity, setGravity] = useState(9.8)
  const [showFormula, setShowFormula] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showComponents, setShowComponents] = useState(false)
  const [isLaunched, setIsLaunched] = useState(false)
  const [planetsVisited, setPlanetsVisited] = useState<Set<string>>(new Set(['Earth']))

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const tRef = useRef<number>(0)
  const [progress, setProgress] = useState(0)
  const [metrics, setMetrics] = useState<Metrics>({
    range: 0, maxHeight: 0, timeOfFlight: 0, vx: 0, vy: 0, currentX: 0, currentY: 0,
  })

  const cfg = useRef({ angle, velocity, gravity, showFormula, showGrid, showComponents })
  cfg.current = { angle, velocity, gravity, showFormula, showGrid, showComponents }

  function computeMetrics(a: number, v: number, g: number): Metrics {
    const rad = (a * Math.PI) / 180
    const vx = v * Math.cos(rad)
    const vy = v * Math.sin(rad)
    const T = (2 * vy) / g
    const R = (v * v * Math.sin(2 * rad)) / g
    const H = (vy * vy) / (2 * g)
    return { range: R, maxHeight: H, timeOfFlight: T, vx, vy, currentX: 0, currentY: 0 }
  }

  const staticMetrics = computeMetrics(angle, velocity, gravity)



  function launch() {
    if (!started) return
    setIsLaunched(true)
    tRef.current = 0
    cancelAnimationFrame(animRef.current)

    const rad = (cfg.current.angle * Math.PI) / 180
    const vy0 = cfg.current.velocity * Math.sin(rad)
    const T = (2 * vy0) / cfg.current.gravity
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = (now - startTime) / 1000
      const prog = Math.min(elapsed / T, 1)
      setProgress(prog)
      if (prog < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setIsLaunched(false)
        // achievement check
        if (Math.abs(cfg.current.angle - 45) < 1) {
          unlockAchievement('parabola_master')
        }
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }

  function reset() {
    cancelAnimationFrame(animRef.current)
    setIsLaunched(false)
    setProgress(0)
  }

  // Redraw static when params change (not launched)
  useEffect(() => {
    if (!isLaunched) setProgress(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, velocity, gravity, showFormula, showGrid, showComponents, started])

  useEffect(() => {
    if (started) setProgress(0)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  function handlePlanetChange(name: string) {
    const preset = GRAVITY_PRESETS.find((p) => p.name === name)
    if (preset) {
      setGravity(preset.g)
      const next = new Set(planetsVisited).add(name)
      setPlanetsVisited(next)
      if (next.size >= 3) unlockAchievement('planet_hopper')
    }
    reset()
  }

  const getState = useCallback(
    () =>
      `angle=${angle}°, velocity=${velocity}m/s, gravity=${gravity}m/s², range=${staticMetrics.range.toFixed(2)}m, maxHeight=${staticMetrics.maxHeight.toFixed(2)}m, timeOfFlight=${staticMetrics.timeOfFlight.toFixed(2)}s, vx=${staticMetrics.vx.toFixed(2)}m/s, vy0=${staticMetrics.vy.toFixed(2)}m/s`,
    [angle, velocity, gravity, staticMetrics],
  )

  return (
    <LabShell
      subject={subject}
      started={started}
      onStart={() => setStarted(true)}
      getState={getState}
      greeting="Projectile cannon primed! Adjust the angle and velocity, then hit Launch to fire. Try 45° for maximum range — I'll explain why it's optimal using calculus. Switch planets to see how gravity reshapes every trajectory."
      stage={
        <div className="h-full w-full">
          <Projectile3D
            angle={angle}
            velocity={velocity}
            gravity={gravity}
            isLaunched={isLaunched}
            progress={progress}
            showComponents={showComponents}
            showGrid={showGrid}
          />
        </div>
      }
      readouts={
        started ? (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Range</span>
              <span style={{ color: accent }}><Lcd value={staticMetrics.range.toFixed(1)} className="text-base" /></span>
              <span className="font-mono text-[9px] text-muted-foreground">m</span>
            </div>
            <Readout label="Max Height" value={`${staticMetrics.maxHeight.toFixed(1)} m`} accent={accent} />
            <Readout label="Flight Time" value={`${staticMetrics.timeOfFlight.toFixed(2)} s`} />
            <Readout label="vₓ" value={`${staticMetrics.vx.toFixed(1)} m/s`} />
            <Readout label="vᵧ₀" value={`${staticMetrics.vy.toFixed(1)} m/s`} />
            {Math.abs(angle - 45) < 1 && (
              <span className="rounded-xl border border-violet-400/40 bg-violet-400/15 px-3 py-2 font-mono text-xs text-violet-300">
                ⭐ Max range angle!
              </span>
            )}
          </div>
        ) : null
      }
      controls={
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Range</span>
              <span style={{ color: accent }}>
                <Lcd value={started ? staticMetrics.range.toFixed(1) : '--'} className="text-lg" />
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">m</span>
            </div>
            <div className="flex gap-1.5">
              <ToggleChip
                label="🚀 Launch"
                active={isLaunched}
                onClick={launch}
                disabled={!started || isLaunched}
                accent={accent}
              />
              <ToggleChip label="Reset" active={false} onClick={reset} disabled={!started} accent={accent} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <LabSlider
              label="Launch Angle"
              value={angle}
              display={`${angle}°`}
              min={1}
              max={89}
              step={1}
              onChange={(v) => { setAngle(v); reset() }}
              disabled={!started}
              accent={accent}
            />
            <LabSlider
              label="Initial Velocity"
              value={velocity}
              display={`${velocity} m/s`}
              min={5}
              max={50}
              step={1}
              onChange={(v) => { setVelocity(v); reset() }}
              disabled={!started}
              accent={accent}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Planet gravity</span>
            <div className="flex flex-wrap gap-1.5">
              {GRAVITY_PRESETS.map((p) => (
                <ToggleChip
                  key={p.name}
                  label={p.name}
                  active={Math.abs(gravity - p.g) < 0.05}
                  onClick={() => handlePlanetChange(p.name)}
                  disabled={!started}
                  accent={accent}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Angle presets</span>
            <div className="flex flex-wrap gap-1.5">
              {[15, 30, 45, 60, 75].map((a) => (
                <ToggleChip
                  key={a}
                  label={`${a}°`}
                  active={angle === a}
                  onClick={() => { setAngle(a); reset() }}
                  disabled={!started}
                  accent={accent}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <ToggleChip label="Formula" active={showFormula} onClick={() => setShowFormula((v) => !v)} disabled={!started} accent={accent} />
            <ToggleChip label="Grid" active={showGrid} onClick={() => setShowGrid((v) => !v)} disabled={!started} accent={accent} />
            <ToggleChip label="Components" active={showComponents} onClick={() => setShowComponents((v) => !v)} disabled={!started} accent={accent} />
          </div>

          {/* Energy / range comparison bars */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Range vs angle</span>
            <div className="flex gap-1">
              {[15, 30, 45, 60, 75].map((a) => {
                const r = (velocity * velocity * Math.sin((2 * a * Math.PI) / 180)) / gravity
                const maxR = (velocity * velocity) / gravity
                const pct = (r / maxR) * 100
                return (
                  <div key={a} className="flex flex-1 flex-col items-center gap-1">
                    <div className="h-12 w-full overflow-hidden rounded-sm bg-secondary">
                      <div
                        className="w-full rounded-sm transition-[height] duration-300"
                        style={{ height: `${pct}%`, backgroundColor: a === 45 ? accent : 'rgba(139,92,246,0.4)', marginTop: `${100 - pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground">{a}°</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      }
    />
  )
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string, label: string,
) {
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
  ctx.font = 'bold 11px monospace'
  ctx.fillText(label, x2 + 6, y2 - 4)
}
