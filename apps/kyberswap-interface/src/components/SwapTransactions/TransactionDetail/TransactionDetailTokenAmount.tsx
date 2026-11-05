import { t } from '@lingui/macro'
import { formatUnits } from 'viem'

import Skeleton from 'components/Skeleton'
import { useHistoryTokens } from 'components/SwapTransactions/useHistoryTokens'
import type { Chain, Currency } from 'types/crossChain'
import { shortenHash } from 'utils/address'
import { formatDisplayNumber } from 'utils/numbers'

const TransactionDetailTokenAmount = ({
  token,
  amount,
  chain,
}: {
  token: Currency | string
  amount?: string
  chain: Chain
}) => {
  const { resolve, loading } = useHistoryTokens([{ token, chain }])
  const resolved = resolve(token, chain)
  const currency = typeof resolved === 'string' ? undefined : resolved

  if (!currency && loading)
    return <Skeleton inline width={112} height="1em" containerClassName="inline-block align-middle" variant="muted" />

  let displayAmount = '--'
  if (amount !== undefined && currency) {
    try {
      displayAmount = formatDisplayNumber(formatUnits(BigInt(amount), currency.decimals), { significantDigits: 6 })
    } catch {
      /* Keep unknown amounts distinct from zero. */
    }
  }
  const symbol =
    currency?.symbol || (typeof resolved === 'string' && resolved ? shortenHash(resolved) : t`Unknown token`)

  return (
    <span title={typeof resolved === 'string' ? resolved : undefined}>
      {displayAmount} {symbol}
    </span>
  )
}

export default TransactionDetailTokenAmount
