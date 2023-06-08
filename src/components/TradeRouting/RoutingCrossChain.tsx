import { Call } from '@0xsquid/sdk'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import React, { useCallback, useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import { TokenLogoWithChain } from 'components/Logo'
import { onScroll, useShadow } from 'components/TradeRouting/helpers'
import {
  Shadow,
  StyledContainer,
  StyledDot,
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
} from 'components/TradeRouting/styled'
import { getRouInfo } from 'pages/CrossChain/helpers'
import { useCrossChainState } from 'state/crossChain/hooks'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getEtherscanLink } from 'utils'
import { uint256ToFraction } from 'utils/numbers'
import { isTokenNative } from 'utils/tokenInfo'

const RouteRowCrossChain = ({ routes, backgroundColor }: { routes: Call[]; backgroundColor?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  const allDexes = useAllDexes()
  const handleShadow = useShadow(scrollRef, shadowRef, contentRef)

  useEffect(() => {
    window.addEventListener('resize', handleShadow)
    return () => window.removeEventListener('resize', handleShadow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    handleShadow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes])

  return (
    <StyledWrap ref={shadowRef} backgroundColor={backgroundColor}>
      <ScrollContainer innerRef={scrollRef} vertical={false} onScroll={handleShadow}>
        <StyledHops length={routes.length} ref={contentRef}>
          {routes.map((subRoute: any, index, arr) => {
            if (!subRoute.fromToken || !subRoute.toToken) return null
            const fromToken = new WrappedTokenInfo(subRoute.fromToken)
            const toToken = new WrappedTokenInfo(subRoute.toToken)

            const dex = subRoute.dex
            const dexLogo = allDexes.find(
              el =>
                el.id === dex.dexName.toLowerCase() ||
                el.name.toLowerCase() === dex.dexName.toLowerCase() ||
                dex.dexName.toLowerCase().startsWith(el.name.toLowerCase()),
            )?.logoURL
            return [fromToken, toToken].map((token: WrappedTokenInfo, indexLast) => {
              const chainId = token.chainId as ChainId
              return token ? (
                <React.Fragment key={`${index}_${indexLast}`}>
                  <StyledHop>
                    <StyledToken
                      href={getEtherscanLink(
                        chainId,
                        isTokenNative(token, chainId) ? WETH[chainId].address : token.address,
                        'token',
                      )}
                      target="_blank"
                      style={{ gap: '4px' }}
                    >
                      <TokenLogoWithChain chainId={chainId} tokenLogo={token.logoURI ?? ''} size={16} />
                      <span>{token?.symbol}</span>
                    </StyledToken>

                    <StyledExchangeStatic>
                      {dexLogo && <img src={dexLogo} alt="" className="img--sm" />}
                      {dex?.dexName}
                    </StyledExchangeStatic>
                  </StyledHop>
                  {!(index === arr.length - 1 && indexLast === 1) && (
                    <StyledHopChevronWrapper>
                      <StyledHopChevronRight />
                    </StyledHopChevronWrapper>
                  )}
                </React.Fragment>
              ) : null
            })
          })}
        </StyledHops>
      </ScrollContainer>
    </StyledWrap>
  )
}

const RoutingCrossChain = () => {
  const [{ chainIdOut }] = useCrossChainState()
  const shadowRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [{ route, currencyIn, currencyOut }] = useCrossChainState()

  const renderTokenInfo = (currency: typeof currencyIn, amount: string | undefined, reverseOrder?: boolean) => {
    if (!currency) return null
    return (
      <StyledToken as="div" reverse={reverseOrder} style={{ border: 'none' }}>
        <TokenLogoWithChain size={20} currency={currency} />
        <span>{`${amount ? uint256ToFraction(amount, currency.decimals).toSignificant(6) : ''} ${
          currency.symbol
        }`}</span>
      </StyledToken>
    )
  }

  const { routeData, inputAmount, outputAmount } = getRouInfo(route)

  const routeSource: Call[] = routeData?.fromChain ?? []
  const routeDest: Call[] = routeData?.toChain ?? []
  const numRoute = routeSource.length + routeDest.length
  const hasRoutes = chainIdOut && numRoute > 0

  const handleScroll = useCallback(() => {
    return onScroll(shadowRef.current)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    handleScroll()
  }, [route, handleScroll])

  return (
    <Shadow ref={shadowRef}>
      <StyledContainer ref={wrapperRef} onScroll={handleScroll} style={{ maxHeight: '100%', paddingRight: 6 }}>
        <div ref={contentRef}>
          <StyledPair>
            <StyledWrapToken>{renderTokenInfo(currencyIn, inputAmount)}</StyledWrapToken>
            {!hasRoutes && <StyledPairLine />}
            <StyledWrapToken>{renderTokenInfo(currencyOut, outputAmount, true)}</StyledWrapToken>
          </StyledPair>

          {hasRoutes ? (
            <StyledRoutes>
              <StyledDot />
              <StyledDot out />
              <StyledRoute>
                <StyledPercent>100%</StyledPercent>
                <StyledRouteLine />
                <RouteRowCrossChain routes={routeSource.concat(routeDest)} />
                <StyledHopChevronWrapper style={{ marginRight: '2px' }}>
                  <StyledHopChevronRight />
                </StyledHopChevronWrapper>
              </StyledRoute>
            </StyledRoutes>
          ) : null}
        </div>
      </StyledContainer>
    </Shadow>
  )
}
export default RoutingCrossChain
