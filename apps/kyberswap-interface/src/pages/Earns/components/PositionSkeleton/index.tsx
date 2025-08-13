import Skeleton from 'react-loading-skeleton'

import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { SkeletonText, SkeletonWrapper } from 'pages/Earns/components/PositionSkeleton/styles'

const PositionSkeleton = ({
  width,
  height,
  style,
  text,
  tooltip,
  tooltipWidth,
}: {
  width: number
  height: number
  style?: React.CSSProperties
  text?: string
  tooltip?: string
  tooltipWidth?: number
}) => {
  const theme = useTheme()

  const skeleton = !text ? (
    <Skeleton
      width={width}
      height={height}
      baseColor={theme.background}
      highlightColor={theme.buttonGray}
      borderRadius="1rem"
      style={style}
    />
  ) : (
    <SkeletonWrapper>
      <Skeleton
        width={width}
        height={height}
        baseColor={theme.background}
        highlightColor={theme.buttonGray}
        borderRadius="1rem"
        style={style}
      />
      <SkeletonText>{text}</SkeletonText>
    </SkeletonWrapper>
  )

  return tooltip ? (
    <MouseoverTooltip text={tooltip} width={tooltipWidth ? `${tooltipWidth}px` : undefined}>
      {skeleton}
    </MouseoverTooltip>
  ) : (
    skeleton
  )
}

export default PositionSkeleton
