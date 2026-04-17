import { type Currency, type CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useMemo, useState } from 'react'
import { ChevronDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import useTheme from 'hooks/useTheme'
import { type SwapRouteV2, type SwapRouteV3 } from 'utils/aggregationRouting'

const TradeRouting = lazy(() => import('components/TradeRouting'))

const Panel = styled.div`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.darkBorder};
  border-radius: 12px;
`

const PanelHeader = styled.div<{ $expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.background};
  gap: 12px;
  padding: 8px 16px;
  color: ${({ theme }) => theme.subText};
  text-align: left;
`

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

const ToggleButton = styled.button`
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: background 150ms ease-in-out;

  :hover {
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

type SwapTradeRouteProps = {
  tradeComposition: SwapRouteV2[] | SwapRouteV3[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
}

const SwapTradeRoute = ({
  tradeComposition,
  currencyIn,
  currencyOut,
  inputAmount,
  outputAmount,
}: SwapTradeRouteProps) => {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(true)

  const titleData = useMemo(
    () => ({
      amountIn: inputAmount?.toSignificant(4),
      amountOut: outputAmount?.toSignificant(4),
      inputSymbol: currencyIn?.symbol,
      outputSymbol: currencyOut?.symbol,
    }),
    [currencyIn?.symbol, currencyOut?.symbol, inputAmount, outputAmount],
  )

  return (
    <Panel>
      <PanelHeader $expanded={isExpanded}>
        <PanelTitle>
          <RoutingIconWrapper />
          <Flex alignItems="center" flexWrap="wrap" sx={{ gap: '8px' }}>
            <Text color={theme.subText} fontSize={18} fontWeight={500}>
              Route:
            </Text>

            {currencyIn ? (
              <Flex alignItems="center" sx={{ gap: '6px' }}>
                <CurrencyLogo currency={currencyIn} size="18px" />
                <Text color={theme.subText} fontSize={16} fontWeight={500}>
                  {titleData.amountIn ? `${titleData.amountIn} ` : ''}
                  {titleData.inputSymbol}
                </Text>
              </Flex>
            ) : null}

            {(currencyIn || currencyOut) && (
              <Text color={theme.subText} fontSize={16} fontWeight={500}>
                →
              </Text>
            )}

            {currencyOut ? (
              <Flex alignItems="center" sx={{ gap: '6px' }}>
                <CurrencyLogo currency={currencyOut} size="18px" />
                <Text color={theme.subText} fontSize={16} fontWeight={500}>
                  {titleData.amountOut ? `${titleData.amountOut} ` : ''}
                  {titleData.outputSymbol}
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </PanelTitle>
        <ToggleButton
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse trade route' : 'Expand trade route'}
          onClick={() => setIsExpanded(prev => !prev)}
          type="button"
        >
          <PanelChevron $expanded={isExpanded} size={18} />
        </ToggleButton>
      </PanelHeader>

      {isExpanded && (
        <PanelBody>
          <Suspense
            fallback={
              <Skeleton
                height="100px"
                baseColor={theme.background}
                highlightColor={theme.buttonGray}
                borderRadius="1rem"
              />
            }
          >
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
