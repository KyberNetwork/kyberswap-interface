import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { RefreshCw } from 'react-feather'
import { Flex } from 'rebass'
import { DustSwapRouteApiResponse } from 'services/dustSwap'
import styled from 'styled-components'

import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const HeaderText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
`

const RefreshButton = styled.button`
  background: transparent;
  border: 0;
  padding: 4px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.text};
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
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
  height: 16px;
  width: 80px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 8px;
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

const ErrorText = styled.div`
  color: ${({ theme }) => theme.red1};
  font-size: 13px;
`

const HintText = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
  text-align: center;
  padding: 4px 0;
`

const ApplyButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  cursor: pointer;
  margin-left: 8px;
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
          <Row>
            <Label>
              <Trans>Slippage</Trans>
            </Label>
            <Flex alignItems="center">
              <Value>{(slippage / 100).toFixed(2)}%</Value>
              {shouldSuggest && (
                <ApplyButton type="button" onClick={() => updateSlippage(suggestedSlippage)}>
                  <Trans>Use suggested {(suggestedSlippage / 100).toFixed(2)}%</Trans>
                </ApplyButton>
              )}
            </Flex>
          </Row>
        </>
      )}
    </Card>
  )
}

export default RouteSummary
