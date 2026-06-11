import { CSSProperties } from 'react'

import Skeleton from 'components/Skeleton'

type Props = {
  content: React.ReactNode
  isShowingSkeleton: boolean
  skeletonStyle?: CSSProperties
}

const ValueWithLoadingSkeleton: React.FC<Props> = ({ content, isShowingSkeleton, skeletonStyle }) => {
  if (isShowingSkeleton) {
    const { height = '20px', ...style } = skeletonStyle || {}

    return <Skeleton style={style} height={height} variant="darkSubtle" />
  }

  return content
}

export default ValueWithLoadingSkeleton
