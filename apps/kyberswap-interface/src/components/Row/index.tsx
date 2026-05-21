import { CSSProperties, HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

// Rebass-style passthrough props preserved for migration compatibility.
// New code should prefer `className` and Tailwind utilities.
type RebassShorthandProps = {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  minHeight?: CSSProperties['minHeight']
  maxHeight?: CSSProperties['maxHeight']
  minWidth?: CSSProperties['minWidth']
  maxWidth?: CSSProperties['maxWidth']
  padding?: CSSProperties['padding']
  margin?: CSSProperties['margin']
  m?: CSSProperties['margin']
  mt?: CSSProperties['marginTop']
  mb?: CSSProperties['marginBottom']
  ml?: CSSProperties['marginLeft']
  mr?: CSSProperties['marginRight']
  mx?: CSSProperties['marginLeft']
  my?: CSSProperties['marginTop']
  marginTop?: CSSProperties['marginTop']
  marginBottom?: CSSProperties['marginBottom']
  marginLeft?: CSSProperties['marginLeft']
  marginRight?: CSSProperties['marginRight']
  marginX?: CSSProperties['marginLeft']
  marginY?: CSSProperties['marginTop']
  p?: CSSProperties['padding']
  px?: CSSProperties['paddingLeft']
  py?: CSSProperties['paddingTop']
  flex?: CSSProperties['flex']
  flexDirection?: CSSProperties['flexDirection']
  flexWrap?: CSSProperties['flexWrap']
  flexGrow?: CSSProperties['flexGrow']
  flexShrink?: CSSProperties['flexShrink']
  flexBasis?: CSSProperties['flexBasis']
  alignItems?: CSSProperties['alignItems']
  justifyContent?: CSSProperties['justifyContent']
  backgroundColor?: CSSProperties['backgroundColor']
  background?: CSSProperties['background']
  color?: CSSProperties['color']
  fontSize?: CSSProperties['fontSize']
  position?: CSSProperties['position']
  // rebass theme-aware style alias. Permissive type for migration; treated as plain CSSProperties.
  sx?: CSSProperties | Record<string, unknown>
}

type RowProps = HTMLAttributes<HTMLDivElement> &
  RebassShorthandProps & {
    align?: CSSProperties['alignItems']
    justify?: CSSProperties['justifyContent']
    border?: string
    borderRadius?: string
    gap?: string
  }

const ROW_SHORTHAND_KEYS = [
  'width',
  'height',
  'minHeight',
  'maxHeight',
  'minWidth',
  'maxWidth',
  'padding',
  'margin',
  'm',
  'mt',
  'mb',
  'ml',
  'mr',
  'mx',
  'my',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginX',
  'marginY',
  'p',
  'px',
  'py',
  'flex',
  'flexDirection',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignItems',
  'justifyContent',
  'backgroundColor',
  'background',
  'color',
  'fontSize',
  'position',
  'border',
  'borderRadius',
  'gap',
  'align',
  'justify',
  'sx',
] as const

const mapShorthandToStyle = (p: RowProps): CSSProperties => ({
  ...(p.sx as CSSProperties | undefined),
  width: p.width,
  height: p.height,
  minHeight: p.minHeight,
  maxHeight: p.maxHeight,
  minWidth: p.minWidth,
  maxWidth: p.maxWidth,
  padding: p.padding ?? p.p,
  paddingLeft: p.px,
  paddingRight: p.px,
  paddingTop: p.py,
  paddingBottom: p.py,
  margin: p.margin ?? p.m,
  marginTop: p.marginTop ?? p.mt ?? p.marginY ?? p.my,
  marginBottom: p.marginBottom ?? p.mb ?? p.marginY ?? p.my,
  marginLeft: p.marginLeft ?? p.ml ?? p.marginX ?? p.mx,
  marginRight: p.marginRight ?? p.mr ?? p.marginX ?? p.mx,
  flex: p.flex,
  flexDirection: p.flexDirection,
  flexWrap: p.flexWrap,
  flexGrow: p.flexGrow,
  flexShrink: p.flexShrink,
  flexBasis: p.flexBasis,
  alignItems: p.alignItems ?? p.align,
  justifyContent: p.justifyContent ?? p.justify,
  backgroundColor: p.backgroundColor,
  background: p.background,
  color: p.color,
  fontSize: p.fontSize,
  position: p.position,
  border: p.border,
  borderRadius: p.borderRadius,
  gap: p.gap,
})

// Strip shorthand + className/style/children/ref so the spread can't overwrite
// the explicit attrs we set on the div.
const SPREAD_EXCLUDE_KEYS = ['className', 'style', 'children', 'ref'] as const

const stripShorthandProps = (props: RowProps): HTMLAttributes<HTMLDivElement> => {
  const rest: any = { ...props }
  for (const k of ROW_SHORTHAND_KEYS) delete rest[k]
  for (const k of SPREAD_EXCLUDE_KEYS) delete rest[k]
  return rest
}

const makeRow = (baseClassName: string, defaults: CSSProperties, displayName: string) => {
  const Component = forwardRef<HTMLDivElement, RowProps>((props, ref) => {
    const { className, style } = props
    const shorthand = mapShorthandToStyle(props)
    // Apply defaults only when consumer didn't override (rebass parity).
    const merged: CSSProperties = {
      width: shorthand.width ?? defaults.width,
      alignItems: shorthand.alignItems ?? defaults.alignItems,
      justifyContent: shorthand.justifyContent ?? defaults.justifyContent,
      ...Object.fromEntries(
        Object.entries(shorthand).filter(
          ([k, v]) => v !== undefined && !['width', 'alignItems', 'justifyContent'].includes(k),
        ),
      ),
      ...style,
    }
    return <div ref={ref} className={cn(baseClassName, className)} style={merged} {...stripShorthandProps(props)} />
  })
  Component.displayName = displayName
  return Component
}

const Row = makeRow('flex p-0', { width: '100%', alignItems: 'center', justifyContent: 'flex-start' }, 'Row')
export default Row

export const RowBetween = makeRow(
  'flex p-0',
  { width: '100%', alignItems: 'center', justifyContent: 'space-between' },
  'RowBetween',
)

export const AutoRow = forwardRef<HTMLDivElement, RowProps>((props, ref) => {
  const shorthand = mapShorthandToStyle(props)
  const gap = props.gap
  const merged: CSSProperties = {
    width: shorthand.width ?? '100%',
    alignItems: shorthand.alignItems ?? 'center',
    justifyContent: shorthand.justifyContent,
    ...Object.fromEntries(
      Object.entries(shorthand).filter(
        ([k, v]) => v !== undefined && !['width', 'alignItems', 'justifyContent', 'margin', 'gap'].includes(k),
      ),
    ),
    margin: gap ? `-${gap}` : shorthand.margin,
    ['--row-gap' as never]: gap,
    ...props.style,
  }
  return (
    <div
      ref={ref}
      className={cn('flex flex-wrap p-0', gap && '[&>*]:!m-[var(--row-gap)]', props.className)}
      style={merged}
      {...stripShorthandProps(props)}
    />
  )
})
AutoRow.displayName = 'AutoRow'

export const RowFixed = forwardRef<HTMLDivElement, RowProps>((props, ref) => {
  const shorthand = mapShorthandToStyle(props)
  const gap = props.gap
  const merged: CSSProperties = {
    alignItems: shorthand.alignItems ?? 'center',
    ...Object.fromEntries(
      Object.entries(shorthand).filter(([k, v]) => v !== undefined && !['alignItems', 'margin', 'width'].includes(k)),
    ),
    margin: gap ? `-${gap}` : shorthand.margin,
    ...props.style,
  }
  return (
    <div ref={ref} className={cn('flex w-fit p-0', props.className)} style={merged} {...stripShorthandProps(props)} />
  )
})
RowFixed.displayName = 'RowFixed'

export const RowFit = makeRow(
  'flex w-fit p-0',
  { width: 'fit-content', alignItems: 'center', justifyContent: 'flex-start' },
  'RowFit',
)
