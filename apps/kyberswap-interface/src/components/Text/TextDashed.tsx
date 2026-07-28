import { type CSSProperties, forwardRef } from 'react'

import { cn } from 'utils/cn'

type RebassishProps = {
  fontSize?: number | string
  fontWeight?: number | string
  color?: string
  lineHeight?: number | string
  height?: number | string
  width?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  margin?: number | string
  marginLeft?: number | string
  marginRight?: number | string
  marginTop?: number | string
  marginBottom?: number | string
  padding?: number | string
  paddingLeft?: number | string
  paddingRight?: number | string
  paddingTop?: number | string
  paddingBottom?: number | string
  sx?: CSSProperties
}

type TextDashedProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> &
  RebassishProps & {
    underlineColor?: string
  }

const REBASSISH_KEYS: ReadonlyArray<keyof RebassishProps> = [
  'fontSize',
  'fontWeight',
  'color',
  'lineHeight',
  'height',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'sx',
]

const NUMERIC_PX_KEYS = new Set<keyof RebassishProps>([
  'fontSize',
  'lineHeight',
  'height',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
])

const TextDashed = forwardRef<HTMLSpanElement, TextDashedProps>(
  ({ underlineColor, style, className, ...rest }, ref) => {
    const inline: Record<string, unknown> = {
      borderBottom: `1px dotted ${underlineColor || 'var(--ks-border)'}`,
    }
    const passthrough: Record<string, unknown> = {}
    for (const key of Object.keys(rest)) {
      const value = (rest as Record<string, unknown>)[key]
      if (value === undefined) continue
      if ((REBASSISH_KEYS as readonly string[]).includes(key)) {
        if (key === 'sx' && value && typeof value === 'object') {
          Object.assign(inline, value)
        } else if (NUMERIC_PX_KEYS.has(key as keyof RebassishProps) && typeof value === 'number') {
          inline[key] = `${value}px`
        } else {
          inline[key] = value
        }
      } else {
        passthrough[key] = value
      }
    }
    return <span ref={ref} {...passthrough} style={{ ...inline, ...style }} className={cn('w-fit', className)} />
  },
)

TextDashed.displayName = 'TextDashed'

export default TextDashed
