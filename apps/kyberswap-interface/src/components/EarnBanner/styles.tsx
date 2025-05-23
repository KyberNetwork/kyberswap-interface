import { Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { ReactComponent as MoveBackSvg } from 'assets/svg/ic_move_back.svg'
import { ReactComponent as MoveForwardSvg } from 'assets/svg/ic_move_forward.svg'

// TrendingBanner
export const TrendingWrapper = styled.div`
  width: 100%;
  padding: 12px 16px;
  gap: 8px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;

  border: 1px solid transparent;
  background: linear-gradient(#1d5b49, #1d5b49) padding-box,
    linear-gradient(135deg, #4ec7a2 0%, #1d5b49 40%, #1d5b49 60%, #4ec7a2 100%) border-box;
  backdrop-filter: blur(2px);
`

export const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

export const PoolWrapper = styled.div<{ animate: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  ${({ animate }) =>
    animate &&
    css`
      animation: ${pulse} 0.6s;
    `}
`

export const PoolAprWrapper = styled.div`
  border-radius: 20px;
  box-shadow: 0 8px 8px 0 rgba(0, 0, 0, 0.3);
  padding-bottom: 1px;
  width: auto;
  overflow: hidden;
  background-image: linear-gradient(to right, #66666600, #66666600, #a2e9d4, #66666600, #66666600);
`

export const AprText = styled.span`
  margin-left: 6px;

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    display: none;
  `}
`

export const PoolApr = styled.div`
  display: flex;
  font-weight: 600;
  background-color: #000;
  color: ${({ theme }) => theme.primary};
  padding: 4px 16px;
  width: max-content;
`

// FarmingBanner
export const FarmingWrapper = styled.div`
  width: 100%;
  padding: 10px 16px;
  gap: 11px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  flex-shrink: 0;
  position: relative;

  border: 1px solid transparent;
  background: linear-gradient(#272e62, #272e62) padding-box,
    linear-gradient(135deg, #5a7fff 0%, #272e62 70%, #272e62 30%, #5a7fff 100%) border-box;
  backdrop-filter: blur(2px);
`

export const FarmingPoolContainer = styled.div`
  width: calc(100% - (36px * 2));
  overflow: hidden;
  margin: 0 auto;
`

export const moveForward = keyframes`
  0% {
    left: -50%;
  }
  100% {
    left: -100%;
  }
`

export const moveBack = keyframes`
  0% {
    left: -50%;
  }
  100% {
    left: 0;
  }
`

export const moveForwardExtraSmall = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: -200%;
  }
`

export const moveBackExtraSmall = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: 0;
  }
`

export const FarmingPoolWrapper = styled.div<{ animateMoveForward: boolean; animateMoveBack: boolean }>`
  display: flex;
  align-items: center;
  position: relative;
  left: -50%;

  ${({ animateMoveForward }) =>
    animateMoveForward &&
    css`
      animation: ${moveForward} 0.8s;

      ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        animation: ${moveForwardExtraSmall} 0.8s;
      `}
    `}

  ${({ animateMoveBack }) =>
    animateMoveBack &&
    css`
      animation: ${moveBack} 0.8s;

      ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        animation: ${moveBackExtraSmall} 0.8s;
      `}
    `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    left: -100%;
  `}
`

export const FarmingPool = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
`

export const FarmingAprBadge = styled.div`
  padding: 4px 12px;
  border-radius: 20px;
  background: #221749;
  color: ${({ theme }) => theme.primary};
`

export const MoveBackIcon = styled(MoveBackSvg)`
  position: absolute;
  top: 3px;
  left: 0;
  cursor: pointer;
`

export const MoveForwardIcon = styled(MoveForwardSvg)`
  position: absolute;
  top: 3px;
  right: 0;
  cursor: pointer;
`

export const PoolPairText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  max-width: 120px;
`
