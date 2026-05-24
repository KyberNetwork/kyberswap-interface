import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { ArrowDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import UpdatedBadge, { Props as UpdatedBadgeProps } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import { CHAINS_SUPPORT_FEE_CONFIGS, RESERVE_USD_DECIMALS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { formattedNum } from 'utils'

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
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { typedValue } = useSwapFormContext()

  const renderOutputAmount = () => {
    if (isLoading) {
      return (
        <Skeleton
          width="108px"
          // there's border of 1px
          height="26.5px"
          baseColor={theme.border}
          highlightColor={theme.buttonGray}
          borderRadius="80px"
        />
      )
    }

    if (!outputAmountFromBuild) {
      return <span className="overflow-hidden text-ellipsis text-2xl font-medium">--</span>
    }

    return (
      <span className="overflow-hidden text-ellipsis text-2xl font-medium">
        {outputAmountFromBuild.toSignificant(RESERVE_USD_DECIMALS)}
      </span>
    )
  }

  const renderAmountOutUsd = () => {
    if (isLoading) {
      return (
        <Skeleton
          width="64px"
          // there's border of 1px
          height="15px"
          baseColor={theme.border}
          highlightColor={theme.buttonGray}
          borderRadius="80px"
        />
      )
    }

    if (!amountOutUsdFromBuild) {
      return <span className="text-sm font-medium text-subText">--</span>
    }

    return <span className="text-sm font-medium text-subText">~{formattedNum(amountOutUsdFromBuild, true)}</span>
  }

  return (
    <AutoColumn gap="sm" style={{ marginTop: '4px', position: 'relative' }}>
      <div className="flex flex-col gap-2 rounded-2xl border border-solid border-border px-4 py-3">
        <span className="text-xs font-medium text-subText">
          <Trans>Input Amount</Trans>
        </span>
        <div className="flex w-full items-center justify-between">
          <span className="overflow-hidden text-ellipsis text-2xl font-medium">{typedValue}</span>
          <div className="flex min-w-fit items-center gap-2">
            <span className="text-sm font-medium text-subText">~{formattedNum(amountInUsd, true)}</span>
            <CurrencyLogo currency={inputAmount.currency} size="24px" />
            <span className="text-xl font-medium text-subText">{inputAmount.currency.symbol}</span>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-[calc(76px-6px)] flex size-5 -translate-x-1/2 items-center justify-center rounded-full border border-solid border-border bg-buttonGray">
        <ArrowDown size="12" className="text-subText" />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-solid border-border px-4 py-3">
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
        <div className="flex w-full items-center justify-between">
          {renderOutputAmount()}
          <div className="flex min-w-fit items-center gap-2">
            {renderAmountOutUsd()}
            <CurrencyLogo currency={currencyOut} size="24px" />
            <span className="text-xl font-medium text-subText">{currencyOut.symbol}</span>
          </div>
        </div>
      </div>
    </AutoColumn>
  )
}
