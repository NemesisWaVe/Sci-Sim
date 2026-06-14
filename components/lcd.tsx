import { cn } from '@/lib/utils'

const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const

const CHAR_MAP: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'c', 'd', 'e'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
}

/**
 * Seven-segment style LCD readout. Digits render as glowing segments while
 * other characters (units, decimals) fall back to a mono glyph.
 */
export function Lcd({
  value,
  className,
}: {
  value: string | number
  className?: string
}) {
  const str = String(value)
  return (
    <span className={cn('lcd', className)} aria-label={str}>
      {str.split('').map((char, i) => {
        const active = CHAR_MAP[char]
        if (!active) {
          return (
            <span key={i} className="lcd-char">
              {char}
            </span>
          )
        }
        return (
          <span key={i} className="lcd-digit">
            {SEGMENTS.map((seg) => (
              <span
                key={seg}
                className={cn(
                  'lcd-seg',
                  seg === 'a' || seg === 'd' || seg === 'g' ? 'h' : 'v',
                  seg,
                  active.includes(seg) && 'on',
                )}
              />
            ))}
          </span>
        )
      })}
    </span>
  )
}
