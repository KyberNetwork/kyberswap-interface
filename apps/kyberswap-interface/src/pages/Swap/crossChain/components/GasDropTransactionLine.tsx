import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { formatUnits } from 'viem'

import { NativeCurrencies } from 'constants/tokens'
import { useCurrencyV2 } from 'hooks/useTokens'
import { NormalizedTxResponse } from 'pages/Swap/crossChain/adapters/types'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

export const GasDropTransactionLine = ({
  tx,
}: {
  tx: Pick<NormalizedTxResponse, 'targetChain' | 'gasDrop' | 'gasDropStatus' | 'status' | 'targetTxHash'>
}) => {
  const native = NativeCurrencies[tx.targetChain as ChainId]
  const bridgeToken = useCurrencyV2(tx.gasDrop?.inputToken, tx.targetChain as ChainId)
  if (!tx.gasDrop || !native || tx.gasDropStatus?.status === 'NotExecuted') return null
  const status = tx.gasDropStatus?.status || 'Pending'
  const amount = tx.gasDropStatus?.amount
  const token = bridgeToken?.symbol || t`bridged token`
  const usd = tx.gasDrop.inputAmountUsd
  const formattedUsd = usd ? formatDisplayNumber(usd, { style: 'currency', fractionDigits: 2 }) : ''
  const text =
    status === 'Delivered' && amount
      ? `+${formatDisplayNumber(formatUnits(BigInt(amount), native.decimals), { significantDigits: 6 })} ${
          native.symbol
        } gas`
      : status === 'Failed'
      ? tx.status !== 'Success' && tx.status !== 'Refunded'
        ? t`Not delivered`
        : usd
        ? t`Received ~${formattedUsd} as ${token} instead`
        : t`Gas allocation returned as ${token}`
      : t`Pending`
  return (
    <div className={cn('text-xs', status === 'Failed' ? 'text-warning' : 'text-subText')}>
      {t`Gas Drop`} · {text}
      {status === 'Delivered' && tx.targetTxHash && (
        <ExternalLink
          className="ml-1"
          href={getEtherscanLink(tx.targetChain as ChainId, tx.targetTxHash, 'transaction')}
        >
          ↗
        </ExternalLink>
      )}
    </div>
  )
}
