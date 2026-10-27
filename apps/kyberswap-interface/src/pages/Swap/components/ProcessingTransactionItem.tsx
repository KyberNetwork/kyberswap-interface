import { format } from 'date-fns'
import { ChevronRight } from 'react-feather'
import { formatUnits } from 'viem'

import CurrencyLogo from 'components/CurrencyLogo'
import Logo, { NetworkLogo } from 'components/Logo'
import { HStack } from 'components/Stack'
import type { Currency } from 'pages/Swap/crossChain/adapters/types'
import type { HistoryTransaction } from 'pages/Swap/crossChain/transactions/history'
import { useHistoryToken } from 'pages/Swap/crossChain/transactions/useHistoryToken'
import { formatDisplayNumber } from 'utils/numbers'

const TokenAmount = ({ token, amount, prefix }: { token: Currency | string; amount: string; prefix: '-' | '+' }) => {
  const currency = typeof token === 'string' ? undefined : token
  const symbol = currency?.symbol || (typeof token === 'string' ? token : '')
  let displayAmount = '--'
  if (currency) {
    try {
      displayAmount = formatDisplayNumber(formatUnits(BigInt(amount), currency.decimals), { significantDigits: 6 })
    } catch {
      // Keep an unresolved amount distinct from a real zero.
    }
  }
  const label = `${prefix}${displayAmount} ${symbol}`

  return (
    <HStack className="min-w-0 items-center gap-1">
      <span className="flex size-4 shrink-0">
        {currency && 'isNative' in currency ? (
          <CurrencyLogo currency={currency} size="16px" />
        ) : (
          <Logo
            srcs={[currency && 'logo' in currency ? currency.logo : '']}
            width={16}
            height={16}
            className="rounded-full"
            alt={symbol}
          />
        )}
      </span>
      <span className="truncate" title={label}>
        {label}
      </span>
    </HStack>
  )
}

const ProcessingTransactionItem = ({ tx }: { tx: HistoryTransaction }) => {
  const sourceToken = useHistoryToken(tx.sourceToken, tx.sourceChain)
  const targetToken = useHistoryToken(tx.targetToken, tx.targetChain)

  return (
    <li className="grid h-7 grid-cols-[48px_minmax(0,1fr)_80px] items-center gap-3 py-1 text-sm leading-5 text-subText max-sm:gap-2">
      <HStack className="items-center">
        <NetworkLogo chainId={tx.sourceChain} style={{ width: 16, height: 16, borderRadius: '50%' }} />
        <ChevronRight size={16} className="shrink-0 text-subText" aria-hidden />
        <NetworkLogo chainId={tx.targetChain} style={{ width: 16, height: 16, borderRadius: '50%' }} />
      </HStack>
      <div className="grid min-w-0 grid-cols-2 gap-3 max-sm:gap-2">
        <TokenAmount token={sourceToken} amount={tx.inputAmount} prefix="-" />
        <TokenAmount token={targetToken} amount={tx.outputAmount} prefix="+" />
      </div>
      <time dateTime={new Date(tx.timestamp).toISOString()} className="text-right text-xs leading-4 text-text2">
        {format(tx.timestamp, 'dd MMM yyyy')}
      </time>
    </li>
  )
}

export default ProcessingTransactionItem
