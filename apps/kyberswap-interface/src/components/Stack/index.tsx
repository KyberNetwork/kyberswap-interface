import { CSSProperties, HTMLAttributes, createElement, forwardRef } from 'react'

import { cn } from 'utils/cn'

const getSpacing = (value?: CSSProperties['gap']) => {
  if (typeof value === 'number') return `${value}px`
  return value
}

const getLength = (value?: CSSProperties['borderRadius']) => {
  if (typeof value === 'number') return `${value}px`
  return value
}

type StackStyleProps = Pick<
  CSSProperties,
  | 'alignItems'
  | 'background'
  | 'backgroundColor'
  | 'border'
  | 'borderRadius'
  | 'columnGap'
  | 'flex'
  | 'flexDirection'
  | 'flexWrap'
  | 'flexGrow'
  | 'flexShrink'
  | 'flexBasis'
  | 'gap'
  | 'justifyContent'
  | 'position'
  | 'rowGap'
  | 'padding'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingTop'
  | 'paddingBottom'
  | 'margin'
  | 'marginTop'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginRight'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'maxWidth'
  | 'minHeight'
  | 'maxHeight'
  | 'color'
  | 'fontSize'
>

export type StackProps = HTMLAttributes<HTMLDivElement> &
  StackStyleProps & {
    direction?: StackStyleProps['flexDirection']
    spacing?: StackStyleProps['gap']
    align?: StackStyleProps['alignItems']
    justify?: StackStyleProps['justifyContent']
    wrap?: StackStyleProps['flexWrap']
    // rebass passthrough — permissive
    sx?: CSSProperties | Record<string, unknown>
    m?: CSSProperties['margin']
    mt?: CSSProperties['marginTop']
    mb?: CSSProperties['marginBottom']
    ml?: CSSProperties['marginLeft']
    mr?: CSSProperties['marginRight']
    p?: CSSProperties['padding']
    px?: CSSProperties['paddingLeft']
    py?: CSSProperties['paddingTop']
    pr?: CSSProperties['paddingRight']
    pl?: CSSProperties['paddingLeft']
    pt?: CSSProperties['paddingTop']
    pb?: CSSProperties['paddingBottom']
    textAlign?: CSSProperties['textAlign']
    /** Render as a different HTML element. Rebass passthrough — limited support. */
    as?: keyof JSX.IntrinsicElements
  }

const STACK_SHORTHAND_KEYS = new Set([
  'alignItems',
  'background',
  'backgroundColor',
  'border',
  'borderRadius',
  'columnGap',
  'flex',
  'flexDirection',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'gap',
  'justifyContent',
  'position',
  'rowGap',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'color',
  'fontSize',
  'direction',
  'spacing',
  'align',
  'justify',
  'wrap',
  'sx',
  'm',
  'mt',
  'mb',
  'ml',
  'mr',
  'p',
  'px',
  'py',
  'pr',
  'pl',
  'pt',
  'pb',
  'textAlign',
  'as',
])

// Strip shorthand + className/style/children/ref so the spread can't overwrite explicit attrs.
const SPREAD_EXCLUDE_KEYS = ['className', 'style', 'children', 'ref'] as const

const stripShorthandProps = (props: StackProps): HTMLAttributes<HTMLDivElement> => {
  const rest: any = { ...props }
  for (const k of STACK_SHORTHAND_KEYS) delete rest[k]
  for (const k of SPREAD_EXCLUDE_KEYS) delete rest[k]
  return rest
}

const buildStackStyle = (p: StackProps, defaultDirection: CSSProperties['flexDirection']): CSSProperties => ({
  ...(p.sx as CSSProperties | undefined),
  flexDirection: p.direction ?? p.flexDirection ?? defaultDirection,
  alignItems: p.alignItems ?? p.align ?? 'stretch',
  justifyContent: p.justifyContent ?? p.justify ?? 'flex-start',
  flexWrap: p.flexWrap ?? p.wrap ?? 'nowrap',
  gap: getSpacing(p.gap ?? p.spacing),
  rowGap: getSpacing(p.rowGap),
  columnGap: getSpacing(p.columnGap),
  background: p.background,
  backgroundColor: p.backgroundColor,
  border: p.border,
  borderRadius: getLength(p.borderRadius),
  position: p.position,
  flex: p.flex,
  flexGrow: p.flexGrow,
  flexShrink: p.flexShrink,
  flexBasis: p.flexBasis,
  padding: p.padding ?? p.p,
  paddingLeft: p.paddingLeft ?? p.pl ?? p.px,
  paddingRight: p.paddingRight ?? p.pr ?? p.px,
  paddingTop: p.paddingTop ?? p.pt ?? p.py,
  paddingBottom: p.paddingBottom ?? p.pb ?? p.py,
  textAlign: p.textAlign,
  margin: p.margin ?? p.m,
  marginTop: p.marginTop ?? p.mt,
  marginBottom: p.marginBottom ?? p.mb,
  marginLeft: p.marginLeft ?? p.ml,
  marginRight: p.marginRight ?? p.mr,
  width: p.width,
  height: p.height,
  minWidth: p.minWidth,
  maxWidth: p.maxWidth,
  minHeight: p.minHeight,
  maxHeight: p.maxHeight,
  color: p.color,
  fontSize: p.fontSize,
})

const renderStack = (
  defaultDirection: CSSProperties['flexDirection'],
  props: StackProps,
  ref: React.Ref<HTMLDivElement>,
  overrideStyle?: CSSProperties,
) =>
  createElement(
    props.as ?? 'div',
    {
      ref,
      className: cn('flex', props.className),
      style: { ...buildStackStyle(props, defaultDirection), ...overrideStyle, ...props.style },
      ...stripShorthandProps(props),
    },
    props.children,
  )

export const Stack = forwardRef<HTMLDivElement, StackProps>((props, ref) => renderStack('column', props, ref))
Stack.displayName = 'Stack'

export const HStack = forwardRef<HTMLDivElement, StackProps>((props, ref) => renderStack('row', props, ref))
HStack.displayName = 'HStack'

export const Center = forwardRef<HTMLDivElement, StackProps>((props, ref) =>
  renderStack('column', props, ref, { alignItems: 'center', justifyContent: 'center' }),
)
Center.displayName = 'Center'
