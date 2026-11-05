import { format } from 'date-fns'
import { ChevronRight } from 'react-feather'
import { formatUnits } from 'viem'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import Logo, { NetworkLogo } from 'components/Logo'
import { HStack } from 'components/Stack'
import { registry } from 'pages/Swap/crossChain/factory'
import { normalizeAdapterName } from 'pages/Swap/crossChain/utils'
import { useTransactionDetailTrigger } from 'pages/Swap/transactions/TransactionDetailProvider'
import type { HistoryTransaction } from 'pages/Swap/transactions/history'
import { useHistoryToken } from 'pages/Swap/transactions/useHistoryToken'
import type { Currency } from 'types/crossChain'
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

const TransactionProvider = ({ tx }: { tx: HistoryTransaction }) => {
  const adapter = registry.getAdapter(tx.adapter)
  const normalizedName = normalizeAdapterName(tx.adapter)
  const alias = adapter?.getAliases?.().find(item => normalizeAdapterName(item.name) === normalizedName)
  const name = alias?.name || adapter?.getName() || tx.adapter
  const icon = alias?.icon || adapter?.getIcon() || UnknownToken

  return (
    <HStack className="min-w-0 items-center gap-1.5 max-sm:hidden">
      <img src={icon} className="size-4 shrink-0 rounded-full" width={16} height={16} alt="" />
      <span className="truncate text-sm font-medium text-text" title={name}>
        {name}
      </span>
    </HStack>
  )
}

const StatusBadge = ({ status }: { status: HistoryTransaction['status'] }) => (
  <span className="w-fit shrink-0 rounded-full bg-warning-20 px-2 py-0.5 text-xs font-medium text-warning max-sm:hidden">
    {status || 'Processing'}
  </span>
)

const ProcessingTransactionItem = ({ tx }: { tx: HistoryTransaction }) => {
  const sourceToken = useHistoryToken(tx.sourceToken, tx.sourceChain)
  const targetToken = useHistoryToken(tx.targetToken, tx.targetChain)
  const trigger = useTransactionDetailTrigger({ ...tx, sourceToken, targetToken })

  return (
    <li
      {...trigger}
      className="grid h-7 grid-cols-[minmax(120px,1fr)_64px_88px_minmax(156px,1.3fr)_132px] items-center gap-3 py-1 text-sm leading-5 text-subText max-sm:grid-cols-[48px_minmax(0,1fr)_80px] max-sm:gap-2 [&[role=button]]:cursor-pointer [&[role=button]]:rounded [&[role=button]]:hover:bg-tableHeader [&[role=button]]:focus-visible:ring-1 [&[role=button]]:focus-visible:ring-primary"
    >
      <TransactionProvider tx={tx} />
      <HStack className="items-center">
        <NetworkLogo chainId={tx.sourceChain} style={{ width: 16, height: 16, borderRadius: '50%' }} />
        <ChevronRight size={16} className="shrink-0 text-subText" aria-hidden />
        <NetworkLogo chainId={tx.targetChain} style={{ width: 16, height: 16, borderRadius: '50%' }} />
      </HStack>
      <StatusBadge status={tx.status} />
      <div className="grid min-w-0 grid-cols-2 gap-3 max-sm:gap-2">
        <TokenAmount token={sourceToken} amount={tx.inputAmount} prefix="-" />
        <TokenAmount token={targetToken} amount={tx.outputAmount} prefix="+" />
      </div>
      <time
        dateTime={new Date(tx.timestamp).toISOString()}
        className="whitespace-nowrap text-right text-xs leading-4 text-text2"
      >
        {format(tx.timestamp, 'dd/MM/yyyy HH:mm:ss')}
      </time>
    </li>
  )
}

export default ProcessingTransactionItem
