import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type MouseEvent, type ReactNode } from 'react'
import { Trash2 } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { TokenBalance } from 'components/TokenSelectorModal/TokenBalance'
import { cn } from 'utils/cn'
import { formatBigLiquidity } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'

const ValueColumn = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Stack
    className={cn('items-end gap-0.5 overflow-hidden', className === undefined ? 'w-[72px] sm:w-[104px]' : className)}
  >
    {children}
  </Stack>
)

type Props = {
  currency: Currency
  currencyBalance?: CurrencyAmount<Currency>
  rightColumn: 'balance' | 'metric' | 'import'
  rightColumnClassName?: string
  showPriceColumn?: boolean
  priceUsd?: number
  priceChange24h?: number
  metricValue?: number
  customBalance?: ReactNode
  hideBalance?: boolean
  showLoading?: boolean
  balanceUnknown?: boolean
  usdBalance?: number
  usdValueClassName: string
  onImportToken?: (token: Token) => void
  onRemoveImportedToken?: (token: Token) => void
}

export const TokenRowValues = ({
  currency,
  currencyBalance,
  rightColumn,
  rightColumnClassName,
  showPriceColumn,
  priceUsd,
  priceChange24h,
  metricValue,
  customBalance,
  hideBalance,
  showLoading,
  balanceUnknown,
  usdBalance,
  usdValueClassName,
  onImportToken,
  onRemoveImportedToken,
}: Props) => {
  const isImport = rightColumn === 'import'
  const onClickRemove = (event: MouseEvent) => {
    event.stopPropagation()
    onRemoveImportedToken?.(currency as Token)
  }
  return (
    <HStack className="shrink-0 items-center gap-3 justify-self-end">
      {showPriceColumn && (
        <Stack className={cn('w-[72px] items-end gap-0.5 overflow-hidden sm:w-[132px]', isImport && 'opacity-50')}>
          <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-price">
            {priceUsd ? formatDisplayNumber(priceUsd, { style: 'currency', significantDigits: 6 }) : '--'}
          </span>
          {priceChange24h !== undefined && (
            <span
              className={cn('text-xs', priceChange24h >= 0 ? 'text-primary' : 'text-red')}
              data-testid="token-price-change"
            >
              {priceChange24h >= 0 ? '+' : '-'}
              {formatDisplayNumber(Math.abs(priceChange24h) / 100, { style: 'percent', fractionDigits: 2 })}
            </span>
          )}
        </Stack>
      )}

      {isImport ? (
        <ValueColumn className={rightColumnClassName}>
          <ButtonPrimary
            data-testid="button-import-token"
            width="fit-content"
            padding="6px 16px"
            fontWeight={500}
            fontSize="14px"
            className="transition"
            onClick={e => {
              e.stopPropagation()
              onImportToken?.(currency.wrapped)
            }}
          >
            <Trans>Import</Trans>
          </ButtonPrimary>
        </ValueColumn>
      ) : rightColumn === 'metric' ? (
        <ValueColumn className={rightColumnClassName}>
          <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-metric">
            {/* Only a missing metric reads "--"; a real zero is data and renders as an amount. */}
            {metricValue === undefined ? '--' : formatBigLiquidity(String(metricValue), 2, true)}
          </span>
        </ValueColumn>
      ) : (
        <ValueColumn className={rightColumnClassName}>
          {customBalance !== undefined ? (
            customBalance
          ) : (
            <TokenBalance
              currency={currency}
              balance={currencyBalance}
              hidden={hideBalance}
              loading={showLoading}
              unknown={balanceUnknown}
            />
          )}
          {!!usdBalance && !hideBalance && (
            <span className={cn('text-xs', usdValueClassName)} data-testid="token-usd-value">
              {formatDisplayNumber(usdBalance, { style: 'currency', significantDigits: 4 })}
            </span>
          )}
        </ValueColumn>
      )}
      {onRemoveImportedToken && (
        <button
          type="button"
          aria-label={t`Remove imported token`}
          onClick={onClickRemove}
          onKeyDown={event => event.stopPropagation()}
          data-testid="button-remove-import-token"
          className="flex size-6 shrink-0 items-center justify-center rounded text-subText transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Trash2 className="size-4 shrink-0" aria-hidden />
        </button>
      )}
    </HStack>
  )
}
