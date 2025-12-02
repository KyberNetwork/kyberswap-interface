import styled, { keyframes } from 'styled-components'

// ============================================
// Skeleton Animation
// ============================================

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 2px;
`

// ============================================
// Skeleton Components
// ============================================

export const SkeletonWrapper = styled.div`
  width: 100%;
  overflow: hidden;
`

export const SkeletonSliderArea = styled.div`
  position: relative;
  width: 100%;
  height: 60px;
  margin: 20px 0 0 0;
`

export const SkeletonTrack = styled(SkeletonBase)`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  transform: translateY(-50%);
`

export const SkeletonRange = styled(SkeletonBase)`
  position: absolute;
  top: 50%;
  left: 25%;
  width: 50%;
  height: 4px;
  transform: translateY(-50%);
`

export const SkeletonHandle = styled(SkeletonBase)<{ $isLower: boolean }>`
  position: absolute;
  top: 50%;
  left: ${props => (props.$isLower ? '25%' : '75%')};
  transform: translate(-50%, -50%);
  width: 8px;
  height: 35px;
  border-radius: 6px;
`

export const SkeletonPriceLabel = styled(SkeletonBase)<{ $isLower: boolean }>`
  position: absolute;
  top: 4px;
  left: ${props => (props.$isLower ? '25%' : '75%')};
  transform: ${props => (props.$isLower ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)')};
  width: 60px;
  height: 14px;
`

export const SkeletonCurrentPrice = styled(SkeletonBase)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 15px;
`

export const SkeletonAxisContainer = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  margin-top: -8px;
`

export const SkeletonAxisLine = styled(SkeletonBase)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
`

export const SkeletonAxisTick = styled(SkeletonBase)<{ $position: number }>`
  position: absolute;
  top: 0;
  left: ${props => props.$position}%;
  transform: translateX(-50%);
  width: 1px;
  height: 6px;
`

export const SkeletonAxisLabel = styled(SkeletonBase)<{ $position: number }>`
  position: absolute;
  top: 8px;
  left: ${props => props.$position}%;
  transform: translateX(-50%);
  width: 35px;
  height: 10px;
`

// ============================================
// Main Slider Styles
// ============================================

export const SliderContainer = styled.div`
  width: 100%;
  overflow: hidden;
`

export const SliderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 60px;
  margin: 20px 0 0 0;
  overflow: hidden;
`

export const SliderTrack = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  background: #3a3a3a;
  transform: translateY(-50%);
  border-radius: 2px;
`

export const SliderRange = styled.div.attrs<{ $left: number; $width: number }>(props => ({
  style: {
    left: `${props.$left}%`,
    width: `${props.$width}%`,
  },
}))<{ $left: number; $width: number }>`
  position: absolute;
  top: 50%;
  height: 4px;
  background: linear-gradient(90deg, #31cb9e 0%, #7289da 100%);
  transform: translateY(-50%);
  border-radius: 2px;
`

// ============================================
// Handle Styles
// ============================================

export const Handle = styled.div.attrs<{ $position: number }>(props => ({
  style: {
    left: `${props.$position}%`,
  },
}))<{ $position: number }>`
  position: absolute;
  top: 0;
  transform: translate(-50%, 1%);
  cursor: grab;
  z-index: 10;
  touch-action: none; /* Prevent scroll while dragging on touch devices */

  &:active {
    cursor: grabbing;
  }

  svg {
    display: block;
  }
`

export const PriceLabel = styled.div.attrs<{ $position: number; $isLower: boolean }>(props => ({
  style: {
    left: `${props.$position}%`,
    transform: props.$isLower ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
  },
}))<{ $position: number; $isLower: boolean }>`
  position: absolute;
  top: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
`

// ============================================
// Current Price Marker
// ============================================

export const CurrentPriceMarker = styled.div.attrs<{ $position: number }>(props => ({
  style: {
    left: `${props.$position}%`,
  },
}))<{ $position: number }>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 15px;
  background: #888;
  border-radius: 2px;
  z-index: 5;

  &::after {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #888;
  }
`

// ============================================
// Price Axis Styles
// ============================================

export const PriceAxisContainer = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  margin-top: -8px;
`

export const PriceAxisLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #3a3a3a;
`

export const PriceAxisTick = styled.div.attrs<{ $position: number }>(props => ({
  style: {
    left: `${props.$position}%`,
  },
}))<{ $position: number }>`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  width: 1px;
  height: 6px;
  background: #555;
`

export const PriceAxisLabel = styled.div.attrs<{ $position: number }>(props => ({
  style: {
    left: `${props.$position}%`,
  },
}))<{ $position: number }>`
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  color: #888;
  font-size: 10px;
  white-space: nowrap;
  user-select: none;
`
