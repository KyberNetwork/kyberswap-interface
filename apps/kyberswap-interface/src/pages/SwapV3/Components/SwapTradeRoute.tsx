import { type Currency, type CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import { ShieldChecked } from 'components/Icons'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { ClickTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { type SwapRouteV2, type SwapRouteV3 } from 'utils/aggregationRouting'

const TradeRouting = lazy(() => import('components/TradeRouting'))

const Panel = styled.div`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.darkBorder};
  border-radius: 12px;
`

const PanelHeader = styled.button<{ $expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: ${({ theme }) => theme.background};
  gap: 12px;
  padding: 6px 16px;
  color: ${({ theme }) => theme.subText};
  text-align: left;
  cursor: pointer;
`

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

const RouteLabel = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const RouteTitleText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
  `}
`

const SmartSettlementBadge = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => rgba(theme.primary, 0.45)};
  border-radius: 12px;
  background: ${({ theme }) => rgba(theme.primary, 0.12)};
  color: ${({ theme }) => theme.primary};
  font-size: 14px;
  font-weight: 500;
`

const SmartSettlementTooltipContent = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;

  b {
    color: ${({ theme }) => theme.text};
    font-weight: 500;
  }
`

const ToggleIconWrapper = styled.div`
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: transparent;
  transition: background 150ms ease-in-out;

  ${PanelHeader}:hover & {
    background: ${({ theme }) => theme.tableHeader};
  }
`

const PanelChevron = styled(ChevronDown)<{ $expanded: boolean }>`
  color: ${({ theme }) => theme.subText};
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
  transition: transform 150ms ease-in-out;
`

const PanelBody = styled.div`
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.darkBorder};
`

const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;

  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

const TradeRouteSkeleton = () => {
  const theme = useTheme()

  return (
    <Stack gap={40} py={12}>
      <HStack align="center" justify="space-between" gap={16}>
        <Skeleton height={24} variant="darkSubtle" width={108} />
        <Skeleton height={24} variant="darkSubtle" width={108} />
      </HStack>

      <HStack justify="space-evenly" gap={12}>
        {[0, 1].map(index => (
          <Stack key={index} gap={12} width={180} p={12} border={`1px solid ${theme.darkBorder}`} borderRadius={12}>
            <Skeleton height={20} variant="darkSubtle" width={96} />
            <Skeleton height={28} variant="darkSubtle" width="100%" />
          </Stack>
        ))}
      </HStack>
    </Stack>
  )
}

type SwapTradeRouteProps = {
  tradeComposition: SwapRouteV2[] | SwapRouteV3[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultCollapsed?: boolean
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
  isSmartSettlementActive?: boolean
  scrollOnExpand?: boolean
}

const SwapTradeRoute = ({
  tradeComposition,
  currencyIn,
  currencyOut,
  defaultCollapsed = false,
  inputAmount,
  outputAmount,
  isSmartSettlementActive = false,
  scrollOnExpand = true,
}: SwapTradeRouteProps) => {
  const theme = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)

  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)

  useEffect(() => {
    setIsExpanded(!defaultCollapsed)
  }, [defaultCollapsed])

  const titleData = useMemo(
    () => ({
      amountIn: inputAmount?.toSignificant(8),
      amountOut: outputAmount?.toSignificant(8),
      inputSymbol: currencyIn?.symbol,
      outputSymbol: currencyOut?.symbol,
    }),
    [currencyIn?.symbol, currencyOut?.symbol, inputAmount, outputAmount],
  )

  const smartSettlementTooltip = (
    <SmartSettlementTooltipContent>
      <Trans>
        At execution, KyberSwap compares candidate pools on-chain in real time and picks the one that delivers the
        highest output - giving your swap the best possible rate with an extra layer of protection from slippage,
        PropAMM manipulation, Just-in-Time attacks and MEVs. <b>Your minimum amount out is always guaranteed.</b> No
        extra steps needed.
      </Trans>{' '}
      <ExternalLink
        href="https://docs.kyberswap.com/developer-guide/start-here/foundational-solutions/smart-settlement-better-swap-output-with-lower-slippage"
        onClick={event => event.stopPropagation()}
      >
        <Trans>Learn more ↗</Trans>
      </ExternalLink>
    </SmartSettlementTooltipContent>
  )

  const handleToggle = () => {
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)

    if (!nextExpanded || !scrollOnExpand) return

    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  return (
    <Panel ref={panelRef}>
      <PanelHeader $expanded={isExpanded} onClick={handleToggle} type="button">
        <PanelTitle>
          <RoutingIconWrapper />
          <Flex alignItems="center" flexWrap="wrap" sx={{ gap: '8px' }}>
            <RouteLabel color={theme.subText} fontSize={18} fontWeight={500}>
              Route:
            </RouteLabel>

            {currencyIn ? (
              <Flex alignItems="center" sx={{ gap: '6px' }}>
                <CurrencyLogo currency={currencyIn} size="18px" />
                <RouteTitleText color={theme.subText} fontSize={16} fontWeight={500}>
                  {titleData.amountIn ? `${titleData.amountIn} ` : ''}
                  {titleData.inputSymbol}
                </RouteTitleText>
              </Flex>
            ) : null}

            {(currencyIn || currencyOut) && (
              <RouteTitleText color={theme.subText} fontSize={16} fontWeight={500}>
                →
              </RouteTitleText>
            )}

            {currencyOut ? (
              <Flex alignItems="center" sx={{ gap: '6px' }}>
                <CurrencyLogo currency={currencyOut} size="18px" />
                <RouteTitleText color={theme.subText} fontSize={16} fontWeight={500}>
                  {titleData.amountOut ? `${titleData.amountOut} ` : ''}
                  {titleData.outputSymbol}
                </RouteTitleText>
              </Flex>
            ) : null}

            {isSmartSettlementActive && (
              <ClickTooltip text={smartSettlementTooltip} width="360px" placement="top">
                <SmartSettlementBadge role="button">
                  <ShieldChecked size={14} color={theme.primary} />
                  <Trans>Smart Settlement</Trans>
                  <Info size={14} />
                </SmartSettlementBadge>
              </ClickTooltip>
            )}
          </Flex>
        </PanelTitle>
        <ToggleIconWrapper>
          <PanelChevron $expanded={isExpanded} size={18} />
        </ToggleIconWrapper>
      </PanelHeader>

      {isExpanded && (
        <PanelBody>
          <Suspense fallback={<TradeRouteSkeleton />}>
            <TradeRouting
              tradeComposition={tradeComposition}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              inputAmount={inputAmount}
              outputAmount={outputAmount}
            />
          </Suspense>
        </PanelBody>
      )}
    </Panel>
  )
}

export default SwapTradeRoute
