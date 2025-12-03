import React from 'react';

import { Skeleton } from '@kyber/ui';

import { SKELETON_AXIS_POSITIONS } from '@/constants';

/**
 * Skeleton loading state for the price slider
 * Uses Skeleton component from @kyber/ui for shimmer animation
 */
function PriceSliderSkeleton() {
  return (
    <div className="ks-ps-style" style={{ width: '100%', overflow: 'hidden' }}>
      {/* Slider Area */}
      <div className="relative w-full h-[60px] mt-5">
        {/* Track */}
        <Skeleton className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-sm" />

        {/* Range */}
        <Skeleton className="absolute top-1/2 left-[25%] w-1/2 h-1 -translate-y-1/2" />

        {/* Current Price Marker */}
        <Skeleton className="absolute top-1/2 left-1/2 w-0.5 h-[15px] -translate-x-1/2 -translate-y-1/2" />

        {/* Lower Price Label */}
        <Skeleton
          className="absolute top-1 w-[60px] h-3.5"
          style={{
            left: '25%',
            transform: 'translateX(calc(-100% - 12px))',
          }}
        />

        {/* Upper Price Label */}
        <Skeleton
          className="absolute top-1 w-[60px] h-3.5"
          style={{
            left: '75%',
            transform: 'translateX(12px)',
          }}
        />

        {/* Lower Handle */}
        <Skeleton
          className="absolute top-1/2 w-2 h-[35px] rounded-md -translate-x-1/2 -translate-y-1/2"
          style={{ left: '25%' }}
        />

        {/* Upper Handle */}
        <Skeleton
          className="absolute top-1/2 w-2 h-[35px] rounded-md -translate-x-1/2 -translate-y-1/2"
          style={{ left: '75%' }}
        />
      </div>

      {/* Axis Container */}
      <div className="relative w-full h-6 -mt-2">
        {/* Axis Line */}
        <Skeleton className="absolute top-0 left-0 right-0 h-px" />

        {/* Axis Ticks and Labels */}
        {SKELETON_AXIS_POSITIONS.map((pos, index) => {
          const isFirst = index === 0;
          const isLast = index === SKELETON_AXIS_POSITIONS.length - 1;
          const alignClass = isFirst ? 'left-0' : isLast ? 'right-0' : '-translate-x-1/2';

          return (
            <React.Fragment key={pos}>
              {/* Tick */}
              <Skeleton className="absolute top-0 w-px h-1.5 -translate-x-1/2" style={{ left: `${pos}%` }} />
              {/* Label */}
              <Skeleton
                className={`absolute top-2 w-[35px] h-2.5 ${alignClass}`}
                style={isFirst ? { left: 0 } : isLast ? { right: 0 } : { left: `${pos}%` }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(PriceSliderSkeleton);
