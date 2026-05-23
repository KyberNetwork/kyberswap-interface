import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { RefreshCw } from 'react-feather'
import { Flex } from 'rebass'
import { DustSwapRouteApiResponse } from 'services/dustSwap'
import styled from 'styled-components'

import SlippageControl from 'components/SlippageControl'
import { DEFAULT_SLIPPAGES, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const HeaderText = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const RefreshButton = styled.button`
  background: transparent;
  border: 0;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.buttonBlack};
  }
  :disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.subText};
`

const Value = styled.span<{ warn?: boolean; error?: boolean }>`
  color: ${({ theme, warn, error }) => (error ? theme.red1 : warn ? theme.warning : theme.text)};
  font-weight: 500;
`

const Skeleton = styled.div`
  height: 14px;
  width: 70px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 6px;
  animation: pulse 1.4s ease-in-out infinite;
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.border};
  opacity: 0.4;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.red1};
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
`

const HintText = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
`

const ApplyButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 999px;
  cursor: pointer;
  :hover {
    background: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.background};
  }
`

const usd = (value?: string) => {
  if (!value) return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return formatDisplayNumber(n, { style: 'currency', significantDigits: 4 })
}

type Props = {
  route: DustSwapRouteApiResponse | undefined
  loading: boolean
  error: string | null
  hint?: string | null
  onRefresh: () => void
}

const RouteSummary = ({ route, loading, error, hint, onRefresh }: Props) => {
  const { slippage } = useDustLiquidationState()
  const { updateSlippage } = useDustLiquidationActions()
  const details = route?.data?.zapDetails

  const priceImpact = details?.priceImpact
  const priceImpactWarn = useMemo(() => (priceImpact ?? 0) >= 1, [priceImpact])
  const priceImpactError = useMemo(() => (priceImpact ?? 0) >= 5, [priceImpact])

  const suggestedSlippage = details?.suggestedSlippage
  const shouldSuggest = typeof suggestedSlippage === 'number' && suggestedSlippage > 0 && suggestedSlippage !== slippage

  return (
    <Card>
      <Header>
        <HeaderText>
          <Trans>Liquidation Summary</Trans>
        </HeaderText>
        <RefreshButton onClick={onRefresh} aria-label="Refresh" disabled={loading}>
          <RefreshCw size={14} />
        </RefreshButton>
      </Header>

      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : hint && !loading && !details ? (
        <HintText>{hint}</HintText>
      ) : (
        <>
          <Rows>
            <Row>
              <Label>
                <Trans>Total input</Trans>
              </Label>
              {loading || !details ? <Skeleton /> : <Value>{usd(details.initialAmountUsd)}</Value>}
            </Row>
            <Row>
              <Label>
                <Trans>Estimated output</Trans>
              </Label>
              {loading || !details ? <Skeleton /> : <Value>{usd(details.finalAmountUsd)}</Value>}
            </Row>
            <Row>
              <Label>
                <Trans>Price impact</Trans>
              </Label>
              {loading || !details ? (
                <Skeleton />
              ) : (
                <Value warn={priceImpactWarn} error={priceImpactError}>
                  {priceImpact != null ? `${priceImpact.toFixed(2)}%` : '-'}
                </Value>
              )}
            </Row>
            <Row>
              <Label>
                <Trans>Network fee</Trans>
              </Label>
              {loading || !route?.data ? <Skeleton /> : <Value>{usd(route.data.gasUsd)}</Value>}
            </Row>
          </Rows>

          <Divider />

          <Flex flexDirection="column" sx={{ gap: '10px' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <Label>
                <Trans>Slippage tolerance</Trans>
              </Label>
              {shouldSuggest && (
                <ApplyButton type="button" onClick={() => updateSlippage(suggestedSlippage)}>
                  <Trans>Use {(suggestedSlippage / 100).toFixed(2)}%</Trans>
                </ApplyButton>
              )}
            </Flex>
            <SlippageControl
              rawSlippage={slippage}
              setRawSlippage={updateSlippage}
              isWarning={slippage > MAX_NORMAL_SLIPPAGE_IN_BIPS}
              options={DEFAULT_SLIPPAGES}
            />
          </Flex>
        </>
      )}
    </Card>
  )
}

export default RouteSummary
