import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import CurrencyLogo from 'components/CurrencyLogo'
import TradeRouteV3 from 'components/TradeRouting/TradeRouteV3'
import { getDexInfoByPool, getSwapPercent, onScroll, useShadow } from 'components/TradeRouting/helpers'
import {
  ArrowHead,
  HopCard,
  HopList,
  PairRow,
  PairTokenSlot,
  PoolLabel,
  PoolLink,
  PoolList,
  RouteArrow,
  RouteBadge,
  RouteConnector,
  RouteDot,
  RouteList,
  RouteRow,
  RoutingFadeX,
  RoutingFadeY,
  RoutingViewport,
  TokenLink,
} from 'components/TradeRouting/styled'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { getEtherscanLink, isAddress } from 'utils'
import { SwapRouteV2, SwapRouteV3 } from 'utils/aggregationRouting'

interface HopRowProps {
  route: SwapRouteV2
  chainId: ChainId
  backgroundColor?: string
}

const HopRow = ({ route, chainId, backgroundColor }: HopRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  const allDexes = useAllDexes(chainId)
  const handleShadow = useShadow(scrollRef, shadowRef, contentRef)

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
    <RoutingFadeX ref={shadowRef} backgroundColor={backgroundColor}>
      <ScrollContainer innerRef={scrollRef} vertical={false} onScroll={handleShadow}>
        <HopList ref={contentRef}>
          {route.subRoutes.map((subRoute, index, arr) => {
            const token = route.path[index + 1]
            const id = subRoute
              .flat()
              .map(item => item.id)
              .join('-')

            return (
              <React.Fragment key={id}>
                <HopCard>
                  <HopTokenLink token={token} />
                  <PoolList>
                    {Array.isArray(subRoute)
                      ? subRoute.map(pool => {
                          const dex = getDexInfoByPool(pool.exchange, allDexes)
                          const poolId = pool.id.split('-')?.[0]
                          const link = (i => {
                            // TODO: Dungz remove condition
                            return isAddress(chainId, poolId) &&
                              !['1inch', 'paraswap', '0x'].includes(pool.exchange) ? (
                              <PoolLink
                                key={`${i}-${pool.id}`}
                                href={getEtherscanLink(chainId, poolId, 'address')}
                                target="_blank"
                              >
                                {i}
                              </PoolLink>
                            ) : (
                              <PoolLabel key={`${i}-${pool.id}`}>{i}</PoolLabel>
                            )
                          })(
                            <>
                              {dex?.logoURL ? <img src={dex.logoURL} alt="" className="img--sm" /> : null}
                              {`${dex?.name || pool.exchange}: ${pool.swapPercentage}%`}
                            </>,
                          )
                          return link
                        })
                      : null}
                  </PoolList>
                </HopCard>
                {index !== arr.length - 1 && (
                  <RouteArrow>
                    <ArrowHead />
                  </RouteArrow>
                )}
              </React.Fragment>
            )
          })}
        </HopList>
      </ScrollContainer>
    </RoutingFadeX>
  )
}

interface RoutingProps {
  maxHeight?: string

  tradeComposition: SwapRouteV2[] | SwapRouteV3[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
  customChainId?: ChainId
}

const Routing = ({
  customChainId,
  tradeComposition,
  maxHeight,
  inputAmount,
  outputAmount,
  currencyIn,
  currencyOut,
}: RoutingProps) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const shadowRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const renderTokenInfo = (
    currency: Currency | undefined,
    amount: CurrencyAmount<Currency> | undefined,
    reverseOrder?: boolean,
  ) => {
    if (chainId && currency) {
      return (
        <TokenLink as="div" reverse={reverseOrder} className="border-none">
          <CurrencyLogo currency={currency} size="20px" />
          <span>{`${amount ? amount.toSignificant(8) : ''} ${currency.symbol}`}</span>
        </TokenLink>
      )
    }

    return null
  }

  const availabeRoute = chainId && tradeComposition && tradeComposition.length > 0

  const handleScroll = useCallback(() => {
    return onScroll(shadowRef.current)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    handleScroll()
  }, [tradeComposition, maxHeight, handleScroll])

  const isSwapRouteV3 =
    (tradeComposition as Array<SwapRouteV2 | SwapRouteV3> | undefined)?.every(
      (item): item is SwapRouteV3 => 'pool' in item,
    ) ?? false

  return (
    <RoutingFadeY ref={shadowRef}>
      <RoutingViewport ref={wrapperRef} onScroll={handleScroll} style={{ maxHeight: maxHeight || '100%' }}>
        <div ref={contentRef}>
          <PairRow>
            <PairTokenSlot>{renderTokenInfo(currencyIn, inputAmount)}</PairTokenSlot>
            <PairTokenSlot>{renderTokenInfo(currencyOut, outputAmount, true)}</PairTokenSlot>
          </PairRow>

          {!!availabeRoute && (
            <>
              <RouteList>
                {!isSwapRouteV3 && (
                  <>
                    <RouteDot />
                    <RouteDot out />
                  </>
                )}
                {isSwapRouteV3 ? (
                  inputAmount && outputAmount ? (
                    <TradeRouteV3
                      tradeComposition={tradeComposition as SwapRouteV3[]}
                      tokenIn={inputAmount?.currency.wrapped}
                    />
                  ) : null
                ) : (
                  (tradeComposition as SwapRouteV2[]).map(route => {
                    return (
                      <RouteRow key={route.id}>
                        <RouteBadge>{getSwapPercent(route.swapPercentage, tradeComposition.length)}</RouteBadge>
                        <RouteConnector />
                        <HopRow route={route} chainId={chainId} />
                        <RouteArrow className="mr-0.5">
                          <ArrowHead />
                        </RouteArrow>
                      </RouteRow>
                    )
                  })
                )}
              </RouteList>
            </>
          )}
        </div>
      </RoutingViewport>
    </RoutingFadeY>
  )
}

const HopTokenLink = ({ token }: { token: Token }) => {
  const currency = useCurrencyV2(token.wrapped.address, token.chainId)
  return (
    <TokenLink
      className="mr-0 w-fit text-xs"
      href={getEtherscanLink(token.chainId, token?.wrapped.address, 'token')}
      target="_blank"
    >
      <CurrencyLogo currency={currency} size="16px" />
      <span>{currency?.symbol}</span>
    </TokenLink>
  )
}

export default memo(Routing)
