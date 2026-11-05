import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { formatUnits } from 'viem'

import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import { NativeCurrencies } from 'constants/tokens'
import { useGasDropValue } from 'pages/Swap/crossChain/hooks/useGasDropValue'
import { Chain, GasDropQuote } from 'types/crossChain'
import { formatDisplayNumber } from 'utils/numbers'

type GasDropQuoteLineProps = {
  gasDrop?: Pick<GasDropQuote, 'amount' | 'amountUsd'>
  chain: Chain
  loading?: boolean
}

export const GasDropQuoteLine = ({ gasDrop, chain, loading }: GasDropQuoteLineProps) => {
  const native = NativeCurrencies[chain as ChainId]
  const { amountUsd } = useGasDropValue(gasDrop, chain)
  if (!native || (!gasDrop && !loading)) return null
  const format = (amount: string) =>
    formatDisplayNumber(formatUnits(BigInt(amount), native.decimals), { significantDigits: 6 })
  const usd = amountUsd != null ? formatDisplayNumber(amountUsd, { style: 'currency', fractionDigits: 2 }) : undefined
  return (
    <HStack className="items-center gap-1 text-xs font-medium">
      <span className="text-subText">{t`Gas Drop`}</span>
      {loading ? (
        <Skeleton width="130px" height="16px" />
      ) : (
        gasDrop && (
          <span className="flex items-center gap-1 text-text">
            {format(gasDrop.amount)} {native.symbol}
            {usd && <span className="text-subText">(~{usd})</span>}
          </span>
        )
      )}
    </HStack>
  )
}
