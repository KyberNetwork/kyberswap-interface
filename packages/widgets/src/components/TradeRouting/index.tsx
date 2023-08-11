import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import { getDexInfoByPool, getSwapPercent, onScroll, useShadow } from './helpers'
import {
  Shadow,
  Wrapper,
  StyledContainer,
  StyledDot,
  StyledExchange,
  StyledExchangeStatic,
  StyledHop,
  StyledHopChevronRight,
  StyledHopChevronWrapper,
  StyledHops,
  StyledPair,
  StyledPairLine,
  StyledPercent,
  StyledRoute,
  StyledRouteLine,
  StyledRoutes,
  StyledToken,
  StyledWrap,
  StyledWrapToken,
} from './styled'
import { SCAN_LINK, TokenInfo } from '../../constants'
import { SwapRouteV2, getTradeComposition } from '../../utils/aggregationRouting'
import { Trade, useDexes } from '../../hooks/useSwap'
import { useTokens } from '../../hooks/useTokens'
import { isAddress } from '../../utils'
import { useActiveWeb3 } from '../../hooks/useWeb3Provider'

interface RouteRowProps {
  route: SwapRouteV2
  chainId: number
  backgroundColor?: string
}

const RouteRow = ({ route, chainId, backgroundColor }: RouteRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  const [allDexes] = useDexes()
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
    <StyledWrap ref={shadowRef} backgroundColor={backgroundColor}>
      <ScrollContainer innerRef={scrollRef} vertical={false} onScroll={handleShadow}>
        <StyledHops length={route?.subRoutes?.length} ref={contentRef}>
          {route.subRoutes.map((subRoute, index, arr) => {
            const token = route.path[index + 1]
            const id = subRoute
              .flat()
              .map(item => item.id)
              .join('-')

            return (
              <React.Fragment key={id}>
                <StyledHop>
                  <StyledToken
                    style={{ marginRight: 0 }}
                    href={`${SCAN_LINK[chainId]}/token/${token?.address}`}
                    target="_blank"
                  >
                    <img
                      width="20"
                      height="20"
                      alt="tokenIn"
                      src={token?.logoURI}
                      style={{ borderRadius: '50%' }}
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null // prevents looping
                        currentTarget.src = new URL('../../assets/question.svg', import.meta.url).href
                      }}
                    />

                    <span>{token?.symbol}</span>
                  </StyledToken>
                  {Array.isArray(subRoute)
                    ? subRoute.map(pool => {
                        const dex = getDexInfoByPool(pool, allDexes)
                        const poolId = pool.id.split('-')?.[0]
                        const link = (i => {
                          return isAddress(poolId) && !['1inch', 'paraswap', '0x'].includes(pool.exchange) ? (
                            <StyledExchange
                              key={`${i}-${pool.id}`}
                              href={`${SCAN_LINK[chainId]}/address/${poolId}`}
                              target="_blank"
                            >
                              {i}
                            </StyledExchange>
                          ) : (
                            <StyledExchangeStatic key={`${i}-${pool.id}`}>{i}</StyledExchangeStatic>
                          )
                        })(
                          <>
                            {dex?.logoURL ? (
                              <img src={dex?.logoURL} alt="" className="img--sm" />
                            ) : (
                              <i className="img--sm" />
                            )}
                            {`${dex?.name || '--'}: ${pool.swapPercentage}%`}
                          </>,
                        )
                        return link
                      })
                    : null}
                </StyledHop>
                {index !== arr.length - 1 && (
                  <StyledHopChevronWrapper>
                    <StyledHopChevronRight />
                  </StyledHopChevronWrapper>
                )}
              </React.Fragment>
            )
          })}
        </StyledHops>
      </ScrollContainer>
    </StyledWrap>
  )
}

interface RoutingProps {
  trade: Trade | null
  currencyIn: TokenInfo | undefined
  currencyOut: TokenInfo | undefined
}

const Routing = ({ trade, currencyIn, currencyOut }: RoutingProps) => {
  const { chainId } = useActiveWeb3()
  const shadowRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tokens = useTokens()

  const inputAmount = trade?.routeSummary.amountIn
  const outputAmount = trade?.routeSummary.amountOut

  const tradeComposition: SwapRouteV2[] | undefined = useMemo(() => {
    if (!trade) return undefined
    return getTradeComposition(chainId, currencyIn, inputAmount, trade.routeSummary?.route, tokens)
  }, [chainId, currencyIn, inputAmount, tokens, trade])

  const renderTokenInfo = (currency: TokenInfo | undefined, amount: string | undefined, reverseOrder?: boolean) => {
    if (chainId && currency) {
      const ammountScaled = amount ? Number(amount) / 10 ** (currency?.decimals || 18) : 0
      const ammountFormatted = Number(ammountScaled.toFixed(4))
      return (
        <StyledToken as="div" reverse={reverseOrder} style={{ border: 'none' }}>
          <img
            width="20"
            height="20"
            alt={reverseOrder ? 'token out' : 'token in'}
            src={currency?.logoURI}
            style={{ borderRadius: '50%' }}
            onError={({ currentTarget }) => {
              currentTarget.onerror = null // prevents looping
              currentTarget.src = new URL('../../assets/question.svg', import.meta.url).href
            }}
          />
          <span>
            {ammountFormatted} {currency.symbol}
          </span>
        </StyledToken>
      )
    }

    return null
  }

  const hasRoutes = chainId && tradeComposition && tradeComposition.length > 0

  const handleScroll = useCallback(() => {
    return onScroll(shadowRef.current)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    handleScroll()
  }, [tradeComposition, handleScroll])

  return (
    <Wrapper>
      <Shadow ref={shadowRef}>
        <StyledContainer ref={wrapperRef} onScroll={handleScroll} style={{ maxHeight: '100%' }}>
          <div ref={contentRef}>
            <StyledPair>
              <StyledWrapToken>{renderTokenInfo(currencyIn, inputAmount)}</StyledWrapToken>
              {!hasRoutes && <StyledPairLine />}
              <StyledWrapToken>{renderTokenInfo(currencyOut, outputAmount, true)}</StyledWrapToken>
            </StyledPair>

            {hasRoutes ? (
              <div>
                <StyledRoutes>
                  <StyledDot />
                  <StyledDot out />
                  {tradeComposition.map(route => (
                    <StyledRoute key={route.id}>
                      <StyledPercent>{getSwapPercent(route.swapPercentage, tradeComposition.length)}</StyledPercent>
                      <StyledRouteLine />
                      <RouteRow route={route} chainId={chainId} />
                      <StyledHopChevronWrapper style={{ marginRight: '2px' }}>
                        <StyledHopChevronRight />
                      </StyledHopChevronWrapper>
                    </StyledRoute>
                  ))}
                </StyledRoutes>
              </div>
            ) : null}
          </div>
        </StyledContainer>
      </Shadow>
    </Wrapper>
  )
}

export default memo(Routing)
