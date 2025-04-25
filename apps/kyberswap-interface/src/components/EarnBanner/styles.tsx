import styled, { css, keyframes } from 'styled-components'
import { Text } from 'rebass'
import { ReactComponent as MoveBackSvg } from 'assets/svg/ic_move_back.svg'
import { ReactComponent as MoveForwardSvg } from 'assets/svg/ic_move_forward.svg'

const borderAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

// TrendingBanner
export const TrendingWrapper = styled.div`
  width: 100%;
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(90deg, #196750, ${({ theme }) => theme.primary}, #196750);
    background-size: 200% 200%;
    animation: ${borderAnimation} 2s linear infinite;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  background: #1d5b49cc;
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
  gap: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  flex-shrink: 0;
  border-radius: 16px;
  position: relative;
  background: rgba(74, 91, 222, 0.4);
  backdrop-filter: blur(2px);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(90deg, #3c88e2, #4a5bde, #3c88e2);
    background-size: 200% 200%;
    animation: ${borderAnimation} 1s linear infinite;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
`

export const FarmingPoolContainer = styled.div`
  width: 430px;
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

export const FarmingPoolWrapper = styled.div<{ animateMoveForward: boolean; animateMoveBack: boolean }>`
  width: 860px;
  display: flex;
  align-items: center;
  position: relative;
  left: -50%;

  ${({ animateMoveForward }) =>
    animateMoveForward &&
    css`
      animation: ${moveForward} 0.8s;
    `}

  ${({ animateMoveBack }) =>
    animateMoveBack &&
    css`
      animation: ${moveBack} 0.8s;
    `}
`

export const FarmingPool = styled.div`
  width: 215px;
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
