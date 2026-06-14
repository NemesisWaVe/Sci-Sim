'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LabShell } from './lab-shell'
import { LabSlider, ToggleGroup, ToggleChip, Readout } from './controls'
import { Lcd } from '@/components/lcd'
import type { Subject } from '@/lib/subjects'
import { unlockAchievement, getAchievements } from '@/lib/achievements'
import { emitAchievement } from '@/components/achievements-panel'
import { Flask3D } from './flask-3d'

type Acid = 'hcl' | 'ch3cooh'
type Indicator = 'phenolphthalein' | 'methylorange' | 'bromothymol' | 'universal'
type Mode = 'sandbox' | 'challenge'

const ACID_VOL = 25.0

function computePH(acid: Acid, acidConc: number, baseConc: number, baseVol: number) {
  let pH = 1
  if (acid === 'hcl') {
    const molesAcid = ACID_VOL * acidConc
    const molesBase = baseVol * baseConc
    const totalVol = ACID_VOL + baseVol
    if (molesBase < molesAcid) pH = -Math.log10((molesAcid - molesBase) / totalVol)
    else if (Math.abs(molesBase - molesAcid) < 0.0001) pH = 7
    else pH = 14 + Math.log10((molesBase - molesAcid) / totalVol)
  } else {
    const pKa = 4.76
    const Ka = Math.pow(10, -pKa)
    const molesAcid = ACID_VOL * acidConc
    const molesBase = baseVol * baseConc
    if (baseVol === 0) pH = -Math.log10(Math.sqrt(Ka * acidConc))
    else if (molesBase < molesAcid) pH = pKa + Math.log10(molesBase / (molesAcid - molesBase))
    else if (Math.abs(molesBase - molesAcid) < 0.0001) {
      const Kb = 1e-14 / Ka
      const saltConc = molesAcid / (ACID_VOL + baseVol)
      pH = 14 + Math.log10(Math.sqrt(Kb * saltConc))
    } else pH = 14 + Math.log10((molesBase - molesAcid) / (ACID_VOL + baseVol))
  }
  return Math.max(0, Math.min(14, pH))
}

function indicatorColor(indicator: Indicator, pH: number): { rgb: string; opacity: number } {
  let r = 255, g = 255, b = 255, opacity = 0.85
  if (indicator === 'phenolphthalein') {
    if (pH < 8.2) { opacity = 0.12 }
    else if (pH < 10) { const o = (pH - 8.2) / 1.8; r = 236; g = 72; b = 153; opacity = 0.12 + o * 0.7 }
    else { r = 236; g = 72; b = 153 }
  } else if (indicator === 'methylorange') {
    if (pH < 3.1) { r = 239; g = 68; b = 68 }
    else if (pH < 4.4) { r = 249; g = 115; b = 22 }
    else { r = 250; g = 204; b = 21 }
  } else if (indicator === 'bromothymol') {
    if (pH < 6) { r = 250; g = 204; b = 21 }
    else if (pH < 7.6) { r = 34; g = 197; b = 94 }
    else { r = 59; g = 130; b = 246 }
  } else {
    if (pH < 3) { r = 239; g = 68; b = 68 }
    else if (pH < 6) { r = 249; g = 115; b = 22 }
    else if (pH < 8) { r = 34; g = 197; b = 94 }
    else if (pH < 11) { r = 59; g = 130; b = 246 }
    else { r = 139; g = 92; b = 246 }
  }
  return { rgb: `${r}, ${g}, ${b}`, opacity }
}

export function ChemistryLab({ subject }: { subject: Subject }) {
  const accent = subject.accentVar
  const [started, setStarted] = useState(false)

  const [acid, setAcid] = useState<Acid>('hcl')
  const [indicator, setIndicator] = useState<Indicator>('phenolphthalein')
  const [mode, setMode] = useState<Mode>('sandbox')
  const [acidConc, setAcidConc] = useState(0.5)
  const [baseConc, setBaseConc] = useState(0.5)
  const [baseVol, setBaseVol] = useState(0)
  const [challengeConc, setChallengeConc] = useState(0.5)
  const [drips, setDrips] = useState<number[]>([])

  const graphRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<{ vol: number; pH: number }[]>([])

  const [isSliding, setIsSliding] = useState(false)

  const effectiveAcidConc = mode === 'challenge' ? challengeConc : acidConc
  const pH = useMemo(
    () => computePH(acid, effectiveAcidConc, baseConc, baseVol),
    [acid, effectiveAcidConc, baseConc, baseVol],
  )
  const color = indicatorColor(indicator, pH)
  const atEquivalence = Math.abs(pH - 7) < 0.5

  // Equivalence hunter achievement
  useEffect(() => {
    if (atEquivalence && started) {
      const wasNew = unlockAchievement('equivalence_hunter')
      if (wasNew) {
        const a = getAchievements().find((x) => x.id === 'equivalence_hunter')
        if (a) emitAchievement({ ...a, unlocked: true })
      }
    }
  }, [atEquivalence, started])

  // reset graph data when parameters change
  useEffect(() => {
    dataRef.current = []
  }, [acid, indicator, mode, acidConc, baseConc, challengeConc])

  // accumulate the titration curve
  useEffect(() => {
    if (!started) return
    dataRef.current = dataRef.current.filter((p) => p.vol < baseVol)
    dataRef.current.push({ vol: baseVol, pH })
    drawGraph()
  }, [started, baseVol, pH])

  const drawGraph = useCallback(() => {
    const canvas = graphRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(30, 12)
    ctx.lineTo(30, H - 24)
    ctx.lineTo(W - 12, H - 24)
    ctx.stroke()
    ctx.fillStyle = 'rgba(200,200,210,0.6)'
    ctx.font = '11px monospace'
    ctx.fillText('14', 8, 18)
    ctx.fillText('7', 14, (H - 12) / 2)
    ctx.fillText('0', 14, H - 26)
    ctx.fillText('50 mL', W - 50, H - 8)
    // curve
    const pts = dataRef.current
    if (pts.length) {
      ctx.strokeStyle = '#e07b53'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      pts.forEach((p, i) => {
        const x = 30 + (p.vol / 50) * (W - 42)
        const y = 12 + (1 - p.pH / 14) * (H - 36)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
  }, [])

  useEffect(() => {
    drawGraph()
  }, [drawGraph, started])

  function addDrop() {
    if (!started) return
    setBaseVol((v) => Math.min(50, Math.round((v + 0.1) * 10) / 10))
    const id = Date.now() + Math.random()
    setDrips((d) => [...d, id])
    setTimeout(() => setDrips((d) => d.filter((x) => x !== id)), 600)
  }

  function startNewChallenge() {
    setChallengeConc(Math.floor(Math.random() * 90 + 5) / 100)
    setBaseVol(0)
    dataRef.current = []
  }

  const getState = useCallback(
    () =>
      `acid=${acid === 'hcl' ? 'HCl (strong)' : 'CH3COOH (weak)'}, indicator=${indicator}, mode=${mode}, acidConc=${mode === 'challenge' ? 'unknown' : acidConc.toFixed(2) + 'M'}, baseConc=${baseConc.toFixed(2)}M, baseAdded=${baseVol.toFixed(1)}mL, currentPH=${pH.toFixed(2)}, atEquivalence=${atEquivalence}`,
    [acid, indicator, mode, acidConc, baseConc, baseVol, pH, atEquivalence],
  )

  return (
    <LabShell
      subject={subject}
      started={started}
      onStart={() => { setStarted(true); if (mode === 'challenge') startNewChallenge() }}
      getState={getState}
      greeting="Lab ready. The beaker holds 25 mL of acid. Add base drop by drop and watch the pH curve build toward the equivalence point. Try Challenge Mode to identify an unknown concentration."
      stage={
        <div className="flex h-full w-full items-stretch gap-3 p-4 overflow-hidden">
          {/* apparatus */}
          <div className="relative flex w-1/2 items-end justify-center">
            {/* 3D Canvas */}
            <div className="absolute inset-0 z-0">
               <Flask3D color={`rgb(${color.rgb})`} colorOpacity={color.opacity} baseVol={baseVol} drips={drips} isStreaming={isSliding} />
            </div>
          </div>
          {/* graph */}
          <div className="flex w-1/2 flex-col z-10 pointer-events-none">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              pH vs. Volume
            </p>
            <div className="flex-1 overflow-hidden rounded-xl border border-border bg-background/40 backdrop-blur-md">
              <canvas ref={graphRef} width={360} height={260} className="h-full w-full" />
            </div>
          </div>
        </div>
      }
      readouts={
        started ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">pH</span>
              <span style={{ color: accent }}><Lcd value={pH.toFixed(2)} className="text-base" /></span>
            </div>
            <Readout label="Base added" value={`${baseVol.toFixed(1)} mL`} />
            {atEquivalence && (
              <span className="rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-3 py-2 font-mono text-xs text-emerald-300">
                Equivalence point reached
              </span>
            )}
          </div>
        ) : null
      }
      controls={
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <LabSlider
              label="Base added (NaOH)"
              value={baseVol}
              display={`${baseVol.toFixed(1)} mL`}
              min={0}
              max={50}
              step={0.1}
              onChange={setBaseVol}
              onPointerDown={() => setIsSliding(true)}
              onPointerUp={() => setIsSliding(false)}
              disabled={!started}
              accent={accent}
            />
            <div className="flex gap-2">
              <ToggleChip 
                label="Reset" 
                onClick={() => { setBaseVol(0); setDrips([]); dataRef.current = []; drawGraph(); }} 
                disabled={!started || baseVol === 0} 
                accent="#ef4444" 
              />
              <ToggleChip label="+ Add Drop" active onClick={addDrop} disabled={!started} accent={accent} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleGroup
              label="Mode"
              value={mode}
              onChange={(m) => { setMode(m); setBaseVol(0); if (m === 'challenge') startNewChallenge() }}
              disabled={!started}
              accent={accent}
              options={[
                { value: 'sandbox', label: 'Sandbox' },
                { value: 'challenge', label: 'Challenge' },
              ]}
            />
            <ToggleGroup
              label="Acid"
              value={acid}
              onChange={(a) => { setAcid(a); setBaseVol(0) }}
              disabled={!started}
              accent={accent}
              options={[
                { value: 'hcl', label: 'HCl' },
                { value: 'ch3cooh', label: 'CH₃COOH' },
              ]}
            />
          </div>

          <ToggleGroup
            label="Indicator"
            value={indicator}
            onChange={(i) => { setIndicator(i); setBaseVol(0) }}
            disabled={!started}
            accent={accent}
            options={[
              { value: 'phenolphthalein', label: 'Phenolphthalein' },
              { value: 'methylorange', label: 'Methyl Orange' },
              { value: 'bromothymol', label: 'Bromothymol' },
              { value: 'universal', label: 'Universal' },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <LabSlider
              label="Acid concentration"
              value={mode === 'challenge' ? challengeConc : acidConc}
              display={mode === 'challenge' ? '??? M' : `${acidConc.toFixed(2)} M`}
              min={0.05}
              max={1}
              step={0.01}
              onChange={setAcidConc}
              disabled={!started || mode === 'challenge'}
              accent={accent}
            />
            <LabSlider
              label="Base concentration"
              value={baseConc}
              display={`${baseConc.toFixed(2)} M`}
              min={0.05}
              max={1}
              step={0.01}
              onChange={(v) => { setBaseConc(v); setBaseVol(0) }}
              disabled={!started}
              accent={accent}
            />
          </div>
        </div>
      }
    />
  )
}
