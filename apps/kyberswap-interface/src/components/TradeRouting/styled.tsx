import styled, { css } from 'styled-components'

const fadeOverlayBase = css`
  content: '';
  position: absolute;
  display: block;
  pointer-events: none;
  opacity: 0;
`

const tradeRoutePoolItemStyles = css`
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 12px;
  color: ${({ theme }) => theme.subText};
  font-size: 10px;
  line-height: 20px;
  white-space: nowrap;
  text-decoration: none;

  & > .img--sm {
    width: 14px;
    height: 14px;
    margin-right: 4px;
  }
`

export const RoutingFadeY = styled.div<{ backgroundColor?: string }>`
  position: relative;
  min-height: 0;
  overflow: hidden;

  &:before,
  &:after {
    ${fadeOverlayBase};
    left: 50%;
    z-index: 3;
    width: 100%;
    height: 50px;
    transform: translateX(-50%);
    transition: all 0.2s ease;
  }

  &:before {
    top: 0;
    background: linear-gradient(to bottom, ${({ backgroundColor }) => backgroundColor}, transparent);
  }

  &:after {
    bottom: 0;
    background: linear-gradient(to top, ${({ backgroundColor }) => backgroundColor}, transparent);
  }

  &.top:before,
  &.bottom:after {
    opacity: 1;
  }
`

export const RoutingViewport = styled.div`
  flex: 1;
  margin-left: 0;
  max-width: 100%;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track-piece {
    background: transparent;
  }
`

export const PairRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
`

export const PairTokenSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: max-content;
  min-width: 100px;
  min-height: 38px;
  border-radius: 0.5rem;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 120px;
  `}
`

export const TokenLink = styled.a<{ reverse?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding-bottom: 8px;
  white-space: nowrap;
  color: ${({ theme }) => theme.subText};
  text-decoration: none;
  ${({ reverse }) =>
    reverse &&
    css`
      flex-direction: row-reverse;
      justify-content: flex-start;
    `}

  & > span {
    margin-left: 4px;
    margin-right: 4px;
  }
`

export const RouteList = styled.div`
  position: relative;
  width: 100%;
  margin: auto;
  padding: 20px 10px 0;

  &:before {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    display: block;
  }
`

export const RouteDot = styled.i<{ out?: boolean }>`
  position: absolute;
  top: 0;
  left: ${({ out }) => (out ? 'unset' : '6.5px')};
  right: ${({ out }) => (out ? '6.5px' : 'unset')};
  z-index: 1;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: ${({ theme }) => theme.primary};
`

export const RouteRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  &:before,
  &:after {
    content: '';
    position: absolute;
    display: block;
    width: 100%;
    height: calc(50% + 20px);
    box-sizing: border-box;
    pointer-events: none;
    border-right: 1px solid ${({ theme }) => theme.buttonGray};
    border-left: 1px solid ${({ theme }) => theme.buttonGray};
  }

  &:before {
    top: -20px;
  }

  &:after {
    bottom: -10px;
  }

  &:last-child:after {
    display: none;
  }
`

export const RouteBadge = styled.div`
  position: absolute;
  top: calc(50% - 15px);
  left: 8px;
  z-index: 2;
  padding: 0 4px;
  transform: translateY(50%);
  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.primary};
  font-size: 12px;
  font-weight: 700;
  line-height: 14px;
`

export const RouteConnector = styled.div`
  position: absolute;
  left: 0px;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.buttonGray};
`

export const RoutingFadeX = styled.div<{ backgroundColor?: string }>`
  margin: 10px 0 10px 6px;
  width: calc(100% - 68px);

  &:after,
  &:before {
    ${fadeOverlayBase};
    inset: 0 0 auto auto;
    top: 50%;
    z-index: 2;
    width: 40px;
    height: calc(100% - 20px);
    transform: translateY(-50%);
    transition: all 0.1s ease;
  }

  &:after {
    left: 42px;
    background: linear-gradient(to right, ${({ backgroundColor }) => backgroundColor}, transparent);
  }

  &:before {
    right: 24px;
    background: linear-gradient(to left, ${({ backgroundColor }) => backgroundColor}, transparent);
  }

  &.left-visible:after,
  &.right-visible:before {
    opacity: 1;
  }
`

export const HopList = styled.div`
  display: flex;
  align-items: center;
  z-index: 1;
`

export const HopCard = styled.div`
  position: relative;
  flex: 0 0 168px;
  height: fit-content;
  margin: auto;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.buttonGray};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

export const PoolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
`

export const PoolLink = styled.a`
  ${tradeRoutePoolItemStyles};

  &:hover {
    color: ${({ theme }) => theme.white};
  }
`

export const PoolLabel = styled.div`
  ${tradeRoutePoolItemStyles};
`

export const RouteArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  z-index: 1;
`

export const ArrowHead = styled.div`
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 5px solid ${({ theme }) => theme.primary};
`
