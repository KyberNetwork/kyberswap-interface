import { type ComponentProps } from 'react'
import LoadingSkeleton from 'react-loading-skeleton'
import { createGlobalStyle } from 'styled-components'

import useTheme from 'hooks/useTheme'

export type SkeletonProps = ComponentProps<typeof LoadingSkeleton>

const SKELETON_CONTAINER_CLASSNAME = 'ks-skeleton-container'

const SkeletonGlobalStyle = createGlobalStyle`
  .${SKELETON_CONTAINER_CLASSNAME} {
    display: block;
    line-height: 0;
  }
`

const Skeleton = ({ baseColor, borderRadius, containerClassName, highlightColor, ...props }: SkeletonProps) => {
  const theme = useTheme()
  const mergedContainerClassName = containerClassName
    ? `${SKELETON_CONTAINER_CLASSNAME} ${containerClassName}`
    : SKELETON_CONTAINER_CLASSNAME

  return (
    <>
      <SkeletonGlobalStyle />
      <LoadingSkeleton
        {...props}
        baseColor={baseColor ?? theme.background}
        borderRadius={borderRadius ?? 12}
        containerClassName={mergedContainerClassName}
        highlightColor={highlightColor ?? theme.buttonGray}
      />
    </>
  )
}

export default Skeleton
