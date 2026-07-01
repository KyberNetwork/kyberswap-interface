import React, { ButtonHTMLAttributes, CSSProperties, forwardRef } from 'react'
import { ChevronDown } from 'react-feather'

import { RowBetween } from 'components/Row'
import { cn } from 'utils/cn'

const toCssLength = (v: string | number | undefined): string | undefined => {
  if (v === undefined || v === null || v === '') return undefined
  return typeof v === 'number' ? `${v}px` : v
}

// Rebass-style shorthand props every Button variant accepts. They become inline style.
type RebassButtonShorthand = {
  padding?: string | number
  p?: string | number
  px?: string | number
  py?: string | number
  pt?: string | number
  pb?: string | number
  pl?: string | number
  pr?: string | number
  margin?: string | number
  m?: string | number
  mx?: string | number
  my?: string | number
  mt?: string | number
  mb?: string | number
  ml?: string | number
  mr?: string | number
  width?: string | number
  height?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  borderRadius?: string | number
  fontSize?: string | number
  fontWeight?: string | number
  color?: string
  backgroundColor?: string
  bg?: string
  gap?: string | number
  flex?: string | number
  sx?: CSSProperties
  textAlign?: CSSProperties['textAlign']
}

const SHORTHAND_KEYS: ReadonlyArray<keyof RebassButtonShorthand> = [
  'padding',
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'margin',
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'borderRadius',
  'fontSize',
  'fontWeight',
  'color',
  'backgroundColor',
  'bg',
  'gap',
  'flex',
  'sx',
  'textAlign',
]

const shorthandToStyle = (
  rest: Record<string, unknown>,
): { style: CSSProperties; passthrough: Record<string, unknown> } => {
  const style: CSSProperties = {}
  const passthrough: Record<string, unknown> = {}
  for (const key of Object.keys(rest)) {
    const value = rest[key]
    if (value === undefined) continue
    if ((SHORTHAND_KEYS as readonly string[]).includes(key)) {
      switch (key) {
        case 'padding':
        case 'p':
          style.padding = toCssLength(value as string | number)
          break
        case 'px':
          style.paddingLeft = toCssLength(value as string | number)
          style.paddingRight = toCssLength(value as string | number)
          break
        case 'py':
          style.paddingTop = toCssLength(value as string | number)
          style.paddingBottom = toCssLength(value as string | number)
          break
        case 'pt':
          style.paddingTop = toCssLength(value as string | number)
          break
        case 'pb':
          style.paddingBottom = toCssLength(value as string | number)
          break
        case 'pl':
          style.paddingLeft = toCssLength(value as string | number)
          break
        case 'pr':
          style.paddingRight = toCssLength(value as string | number)
          break
        case 'margin':
        case 'm':
          style.margin = toCssLength(value as string | number)
          break
        case 'mx':
          style.marginLeft = toCssLength(value as string | number)
          style.marginRight = toCssLength(value as string | number)
          break
        case 'my':
          style.marginTop = toCssLength(value as string | number)
          style.marginBottom = toCssLength(value as string | number)
          break
        case 'mt':
          style.marginTop = toCssLength(value as string | number)
          break
        case 'mb':
          style.marginBottom = toCssLength(value as string | number)
          break
        case 'ml':
          style.marginLeft = toCssLength(value as string | number)
          break
        case 'mr':
          style.marginRight = toCssLength(value as string | number)
          break
        case 'width':
        case 'height':
        case 'minWidth':
        case 'maxWidth':
          ;(style as Record<string, unknown>)[key] = toCssLength(value as string | number)
          break
        case 'borderRadius':
          style.borderRadius = toCssLength(value as string | number)
          break
        case 'fontSize':
          style.fontSize = toCssLength(value as string | number)
          break
        case 'fontWeight':
          style.fontWeight = value as CSSProperties['fontWeight']
          break
        case 'color':
          style.color = value as string
          break
        case 'backgroundColor':
        case 'bg':
          style.backgroundColor = value as string
          break
        case 'gap':
          style.gap = toCssLength(value as string | number)
          break
        case 'flex':
          style.flex = value as CSSProperties['flex']
          break
        case 'textAlign':
          style.textAlign = value as CSSProperties['textAlign']
          break
        case 'sx':
          if (value && typeof value === 'object') Object.assign(style, value as CSSProperties)
          break
      }
    } else {
      passthrough[key] = value
    }
  }
  return { style, passthrough }
}

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
  RebassButtonShorthand & {
    as?: React.ElementType
    altDisabledStyle?: boolean
    $disabled?: boolean
    to?: string
    href?: string
    target?: string
  }

type ButtonVariantClass = string | ((props: ButtonProps) => string)

// Base button defaults — sized via Tailwind classes (lower CSS precedence than styled() consumer
// overrides). Consumer-supplied shorthand props (padding, width, etc.) become inline style and
// override the Tailwind defaults at the inline-style level.
const BASE_CLASS =
  'relative z-10 flex w-full h-auto cursor-pointer items-center justify-center rounded-full border border-solid border-transparent p-3 text-center text-sm leading-[normal] font-medium text-white no-underline outline-none [&>*]:select-none hover:brightness-[1.2] disabled:cursor-auto disabled:hover:!filter-none'

const buildBase = (variantClass: ButtonVariantClass, displayName: string) => {
  const Component = forwardRef<HTMLElement, ButtonProps>(
    ({ as, className, style, $disabled, altDisabledStyle, to, href, target, ...rest }, ref) => {
      const As = (as ?? 'button') as React.ElementType
      const { style: inlineStyle, passthrough } = shorthandToStyle(rest as Record<string, unknown>)
      // Polymorphic anchor/Link-only props are restored on passthrough only when `as` is set;
      // they never reach a native <button> DOM element.
      if (as) {
        if (to !== undefined) passthrough.to = to
        if (href !== undefined) passthrough.href = href
        if (target !== undefined) passthrough.target = target
      }
      const merged: CSSProperties = { ...inlineStyle, ...style }
      const variantResolved =
        typeof variantClass === 'function'
          ? variantClass({ ...rest, $disabled, altDisabledStyle } as ButtonProps)
          : variantClass
      return (
        <As
          ref={ref}
          {...passthrough}
          style={merged}
          className={cn(BASE_CLASS, variantResolved, $disabled && 'cursor-auto hover:!filter-none', className)}
        />
      )
    },
  )
  Component.displayName = displayName
  return Component
}

// === Variants ===

export const ButtonPrimary = buildBase(
  (props: ButtonProps) =>
    cn(
      'bg-primary text-textReverse hover:text-textReverse active:shadow-[0_0_0_1pt_var(--ks-primary)] active:brightness-90',
      'disabled:!bg-buttonGray disabled:text-border disabled:!shadow-none',
      props.altDisabledStyle && 'disabled:!bg-primary disabled:!text-textReverse disabled:!opacity-50',
      props.$disabled && '!bg-buttonGray text-border !shadow-none',
    ),
  'ButtonPrimary',
)

export const ButtonWarning = buildBase(
  (props: ButtonProps) =>
    cn(
      'bg-warning text-textReverse hover:!brightness-95 active:!brightness-90',
      'disabled:!cursor-auto disabled:!bg-warning-20 disabled:!text-textReverse disabled:!shadow-none',
      props.$disabled && '!cursor-auto !bg-warning-20 !text-textReverse !shadow-none',
    ),
  'ButtonWarning',
)

// ButtonLight: background uses ${color || primary}4d (30% alpha hex). Use inline `--btn-base` so consumer-supplied color works.
export const ButtonLight = forwardRef<HTMLElement, ButtonProps>(
  ({ as, className, style, color, $disabled, altDisabledStyle: _altDisabledStyle, fontSize, ...props }, ref) => {
    const As = (as ?? 'button') as React.ElementType
    const { style: inlineStyle, passthrough } = shorthandToStyle(props as Record<string, unknown>)
    const baseColor = color || 'var(--ks-primary)'
    // Color/bg/fontSize are dynamic (depend on `color` prop) so kept inline. Sizing defaults
    // (padding, width, height, etc.) come from BASE_CLASS so consumers can override via styled().
    const dynamic: CSSProperties = {
      color: baseColor,
      backgroundColor: `color-mix(in srgb, ${baseColor} 30%, transparent)`,
      fontSize: typeof fontSize === 'number' ? `${fontSize}px` : inlineStyle.fontSize ?? '14px',
      minWidth: 'unset',
    }
    const merged: CSSProperties = { ...dynamic, ...inlineStyle, ...style }
    return (
      <As
        ref={ref}
        {...passthrough}
        style={merged}
        className={cn(
          BASE_CLASS,
          'disabled:!cursor-not-allowed disabled:!bg-buttonGray disabled:!text-border disabled:!shadow-none',
          $disabled && '!cursor-not-allowed !bg-buttonGray !text-border !shadow-none',
          className,
        )}
      />
    )
  },
)
ButtonLight.displayName = 'ButtonLight'

// ButtonOutlined: border + text color both come from `color` prop (fallback theme.border / theme.subText).
export const ButtonOutlined = forwardRef<HTMLElement, ButtonProps>(
  ({ as, className, style, color, $disabled, altDisabledStyle, ...props }, ref) => {
    const As = (as ?? 'button') as React.ElementType
    const { style: inlineStyle, passthrough } = shorthandToStyle(props as Record<string, unknown>)
    const borderColor = color || 'var(--ks-border)'
    // Sizing defaults come from BASE_CLASS; only the dynamic color/border/bg are inline.
    const dynamic: CSSProperties = {
      color: color || 'var(--ks-subText)',
      backgroundColor: 'transparent',
      border: `1px solid ${borderColor}`,
    }
    const merged: CSSProperties = { ...dynamic, ...inlineStyle, ...style }
    return (
      <As
        ref={ref}
        {...passthrough}
        style={merged}
        className={cn(
          BASE_CLASS,
          'disabled:!cursor-auto disabled:!text-border disabled:!shadow-none',
          altDisabledStyle && 'disabled:!text-white disabled:![border-color:white]',
          $disabled && '!cursor-auto !text-border !shadow-none',
          className,
        )}
      />
    )
  },
)
ButtonOutlined.displayName = 'ButtonOutlined'

export const ButtonEmpty = buildBase(
  cn('bg-transparent text-primary', 'disabled:!cursor-not-allowed disabled:!opacity-50'),
  'ButtonEmpty',
)

const ButtonConfirmedStyle = buildBase('bg-apr/20 !text-green disabled:!cursor-auto', 'ButtonConfirmedStyle')

export const ButtonErrorStyle = buildBase(
  cn(
    'bg-red !text-text [border:1px_solid_var(--ks-red)]',
    'focus:shadow-[0_0_0_1pt_var(--ks-red)] focus:brightness-95',
    'active:shadow-[0_0_0_1pt_var(--ks-red)] active:brightness-90',
    'disabled:!cursor-auto disabled:!bg-red disabled:!opacity-50 disabled:!shadow-none',
  ),
  'ButtonErrorStyle',
)

export function ButtonConfirmed({
  confirmed,
  altDisabledStyle,
  ...rest
}: { confirmed?: boolean; altDisabledStyle?: boolean } & ButtonProps) {
  if (confirmed) {
    return <ButtonConfirmedStyle {...rest} />
  }
  return <ButtonPrimary {...rest} altDisabledStyle={altDisabledStyle} />
}

export function ButtonError({ error, warning, ...rest }: { error?: boolean; warning?: boolean } & ButtonProps) {
  if (error) {
    return <ButtonErrorStyle {...rest} />
  }
  if (warning && !rest.disabled) {
    return <ButtonWarning {...rest} />
  }
  return <ButtonPrimary {...rest} />
}

export function ButtonDropdownLight({
  disabled = false,
  children,
  ...rest
}: { disabled?: boolean; children?: React.ReactNode } & ButtonProps) {
  return (
    <ButtonOutlined {...rest} disabled={disabled}>
      <RowBetween>
        <div className="flex items-center">{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonOutlined>
  )
}
