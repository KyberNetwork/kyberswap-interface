import React, { useEffect, useRef, useState } from 'react'
import { Trans } from '@lingui/macro'
import styled, { keyframes } from 'styled-components'
import { ChevronLeft, ChevronRight } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { ChainId, Token, WETH } from '@dynamic-amm/sdk'
import { Flex, Text } from 'rebass'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import { useWindowSize } from 'hooks/useWindowSize'
import { useFarmsData } from 'state/farms/hooks'
import { Link } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks'

const MarqueeItem = ({ token0, token1 }: { token0: Token; token1: Token }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()

  const token0Address =
    token0.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? WETH[chainId as ChainId].symbol?.slice(1)
      : token0.address
  const token1Address =
    token1.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? WETH[chainId as ChainId].symbol?.slice(1)
      : token1.address

  return (
    <Link
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        padding: '8px',
        background: theme.buttonBlack,
        borderRadius: '5px',
        minWidth: 'fit-content',
        color: theme.text,
        textDecoration: 'none'
      }}
      to={`/pools/${token0Address}/${token1Address}`}
    >
      <CurrencyLogo currency={token0} size="16px" />
      <Text fontSize="12px">{token0.symbol}</Text>
      <Text fontSize="12px">|</Text>
      <Text fontSize="12px">{token1.symbol ?? '--'}</Text>
      <CurrencyLogo currency={token1} size="16px" />
    </Link>
  )
}

const FarmingPoolsMarquee = () => {
  const theme = useTheme()
  const marqueeWrapperRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const windowSize = useWindowSize()
  const [isShowMarqueeAnimation, setIsShowMarqueeAnimation] = useState(false)

  const { data: farms } = useFarmsData()

  const existedPairs: { [key: string]: boolean } = {}
  const uniqueFarms = Object.values(farms)
    .flat()
    .filter(farm => {
      if (existedPairs[`${farm.token0?.symbol}-${farm.token1?.symbol}`]) return false
      existedPairs[`${farm.token0?.symbol}-${farm.token1?.symbol}`] = true
      return true
    })

  useEffect(() => {
    if (marqueeWrapperRef && marqueeWrapperRef.current && marqueeRef && marqueeRef.current) {
      const marqueeWrapperWidth = marqueeWrapperRef.current.getBoundingClientRect().width
      const marqueeWidth = marqueeRef.current.getBoundingClientRect().width
      if (marqueeWrapperWidth < marqueeWidth) {
        setIsShowMarqueeAnimation(true)
      } else {
        setIsShowMarqueeAnimation(false)
      }
    }
  }, [windowSize, uniqueFarms])

  // useEffect(() => {
  //   const itv = setInterval(() => {
  //     if (marqueeRef && marqueeRef.current && isShowMarqueeAnimation) {
  //       const { style } = marqueeRef.current
  //       const transformNumber = style.transform.match(/(-|[0-9])+/g)
  //       const previousTransform = style.transform && transformNumber ? (+transformNumber[0] - 100) % 100 : 0
  //       marqueeRef.current.style.transform = `translateX(${previousTransform - 1}%)`
  //       console.log(`marqueeRef.current.style.transform`, marqueeRef.current.style.transform)
  //     }
  //   }, 1000)
  //
  //   return () => {
  //     clearInterval(itv)
  //   }
  // }, [isShowMarqueeAnimation])

  if (uniqueFarms.length === 0) return null

  return (
    <Container>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <MouseoverTooltip text="Available for yield farming">
          <DropIcon />
        </MouseoverTooltip>
      </div>
      <Title>
        <Trans>Farming Pools</Trans>
      </Title>
      <MarqueeSection>
        <ChevronLeft size="16px" color={theme.subText} cursor="pointer" height="100%" />
        <MarqueeWrapper ref={marqueeWrapperRef}>
          <Marquee ref={marqueeRef} isShowMarqueeAnimation={isShowMarqueeAnimation} numberOfItems={uniqueFarms.length}>
            {uniqueFarms.map(farm => (
              <MarqueeItem
                key={`${farm.token0?.symbol}-${farm.token1?.symbol}`}
                token0={{ ...farm.token0, address: farm.token0.id }}
                token1={{ ...farm.token1, address: farm.token1.id }}
              />
            ))}
          </Marquee>
        </MarqueeWrapper>
        <ChevronRight size="16px" color={theme.subText} cursor="pointer" height="100%" />
      </MarqueeSection>
    </Container>
  )
}

export default FarmingPoolsMarquee

const Container = styled.div`
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
      transform: translateY(-10%);
    }
    100% {
      opacity: 1;
      transform: translateY(0%);
    }
  }
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: ${({ theme }) => theme.bg6};
  border-radius: 5px;
  align-items: center;
  position: relative;
  margin-bottom: 24px;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 1s;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}
`

const Title = styled.div`
  font-size: 16px;
  min-width: max-content;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

const MarqueeSection = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  overflow: hidden;
  z-index: 1;
`

const MarqueeWrapper = styled.div`
  overflow: hidden;
  width: 100%;
`

const marqueeRTL = keyframes`
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
`

const Marquee = styled.div<{ isShowMarqueeAnimation: boolean; numberOfItems: number }>`
  min-width: fit-content;
  overflow: hidden;
  display: flex;
  gap: 8px;

  // Cannot wrap keyframe in string interpolation.
  animation: ${marqueeRTL} 0s linear infinite;
  animation-duration: ${({ numberOfItems }) => `${numberOfItems * 7.5}s`};
  ${({ isShowMarqueeAnimation }) => (isShowMarqueeAnimation ? '' : 'animation: none;')}
`
