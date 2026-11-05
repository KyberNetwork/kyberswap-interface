import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import GasStation from 'components/Icons/GasStation'
import { NativeCurrencies } from 'constants/tokens'
import { useKyberCrossSwap } from 'pages/KyberCross/hooks/useKyberCrossSwap'
import { getChainName } from 'pages/Swap/crossChain/utils'
import { formatDisplayNumber } from 'utils/numbers'

export const GasDropPanel = ({ lowGas }: { lowGas: boolean }) => {
  const { gasDropError, toChainId, selectedQuote } = useKyberCrossSwap()
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
