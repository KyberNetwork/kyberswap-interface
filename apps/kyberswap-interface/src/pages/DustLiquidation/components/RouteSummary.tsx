import { Trans } from '@lingui/macro'
import { ButtonHTMLAttributes, HTMLAttributes, useMemo } from 'react'
import { RefreshCw } from 'react-feather'
import { DustSwapRouteApiResponse } from 'services/dustSwap'

import SlippageControl from 'components/SlippageControl'
import { DEFAULT_SLIPPAGES, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-[14px] rounded-[20px] bg-background p-5', className)} {...rest} />
)

const Header = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between', className)} {...rest} />
)

const HeaderText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-[13px] font-medium uppercase tracking-[0.5px] text-subText', className)} {...rest} />
)

const RefreshButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'flex items-center rounded-lg border-0 bg-transparent p-1.5 text-subText',
      'cursor-pointer hover:bg-buttonBlack hover:text-text',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...rest}
  />
)

const Rows = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2.5', className)} {...rest} />
)

const Row = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between text-[13px]', className)} {...rest} />
)

const Label = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-subText', className)} {...rest} />
)

type ValueProps = HTMLAttributes<HTMLSpanElement> & { warn?: boolean; error?: boolean }

const Value = ({ className, warn, error, ...rest }: ValueProps) => (
  <span className={cn('font-medium', error ? 'text-red1' : warn ? 'text-warning' : 'text-text', className)} {...rest} />
)

const Skeleton = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-[14px] w-[70px] animate-pulse rounded-md bg-buttonBlack', className)} {...rest} />
)

const Divider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-px bg-border opacity-40', className)} {...rest} />
)

const ErrorText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('py-2 text-center text-[13px] text-red1', className)} {...rest} />
)

const HintText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('py-2 text-center text-[13px] text-subText', className)} {...rest} />
)

const ApplyButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'cursor-pointer rounded-full border border-primary bg-transparent px-2.5 py-[3px] text-[11px] font-medium text-primary',
      'hover:bg-primary hover:text-background',
      className,
    )}
    {...rest}
  />
)

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

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label>
                <Trans>Slippage tolerance</Trans>
              </Label>
              {shouldSuggest && (
                <ApplyButton type="button" onClick={() => updateSlippage(suggestedSlippage)}>
                  <Trans>Use {(suggestedSlippage / 100).toFixed(2)}%</Trans>
                </ApplyButton>
              )}
            </div>
            <SlippageControl
              rawSlippage={slippage}
              setRawSlippage={updateSlippage}
              isWarning={slippage > MAX_NORMAL_SLIPPAGE_IN_BIPS}
              options={DEFAULT_SLIPPAGES}
            />
          </div>
        </>
      )}
    </Card>
  )
}

export default RouteSummary
