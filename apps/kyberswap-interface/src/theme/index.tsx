import React, { CSSProperties, HTMLAttributes, useMemo } from 'react'

import useTheme, { ThemeContext } from 'hooks/useTheme'
import { Colors, colors } from 'theme/color'
import { cn } from 'utils/cn'

export * from 'theme/components'

export const MEDIA_WIDTHS = {
  upToXXSmall: 420,
  upToExtraSmall: 576,
  upToSmall: 768,
  upToMedium: 992,
  upToLarge: 1200,
  upToXL: 1400,
  upToXXL: 1800,
}

function theme(): Colors {
  return colors()
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => theme(), [])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Rebass-like Text props accepted by TYPE.* wrappers. `color` accepts either a theme
// token key (e.g. 'subText') or a CSS color literal (e.g. theme.text → '#ffffff').
type CSSNumberOrString = string | number

type TextWrapperProps = Omit<HTMLAttributes<HTMLParagraphElement>, 'color'> & {
  color?: string
  fontSize?: CSSNumberOrString
  fontWeight?: CSSNumberOrString
  fontStyle?: string
  lineHeight?: CSSNumberOrString
  lineheight?: CSSNumberOrString // legacy rebass prop spelling (used by TYPE.h3 historically)
  textAlign?: CSSProperties['textAlign']
  width?: CSSNumberOrString
  padding?: CSSNumberOrString
  margin?: CSSNumberOrString
  mt?: CSSNumberOrString
  mb?: CSSNumberOrString
  ml?: CSSNumberOrString
  mr?: CSSNumberOrString
  mx?: CSSNumberOrString
  my?: CSSNumberOrString
  marginTop?: CSSNumberOrString
  marginBottom?: CSSNumberOrString
  marginLeft?: CSSNumberOrString
  marginRight?: CSSNumberOrString
}

function TextWrapper({
  color,
  fontSize,
  fontWeight,
  fontStyle,
  lineHeight,
  lineheight,
  textAlign,
  width,
  padding,
  margin,
  mt,
  mb,
  ml,
  mr,
  mx,
  my,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  className,
  style,
  ...rest
}: TextWrapperProps) {
  // Resolve color: theme key first, fall back to literal string.
  const palette = useTheme() as unknown as Record<string, string>
  const resolvedColor = color ? (palette[color] !== undefined ? palette[color] : color) : undefined

  const mergedStyle: CSSProperties = {
    ...(resolvedColor ? { color: resolvedColor } : {}),
    ...(fontSize !== undefined ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize } : {}),
    ...(fontWeight !== undefined ? { fontWeight } : {}),
    ...(fontStyle !== undefined ? { fontStyle } : {}),
    ...(lineHeight !== undefined ? { lineHeight } : {}),
    ...(lineheight !== undefined ? { lineHeight: lineheight } : {}),
    ...(textAlign !== undefined ? { textAlign } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(padding !== undefined ? { padding } : {}),
    ...(margin !== undefined ? { margin } : {}),
    ...(mt !== undefined ? { marginTop: mt } : {}),
    ...(mb !== undefined ? { marginBottom: mb } : {}),
    ...(ml !== undefined ? { marginLeft: ml } : {}),
    ...(mr !== undefined ? { marginRight: mr } : {}),
    ...(mx !== undefined ? { marginLeft: mx, marginRight: mx } : {}),
    ...(my !== undefined ? { marginTop: my, marginBottom: my } : {}),
    ...(marginTop !== undefined ? { marginTop } : {}),
    ...(marginBottom !== undefined ? { marginBottom } : {}),
    ...(marginLeft !== undefined ? { marginLeft } : {}),
    ...(marginRight !== undefined ? { marginRight } : {}),
    ...style,
  }

  return <p className={cn('m-0', className)} style={mergedStyle} {...rest} />
}

export const TYPE = {
  main(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="subText" {...props} />
  },
  link(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="primary" {...props} />
  },
  black(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="text" {...props} />
  },
  white(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="white" {...props} />
  },
  body(props: TextWrapperProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color="text" {...props} />
  },
  largeHeader(props: TextWrapperProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  subHeader(props: TextWrapperProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  h3(props: TextWrapperProps) {
    return <TextWrapper fontSize="18px" fontWeight={500} color="#E1F5FE" lineheight="21px" my={0} {...props} />
  },
  small(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  blue(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="primary" {...props} />
  },
  yellow(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="yellow1" {...props} />
  },
  warning(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="warning" {...props} />
  },
  darkGray(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="text3" {...props} />
  },
  gray(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} color="bg3" {...props} />
  },
  italic(props: TextWrapperProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle="italic" color="text2" {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextWrapperProps) {
    return <TextWrapper fontWeight={500} color={error ? 'red1' : 'text2'} {...props} />
  },
}

// Global styles (formerly FixedGlobalStyle / ThemedGlobalStyle styled-components)
// now live in src/tailwind.css under @layer base. Keep these as no-op components so
// existing JSX in src/index.tsx (<FixedGlobalStyle/>, <ThemedGlobalStyle/>) compiles.
export const FixedGlobalStyle = () => null
export const ThemedGlobalStyle = () => null
