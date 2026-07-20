import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { ArrowDown } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import UpdatedBadge, { Props as UpdatedBadgeProps } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import { CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/index'
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

export default function SwapBrief({
  inputAmount,
  amountInUsd,
  outputAmount,
  outputAmountFromBuild,
  amountOutUsdFromBuild,
  $level,
  isLoading,
  currencyOut,
}: Props) {
  const { chainId } = useActiveWeb3React()
  const { typedValue } = useSwapFormContext()

  const renderOutputAmount = () => {
    if (isLoading) {
      return <Skeleton width="160px" height="32px" variant="darkSubtle" />
    }

    if (!outputAmountFromBuild) {
      return <span className="min-w-0 flex-1 truncate text-2xl font-medium">--</span>
    }

    return <span className="min-w-0 flex-1 truncate text-2xl font-medium">{outputAmountFromBuild.toExact()}</span>
  }

  const renderAmountOutUsd = () => {
    if (isLoading) {
      return <Skeleton width="60px" height="20px" variant="darkSubtle" />
    }

    if (!amountOutUsdFromBuild) {
      return <span className="text-sm font-medium text-subText">--</span>
    }

    return (
      <span className="text-sm font-medium text-subText">
        ~{formatDisplayNumber(amountOutUsdFromBuild, { style: 'currency', significantDigits: 4 })}
      </span>
    )
  }

  return (
    <Stack className="min-w-0">
      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-solid border-border px-4 py-3">
        <span className="text-xs font-medium text-subText">
          <Trans>Input Amount</Trans>
        </span>
        <div className="flex w-full items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-2xl font-medium">{typedValue}</span>
          <div className="flex min-w-fit items-center gap-2">
            <span className="text-sm font-medium text-subText">
              ~{formatDisplayNumber(amountInUsd, { style: 'currency', significantDigits: 4 })}
            </span>
            <CurrencyLogo currency={inputAmount.currency} size="24px" />
            <span className="text-xl font-medium text-subText">{getCurrencyDisplaySymbol(inputAmount.currency)}</span>
          </div>
        </div>
      </div>

      <div className="z-[1] my-[-6px] flex size-5 items-center justify-center self-center rounded-full border border-solid border-border bg-buttonGray">
        <ArrowDown size="12" className="text-subText" />
      </div>

      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-solid border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-subText">
            {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
              <Trans>Output Amount (incl. fee)</Trans>
            ) : (
              <Trans>Output Amount</Trans>
            )}
          </span>
          <UpdatedBadge $level={$level} outputAmount={outputAmount} />
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          {renderOutputAmount()}
          <div className="flex min-w-fit items-center gap-2">
            {renderAmountOutUsd()}
            <CurrencyLogo currency={currencyOut} size="24px" />
            <span className="text-xl font-medium text-subText">{getCurrencyDisplaySymbol(currencyOut)}</span>
          </div>
        </div>
      </div>
    </Stack>
  )
}
