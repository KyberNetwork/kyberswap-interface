import { type ComponentProps } from 'react'
import LoadingSkeleton from 'react-loading-skeleton'

import useSkeletonWidth, { type SkeletonWidthProps } from 'components/Skeleton/useSkeletonWidth'
import useTheme from 'hooks/useTheme'

type SkeletonVariant = 'light' | 'dark' | 'darkSubtle' | 'muted'

export type SkeletonProps = ComponentProps<typeof LoadingSkeleton> &
  SkeletonWidthProps & {
    rounded?: boolean
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
  randomWidth,
  rounded = false,
  variant = 'light',
  width,
  widthSeed,
  ...props
}: SkeletonProps) => {
  const theme = useTheme()
  const resolvedWidth = useSkeletonWidth({ width, randomWidth, widthSeed })
  const mergedContainerClassName = containerClassName
    ? `${SKELETON_CONTAINER_CLASSNAME} ${containerClassName}`
    : SKELETON_CONTAINER_CLASSNAME

  const variantColors: Record<SkeletonVariant, { baseColor: string; highlightColor: string }> = {
    light: {
      baseColor: `var(--ks-skeleton-base-color, ${theme.background})`,
      highlightColor: `var(--ks-skeleton-highlight-color, ${theme.buttonGray})`,
    },
    muted: {
      baseColor: theme.buttonGray,
      highlightColor: `color-mix(in srgb, ${theme.buttonGray} 80%, ${theme.border})`,
    },
    dark: {
      baseColor: WHITE_12,
      highlightColor: WHITE_20,
    },
    darkSubtle: {
      baseColor: WHITE_08,
      highlightColor: WHITE_14,
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
      width={resolvedWidth}
    />
  )
}

export default Skeleton
