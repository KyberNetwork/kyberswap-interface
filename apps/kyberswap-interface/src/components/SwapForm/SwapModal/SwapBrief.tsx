import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ArrowDown } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import UpdatedBadge, { Props as UpdatedBadgeProps } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import { CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/trade'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { getCurrencyDisplaySymbol } from 'utils/tokenInfo'

type Props = {
  inputAmount: CurrencyAmount<Currency>
  amountInUsd: string
  outputAmount: CurrencyAmount<Currency>
  outputAmountFromBuild: CurrencyAmount<Currency> | undefined
  amountOutUsdFromBuild: string | undefined
  isLoading: boolean
  currencyOut: Currency
} & UpdatedBadgeProps

const SwapBrief = ({
  inputAmount,
  amountInUsd,
  outputAmount,
  outputAmountFromBuild,
  amountOutUsdFromBuild,
  $level,
  isLoading,
  currencyOut,
}: Props) => {
  const { chainId } = useActiveWeb3React()
  const { displayTypedValue } = useSwapFormContext()

  return (
    <Stack className="min-w-0 gap-2">
      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-solid border-border px-4 py-3">
        <span className="flex min-h-6 items-center text-xs font-medium text-subText">
          <Trans>Input Amount</Trans>
        </span>
        <div className="flex min-h-8 w-full items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-2xl font-medium">{displayTypedValue}</span>
          <div className="flex min-w-fit items-center gap-2">
            <span className="text-sm font-medium text-subText">
              ~{formatDisplayNumber(amountInUsd, { style: 'currency', significantDigits: 4 })}
            </span>
            <CurrencyLogo currency={inputAmount.currency} size="24px" />
            <span className="text-xl font-medium text-subText">{getCurrencyDisplaySymbol(inputAmount.currency)}</span>
          </div>
        </div>
      </div>

      <div className="relative flex min-w-0 flex-col gap-2 rounded-2xl border border-solid border-border px-4 py-3">
        <div className="absolute -top-1 left-1/2 z-[1] flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-solid border-border bg-buttonGray">
          <ArrowDown size="12" className="text-subText" />
        </div>
        <div className="flex min-h-6 items-center gap-1">
          <span className="text-xs font-medium text-subText">
            {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
              <Trans>Output Amount (incl. fee)</Trans>
            ) : (
              <Trans>Output Amount</Trans>
            )}
          </span>
          <UpdatedBadge $level={$level} outputAmount={outputAmount} />
        </div>
        <div className="flex min-h-8 w-full items-center justify-between gap-2">
          {isLoading ? (
            <Skeleton width="160px" height="32px" variant="darkSubtle" />
          ) : (
            <span className="min-w-0 flex-1 truncate text-2xl font-medium">
              {outputAmountFromBuild?.toExact() ?? '--'}
            </span>
          )}
          <div className="flex min-w-fit items-center gap-2">
            {isLoading ? (
              <Skeleton width="60px" height="20px" variant="darkSubtle" />
            ) : (
              <span className="text-sm font-medium text-subText">
                {amountOutUsdFromBuild
                  ? `~${formatDisplayNumber(amountOutUsdFromBuild, { style: 'currency', significantDigits: 4 })}`
                  : '--'}
              </span>
            )}
            <CurrencyLogo currency={currencyOut} size="24px" />
            <span className="text-xl font-medium text-subText">{getCurrencyDisplaySymbol(currencyOut)}</span>
          </div>
        </div>
      </div>
    </Stack>
  )
}

export default SwapBrief
