import React from 'react'

import { SKELETON_AXIS_POSITIONS } from 'components/UniswapPriceSlider/constants'
import {
  SkeletonAxisContainer,
  SkeletonAxisLabel,
  SkeletonAxisLine,
  SkeletonAxisTick,
  SkeletonCurrentPrice,
  SkeletonHandle,
  SkeletonPriceLabel,
  SkeletonRange,
  SkeletonSliderArea,
  SkeletonTrack,
  SkeletonWrapper,
} from 'components/UniswapPriceSlider/styles'

function PriceSliderSkeleton() {
  return (
    <SkeletonWrapper>
      <SkeletonSliderArea>
        <SkeletonTrack />
        <SkeletonRange />
        <SkeletonCurrentPrice />
        <SkeletonPriceLabel $isLower />
        <SkeletonPriceLabel $isLower={false} />
        <SkeletonHandle $isLower />
        <SkeletonHandle $isLower={false} />
      </SkeletonSliderArea>
      <SkeletonAxisContainer>
        <SkeletonAxisLine />
        {SKELETON_AXIS_POSITIONS.map(pos => (
          <React.Fragment key={pos}>
            <SkeletonAxisTick $position={pos} />
            <SkeletonAxisLabel $position={pos} />
          </React.Fragment>
        ))}
      </SkeletonAxisContainer>
    </SkeletonWrapper>
  )
}

export default React.memo(PriceSliderSkeleton)
