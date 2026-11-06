import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import UpdatedBadge, { Props as UpdatedBadgeProps } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import { SwapReviewAmountCard } from 'components/SwapForm/SwapModal/SwapReviewLayout'
import { CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/trade'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { getCurrencyDisplaySymbol } from 'utils/tokenInfo'

type SwapReviewTokenAmountsProps = {
  inputAmount: CurrencyAmount<Currency>
  amountInUsd: string
  outputAmount: CurrencyAmount<Currency>
  outputAmountFromBuild: CurrencyAmount<Currency> | undefined
  amountOutUsdFromBuild: string | undefined
  isLoading: boolean
  currencyOut: Currency
} & UpdatedBadgeProps

const SwapReviewTokenAmounts = ({
  inputAmount,
  amountInUsd,
  outputAmount,
  outputAmountFromBuild,
  amountOutUsdFromBuild,
  $level,
  isLoading,
  currencyOut,
}: SwapReviewTokenAmountsProps) => {
  const { chainId } = useActiveWeb3React()
  const { displayTypedValue } = useSwapFormContext()

  return (
    <Stack className="min-w-0 gap-2">
      <SwapReviewAmountCard label={<Trans>Input Amount</Trans>}>
        <span className="min-w-0 flex-1 truncate text-2xl font-medium">{displayTypedValue}</span>
        <HStack className="shrink-0 items-center gap-2">
          <span className="text-sm font-medium text-subText">
            ~{formatDisplayNumber(amountInUsd, { style: 'currency', significantDigits: 4 })}
          </span>
          <CurrencyLogo currency={inputAmount.currency} size="24px" />
          <span className="text-xl font-medium text-subText">{getCurrencyDisplaySymbol(inputAmount.currency)}</span>
        </HStack>
      </SwapReviewAmountCard>

      <SwapReviewAmountCard
        isOutput
        label={
          <>
            {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
              <Trans>Output Amount (incl. fee)</Trans>
            ) : (
              <Trans>Output Amount</Trans>
            )}
            <UpdatedBadge $level={$level} outputAmount={outputAmount} />
          </>
        }
      >
        {isLoading ? (
          <div className="flex min-w-0 flex-1 items-center">
            <Skeleton width="100%" height={32} containerClassName="w-full max-w-40" variant="darkSubtle" />
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-2xl font-medium">
            {outputAmountFromBuild?.toExact() ?? '--'}
          </span>
        )}
        <HStack className="shrink-0 items-center gap-2">
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
        </HStack>
      </SwapReviewAmountCard>
    </Stack>
  )
}

export default SwapReviewTokenAmounts
