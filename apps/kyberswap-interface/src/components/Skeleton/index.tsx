import { type ComponentProps } from 'react'
import LoadingSkeleton from 'react-loading-skeleton'

import useTheme from 'hooks/useTheme'

type SkeletonVariant = 'light' | 'dark' | 'darkSubtle' | 'muted'

export type SkeletonProps = ComponentProps<typeof LoadingSkeleton> & {
  rounded?: boolean
  /**
   * Choose by the surrounding surface and how prominent loading should be:
   * - `light`: theme background/button colors for general card or section placeholders (Skeleton default).
   * - `dark`: stronger white overlay for placeholders that need more contrast on dark surfaces.
   * - `darkSubtle`: softer white overlay for secondary rows, token lists and banners on dark surfaces.
   * - `muted`: solid muted fill with a gentle shimmer for values updating beside existing content,
   *   such as fees or balances (PlaceholderSkeleton default).
   */
  variant?: SkeletonVariant
}

// White at 0.08 / 0.12 / 0.14 / 0.20 alpha — used as react-loading-skeleton color strings.
const WHITE_08 = '#ffffff14'
const WHITE_12 = '#ffffff1f'
const WHITE_14 = '#ffffff24'
const WHITE_20 = '#ffffff33'

const SKELETON_CONTAINER_CLASSNAME = 'ks-skeleton-container'

const Skeleton = ({
  baseColor,
  borderRadius,
  containerClassName,
  highlightColor,
  rounded = false,
  variant = 'light',
  ...props
}: SkeletonProps) => {
  const theme = useTheme()
  const mergedContainerClassName = containerClassName
    ? `${SKELETON_CONTAINER_CLASSNAME} ${containerClassName}`
    : SKELETON_CONTAINER_CLASSNAME

  const variantColors: Record<SkeletonVariant, { baseColor: string; highlightColor: string }> = {
    light: {
      baseColor: theme.background,
      highlightColor: theme.buttonGray,
    },
    dark: {
      baseColor: WHITE_12,
      highlightColor: WHITE_20,
    },
    darkSubtle: {
      baseColor: WHITE_08,
      highlightColor: WHITE_14,
    },
    muted: {
      baseColor: theme.buttonGray,
      highlightColor: `color-mix(in srgb, ${theme.buttonGray} 80%, ${theme.border})`,
    },
  }

  const colors = variantColors[variant]

  return (
    <LoadingSkeleton
      {...props}
      baseColor={baseColor ?? colors.baseColor}
      borderRadius={rounded ? 999 : borderRadius ?? 12}
      containerClassName={mergedContainerClassName}
      highlightColor={highlightColor ?? colors.highlightColor}
    />
  )
}

export default Skeleton
