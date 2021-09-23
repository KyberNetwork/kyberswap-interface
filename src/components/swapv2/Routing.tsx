import React, { useEffect, useMemo, useRef } from 'react'
import styled, { css } from 'styled-components'
import { t } from '@lingui/macro'
import ScrollContainer from 'react-indiana-drag-scroll'
import CurrencyLogo from '../CurrencyLogo'
import { getEtherscanLink } from '../../utils'
import { useActiveWeb3React } from '../../hooks'
import { Aggregator, getExchangeConfig } from '../../utils/aggregator'
import { getTradeComposition, SwapRouteV2 } from '../../utils/aggregationRouting'
import { ChainId, Currency, CurrencyAmount, TokenAmount } from 'libs/sdk/src'
import useThrottle from '../../hooks/useThrottle'
import { Field } from '../../state/swap/actions'
import { useCurrencyConvertedToNative } from '../../utils/dmm'

const StyledContainer = styled.div`
  flex: 1;
  max-width: 100%;
  margin-left: 20px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-top: 20px;
    margin-left: 0px;
  `}
`
const StyledRouting = styled.div``

const StyledPair = styled.div`
  position: relative;
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
`

const StyledPairLine = styled.div`
  flex: auto;
  min-width: 20px;
`
const StyledWrapToken = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 170px;
  max-width: 200px;
  width: max-content;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  min-height: 38px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 120px;
  `}
`
const StyledToken = styled.a<{ reverse?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-decoration: none;
  color: inherit;
  ${({ reverse }) =>
    reverse &&
    css`
      flex-direction: row-reverse;
      justify-content: flex-start;
    `}

  & > .img--sm {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
  & > span {
    margin-left: 4px;
    margin-right: 4px;
  }
`
const StyledRoutes = styled.div`
  max-width: 638px;
  margin: auto;
  width: 100%;
  position: relative;
  padding: 20px 10px 0;

  &:before {
    position: absolute;
    display: block;
    content: '';
    top: 0;
    right: 0;
  }
`
const StyledRoute = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  align-items: center;

  &:before,
  &:after {
    content: '';
    display: block;
    border-left: 1px dashed ${({ theme }) => theme.border};
    width: 100%;
    height: calc(50% + 20px);
    position: absolute;
    border-right: 1px dashed ${({ theme }) => theme.border};
    box-sizing: border-box;
    pointer-events: none;
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
const StyledRouteLine = styled.div`
  position: absolute;
  border-bottom: 1px dashed ${({ theme }) => theme.border};
  width: 100%;
`
const StyledHops = styled.div<{ length: string | number }>`
  width: 100%;
  z-index: 1;
  display: grid;
  grid-column-gap: 20px;
  grid-template-columns: repeat(${({ length }) => length}, 1fr);
  align-items: center;
`

const StyledHop = styled.div`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg6};
  height: fit-content;
  position: relative;
`
const StyledExchange = styled.a`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px;
  margin-top: 4px;
  font-size: 10px;
  border-radius: 8px;
  color: ${({ theme }) => theme.text11};
  background-color: ${({ theme }) => theme.bg12};
  line-height: 20px;
  white-space: nowrap;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  & > .img--sm {
    width: 12px;
    height: 12px;
    border-radius: 100%;
    margin-right: 4px;
  }

  &:first-child {
    margin-top: 8px;
  }
`

const StyledPercent = styled.div`
  font-size: 12px;
  line-height: 14px;
  font-weight: 700;
  position: absolute;
  top: calc(50% - 15px);
  left: 8px;
  transform: translateY(50%);
  z-index: 2;
  color: ${({ theme }) => theme.secondary4};
  background-color: ${({ theme }) => theme.bg12};
`
const StyledDot = styled.i<{ out?: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  position: absolute;
  top: 0;
  left: ${({ out }) => (out ? 'unset' : '6px')};
  right: ${({ out }) => (out ? '6px' : 'unset')};
  z-index: 1;
  background-color: ${({ theme }) => theme.secondary4};
`
const StyledWrap = styled.div`
  width: calc(100% - 76px);
  margin: 10px 0;

  &.left-visible:after,
  &.right-visible:before {
    content: '';
    display: block;
    z-index: 2;
    pointer-events: none;
    position: absolute;
    inset: 0 0 auto auto;
    width: 40px;
    height: calc(100% - 20px);
    top: 50%;
    transform: translateY(-50%);
  }

  &.left-visible:after {
    background: linear-gradient(to right, ${({ theme }) => theme.bg12}, transparent);
    left: 35px;
  }

  &.right-visible:before {
    background: linear-gradient(to left, ${({ theme }) => theme.bg12}, transparent);
    right: 35px;
  }
`

const StyledHopChevronRight = styled.div`
  position: absolute;
  left: -13px;
  top: 50%;
  transform: translateY(-50%);
  margin-top: -1px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 5px solid ${({ theme }) => theme.secondary4};
`

const getSwapPercent = (percent?: number, routeNumber = 0): string | null => {
  if (routeNumber === 1) {
    return '100%'
  }
  if (!percent && percent !== 0) {
    return null
  }
  const val = routeNumber > 1 ? Math.min(99.99, Math.max(0.01, percent)) : percent
  return `${val.toFixed(0)}%`
}

interface RouteRowProps {
  route: SwapRouteV2
  chainId: ChainId
}

const RouteRow = ({ route, chainId }: RouteRowProps) => {
  const scrollRef = useRef(null)
  const contentRef: any = useRef(null)
  const shadowRef: any = useRef(null)

  const handleShadow = useThrottle(() => {
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (contentRef.current?.scrollWidth - element?.scrollLeft > element?.clientWidth) {
      shadowRef.current?.classList.add('right-visible')
    } else {
      shadowRef.current?.classList.remove('right-visible')
    }
  }, 300)

  useEffect(() => {
    window.addEventListener('resize', handleShadow)
    return () => window.removeEventListener('resize', handleShadow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    handleShadow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  return (
    <StyledWrap ref={shadowRef}>
      <ScrollContainer innerRef={scrollRef} vertical={false} onScroll={handleShadow}>
        <StyledHops length={route?.subRoutes?.length} ref={contentRef}>
          {route.subRoutes.map((subRoute, index) => {
            const token = route.path[index + 1]

            return (
              <StyledHop key={index}>
                {index !== 0 ? <StyledHopChevronRight /> : null}
                <StyledToken
                  style={{ marginRight: 0 }}
                  href={getEtherscanLink(chainId, token?.address, 'token')}
                  target="_blank"
                >
                  <CurrencyLogo currency={token} size={'14px'} />
                  <span>{token?.symbol}</span>
                </StyledToken>
                {Array.isArray(subRoute)
                  ? subRoute.map((pool, i) => {
                      const dex = getExchangeConfig(pool.exchange, chainId)
                      return (
                        <StyledExchange
                          key={`${i}-${pool.id}`}
                          href={getEtherscanLink(chainId, pool.id, 'address')}
                          target="_blank"
                        >
                          {dex.icon ? <img src={dex.icon} alt="" className="img--sm" /> : <i className="img--sm" />}
                          {`${dex?.name || '--'}: ${pool.swapPercentage}%`}
                        </StyledExchange>
                      )
                    })
                  : null}
              </StyledHop>
            )
          })}
        </StyledHops>
      </ScrollContainer>
    </StyledWrap>
  )
}

interface RoutingProps {
  trade?: Aggregator
  currencies: { [field in Field]?: Currency }
}

const Routing = ({ trade, currencies }: RoutingProps) => {
  const { chainId } = useActiveWeb3React()

  const nativeInputCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT] || undefined)
  const nativeOutputCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT] || undefined)

  const tradeComposition = useMemo((): SwapRouteV2[] | undefined => {
    return getTradeComposition(trade, chainId)
  }, [trade, chainId])

  const renderTokenInfo = (currencyAmount: CurrencyAmount, field: Field) => {
    const isOutput = field === Field.OUTPUT
    const currency =
      currencyAmount instanceof TokenAmount
        ? currencyAmount.currency
        : isOutput
        ? nativeOutputCurrency
        : nativeInputCurrency

    if (chainId && currency) {
      return (
        <StyledToken as={'div'} reverse={isOutput}>
          <CurrencyLogo currency={currency} size={'20px'} />
          <span>{`${currencyAmount.toSignificant(6)} ${currency.symbol}`}</span>
        </StyledToken>
      )
    }
    return null
  }

  return (
    <StyledContainer>
      <h3>{t`Order Routing`}</h3>
      {trade && chainId && tradeComposition && tradeComposition.length > 0 ? (
        <StyledRouting>
          <StyledPair>
            <StyledWrapToken>{renderTokenInfo(trade.inputAmount, Field.INPUT)}</StyledWrapToken>
            <StyledPairLine />
            <StyledWrapToken>{renderTokenInfo(trade.outputAmount, Field.OUTPUT)}</StyledWrapToken>
          </StyledPair>
          <StyledRoutes>
            <StyledDot />
            <StyledDot out />
            {tradeComposition.map((route, index) => (
              <StyledRoute key={index}>
                <StyledPercent>{getSwapPercent(route.swapPercentage, tradeComposition.length)}</StyledPercent>
                <StyledRouteLine />
                <RouteRow route={route} chainId={chainId} />
              </StyledRoute>
            ))}
          </StyledRoutes>
        </StyledRouting>
      ) : null}
    </StyledContainer>
  )
}

export default Routing
