import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'

import { Balance, BalanceSkeleton } from 'components/TokenSelectorModal/components'

type Props = {
  currency: Currency
  balance?: CurrencyAmount<Currency>
  hidden?: boolean
  loading?: boolean
  unknown?: boolean
}

/** Missing balances remain distinct from a known zero and from disconnected wallets. */
export const TokenBalance = ({ currency, balance, hidden, loading, unknown }: Props) => {
  if (hidden) return <span className="max-w-full truncate text-xs text-text sm:text-sm">******</span>
  if (balance) return <Balance balance={balance} />
  if (loading) return <BalanceSkeleton currency={currency} />
  return (
    <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-balance">
      {unknown ? '--' : '0'}
    </span>
  )
}
