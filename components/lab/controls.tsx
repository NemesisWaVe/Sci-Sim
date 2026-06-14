'use client'

import { cn } from '@/lib/utils'

export function LabSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  onPointerDown,
  onPointerUp,
  disabled,
  accent,
}: {
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  onPointerDown?: () => void
  onPointerUp?: () => void
  disabled?: boolean
  accent: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', disabled && 'opacity-50')}>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums" style={{ color: accent }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-[var(--accent-c)] disabled:cursor-not-allowed"
        style={{ ['--accent-c' as string]: accent }}
      />
    </div>
  )
}

export function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  accent,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
  accent: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', disabled && 'opacity-50')}>
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed',
                active
                  ? 'border-transparent text-white'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
              )}
              style={active ? { backgroundColor: accent } : undefined}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ToggleChip({
  label,
  active,
  onClick,
  disabled,
  accent,
}: {
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
  accent: string
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-transparent text-white'
          : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground',
      )}
      style={active ? { backgroundColor: accent } : undefined}
    >
      {label}
    </button>
  )
}

export function Readout({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className="font-mono text-sm font-bold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  )
}
