import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'
import { formatUnits } from 'viem'

import GasStation from 'components/Icons/GasStation'
import Skeleton from 'components/Skeleton'
import { MouseoverTooltip } from 'components/Tooltip'
import { NativeCurrencies } from 'constants/tokens'
import { useCurrencyV2 } from 'hooks/useTokens'
import { useKyberCrossSwap } from 'pages/KyberCross/hooks/useKyberCrossSwap'
import { Chain, GasDropQuote } from 'pages/Swap/crossChain/adapters/types'
import { getChainName } from 'pages/Swap/crossChain/utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

export const GasDropPanel = ({ lowGas }: { lowGas: boolean }) => {
  const { gasDropEnabled, setGasDropEnabled, gasDropError, toChainId, selectedQuote } = useKyberCrossSwap()
  if (!toChainId) return null
  const native = NativeCurrencies[toChainId as ChainId]
  const chain = getChainName(toChainId)
  const symbol = native?.symbol
  const usd = selectedQuote?.quote.gasDrop?.inputAmountUsd
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border p-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <GasStation size={16} color="currentColor" />
          <Trans>Get gas on {chain}</Trans>
        </span>
        <button
          type="button"
          role="switch"
          aria-label={t`Gas Drop`}
          aria-checked={gasDropEnabled}
          onClick={() => setGasDropEnabled(!gasDropEnabled)}
          className={cn('relative h-5 w-9 shrink-0 rounded-full', gasDropEnabled ? 'bg-primary-20' : 'bg-buttonBlack')}
        >
          <span
            className={cn(
              'absolute top-0.5 size-4 rounded-full transition-all',
              gasDropEnabled ? 'left-[18px] bg-primary' : 'left-0.5 bg-border',
            )}
          />
        </button>
      </div>
      <span className="text-subText">
        {lowGas && (
          <>
            <Trans>Your recipient is low on {symbol} for gas.</Trans>{' '}
          </>
        )}
        {usd ? (
          <Trans>
            Add ~{formatDisplayNumber(usd, { style: 'currency', fractionDigits: 2 })} of {symbol}, deducted from your
            output.
          </Trans>
        ) : (
          <Trans>Receive {symbol} for gas, deducted from your output.</Trans>
        )}
      </span>
      {gasDropError && (
        <span className="text-warning" role="alert">
          {gasDropError}
        </span>
      )}
    </div>
  )
}

export const GasDropQuoteLine = ({
  gasDrop,
  chain,
  loading,
  onRemove,
}: {
  gasDrop?: GasDropQuote
  chain: Chain
  loading?: boolean
  onRemove?: () => void
}) => {
  const native = NativeCurrencies[chain as ChainId]
  const bridgeToken = useCurrencyV2(gasDrop?.inputToken, chain as ChainId)
  if (!native || (!gasDrop && !loading)) return null
  const format = (amount: string) =>
    formatDisplayNumber(formatUnits(BigInt(amount), native.decimals), { significantDigits: 6 })
  const slippage =
    gasDrop && BigInt(gasDrop.amount) > 0n
      ? Number(((BigInt(gasDrop.amount) - BigInt(gasDrop.minAmount)) * 10_000n) / BigInt(gasDrop.amount)) / 100
      : 0
  const fallbackToken = bridgeToken?.symbol || t`bridged token`
  const minAmount = gasDrop ? format(gasDrop.minAmount) : ''
  const symbol = native.symbol
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <MouseoverTooltip
        text={
          gasDrop
            ? t`Min ${minAmount} ${symbol} (${slippage}% slippage). If it can't fill, you receive the gas allocation in ${fallbackToken} instead.`
            : ''
        }
      >
        <span className="border-b border-dotted border-border text-subText">{t`Gas Drop`}</span>
      </MouseoverTooltip>
      {loading ? (
        <Skeleton width="130px" height="16px" />
      ) : (
        gasDrop && (
          <span className="flex items-center gap-1 text-primary">
            +{format(gasDrop.amount)} {native.symbol}
            {gasDrop.amountUsd ? (
              <span className="text-subText">
                ~{formatDisplayNumber(gasDrop.amountUsd, { style: 'currency', fractionDigits: 2 })}
              </span>
            ) : null}
            {onRemove && (
              <button
                type="button"
                aria-label={t`Remove Gas Drop`}
                onClick={onRemove}
                className="flex text-subText hover:text-text"
              >
                <X size={14} />
              </button>
            )}
          </span>
        )
      )}
    </div>
  )
}
