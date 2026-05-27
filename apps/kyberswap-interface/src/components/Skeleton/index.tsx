import { rgba } from 'polished'
import { type ComponentProps } from 'react'
import LoadingSkeleton from 'react-loading-skeleton'
import { createGlobalStyle } from 'styled-components'

import useTheme from 'hooks/useTheme'

type SkeletonVariant = 'light' | 'dark' | 'darkSubtle'

export type SkeletonProps = ComponentProps<typeof LoadingSkeleton> & {
  variant?: SkeletonVariant
}

const SKELETON_CONTAINER_CLASSNAME = 'ks-skeleton-container'

const SkeletonGlobalStyle = createGlobalStyle`
  .${SKELETON_CONTAINER_CLASSNAME} {
    display: block;
    line-height: 0;
  }
`

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
      baseColor: rgba('#fff', 0.12),
      highlightColor: rgba('#fff', 0.2),
    },
    darkSubtle: {
      baseColor: rgba('#fff', 0.08),
      highlightColor: rgba('#fff', 0.14),
    },
  }

  const colors = variantColors[variant]

  return (
    <>
      <SkeletonGlobalStyle />
      <LoadingSkeleton
        {...props}
        baseColor={baseColor ?? colors.baseColor}
        borderRadius={borderRadius ?? 12}
        containerClassName={mergedContainerClassName}
        highlightColor={highlightColor ?? colors.highlightColor}
      />
    </>
  )
}

export default Skeleton
