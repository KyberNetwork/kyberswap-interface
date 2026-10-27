import { useId } from 'react'

export type SkeletonWidthProps = {
  width?: number | string
  /** Vary up to `width` (default 100%) while keeping the result stable across renders. */
  randomWidth?: boolean
  /** Optional item key for stable widths across list reordering and remounts. */
  widthSeed?: number | string
}

// Reuses the balance placeholder's existing 40 / 48 / 56 / 64px variation at width={64}.
const WIDTH_FACTORS = [0.625, 0.75, 0.875, 1] as const

/** Usage: <Skeleton width={80} randomWidth />. No random values are generated during render. */
const useSkeletonWidth = ({ width, randomWidth, widthSeed }: SkeletonWidthProps) => {
  const id = useId()
  if (!randomWidth) return width

  const seed = widthSeed ?? id
  const hash =
    typeof seed === 'number'
      ? Math.abs(Math.trunc(seed))
      : Array.from(seed).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)

  const factor = WIDTH_FACTORS[hash % WIDTH_FACTORS.length]
  return typeof width === 'number' ? Math.round(width * factor) : `calc(${width ?? '100%'} * ${factor})`
}

export default useSkeletonWidth
