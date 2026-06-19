import { type ComponentProps } from 'react'
import LoadingSkeleton from 'react-loading-skeleton'

import useTheme from 'hooks/useTheme'

type SkeletonVariant = 'light' | 'dark' | 'darkSubtle'

export type SkeletonProps = ComponentProps<typeof LoadingSkeleton> & {
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
  }

  const colors = variantColors[variant]

  return (
    <LoadingSkeleton
      {...props}
      baseColor={baseColor ?? colors.baseColor}
      borderRadius={borderRadius ?? 12}
      containerClassName={mergedContainerClassName}
      highlightColor={highlightColor ?? colors.highlightColor}
    />
  )
}

export default Skeleton
