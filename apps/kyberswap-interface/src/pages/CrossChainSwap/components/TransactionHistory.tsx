import { type ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { format } from 'date-fns'
import { type HTMLAttributes, type ReactNode, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { useMedia } from 'react-use'
import { formatUnits } from 'viem'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import CopyHelper from 'components/Copy'
import Pagination from 'components/Pagination'
import Skeleton from 'components/Skeleton'
import { NETWORKS_INFO } from 'constants/networks'
import {
  type Chain,
  type Currency,
  NonEvmChain,
  NonEvmChainInfo,
  type NormalizedTxResponse,
} from 'pages/CrossChainSwap/adapters/types'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import {
  type TransactionStatus,
  isProcessingTransactionStatus,
  useTransactionHistory,
} from 'pages/CrossChainSwap/hooks/useTransactionHistory'
import { getChainName } from 'pages/CrossChainSwap/utils'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink, shortenHash } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const PAGE_SIZE = 6

const isEvmChainId = (chain: Chain): chain is ChainId => typeof chain === 'number'

const TransactionTableGrid = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[minmax(160px,1fr)_minmax(80px,0.5fr)_minmax(80px,0.5fr)_minmax(180px,1fr)_minmax(160px,1fr)] items-center gap-3',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const TransactionTableHeaderCell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('text-xs font-medium uppercase tracking-[0.04em] text-subText', className)}>{children}</span>
)

const getSourceExplorerLink = (tx: NormalizedTxResponse) => {
  if (tx.sourceChain === NonEvmChain.Near) return `https://nearblocks.io/address/${tx.id}`
  if (tx.sourceChain === NonEvmChain.Bitcoin) return `https://mempool.space/tx/${tx.sourceTxHash}`
  if (tx.sourceChain === NonEvmChain.Solana) return `https://solscan.io/tx/${tx.sourceTxHash}`

  return getEtherscanLink(tx.sourceChain, tx.sourceTxHash, 'transaction')
}

const getTargetExplorerLink = (tx: NormalizedTxResponse) => {
  if (!tx.targetTxHash) return ''
  if (tx.adapter.toLowerCase() === 'debridge') return `https://app.debridge.finance/order?orderId=${tx.targetTxHash}`
  if (tx.targetChain === NonEvmChain.Near) return `https://nearblocks.io/txns/${tx.targetTxHash}`
  if (tx.targetChain === NonEvmChain.Bitcoin) return `https://mempool.space/tx/${tx.targetTxHash}`
  if (tx.targetChain === NonEvmChain.Solana) return `https://solscan.io/tx/${tx.targetTxHash}`

  return getEtherscanLink(tx.targetChain, tx.targetTxHash, 'transaction')
}

const getChainLogo = (chain: Chain) => (isEvmChainId(chain) ? NETWORKS_INFO[chain].icon : NonEvmChainInfo[chain].icon)

const StatusBadge = ({ status }: { status?: TransactionStatus }) => {
  const statusLabelMap: Record<TransactionStatus, string> = {
    Success: t`Success`,
    Failed: t`Failed`,
    Refunded: t`Refunded`,
    Processing: t`Processing`,
  }
  const statusClassMap: Record<TransactionStatus, string> = {
    Success: 'bg-primary-20 text-primary',
    Failed: 'bg-red-20 text-red',
    Refunded: 'bg-warning-20 text-warning',
    Processing: 'bg-warning-20 text-warning',
  }
  const normalizedStatus = status || 'Processing'

  return (
    <div
      className={cn(
        'flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
        statusClassMap[normalizedStatus],
      )}
    >
      {statusLabelMap[normalizedStatus]}
    </div>
  )
}

const TransactionTime = ({ tx }: { tx: NormalizedTxResponse }) => {
  const adapter = registry.getAdapter(tx.adapter)
  const adapterName = adapter?.getName() || tx.adapter
  const adapterIcon = adapter?.getIcon()
  const txDate = new Date(tx.timestamp)
  const senderLabel = tx.sender?.includes('.near') ? tx.sender : shortenHash(tx.sender)

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2 whitespace-nowrap">
        {adapterIcon && (
          <img src={adapterIcon} className="size-4 rounded-full" width={16} height={16} alt={adapterName} />
        )}
        <span className="text-sm font-medium text-text">{format(txDate, 'dd/MM/yyyy')}</span>
        <span className="text-sm font-medium text-subText">{format(txDate, 'HH:mm:ss')}</span>
      </div>
      {tx.sender && (
        <div className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 text-sm font-medium text-subText">{t`Sender:`}</span>
          <span className="truncate text-sm font-medium text-blue">{senderLabel}</span>
          <CopyHelper toCopy={tx.sender} />
        </div>
      )}
    </div>
  )
}

const ChainRoute = ({ tx }: { tx: NormalizedTxResponse }) => {
  const sourceChainLogo = getChainLogo(tx.sourceChain)
  const targetChainLogo = getChainLogo(tx.targetChain)

  return (
    <div className="flex items-center gap-1">
      {sourceChainLogo && (
        <img
          src={sourceChainLogo}
          alt={getChainName(tx.sourceChain)}
          width={20}
          height={20}
          className="size-5 rounded-full"
        />
      )}
      <ChevronRight size={14} className="shrink-0 text-subText" />
      {targetChainLogo && (
        <img
          src={targetChainLogo}
          alt={getChainName(tx.targetChain)}
          width={20}
          height={20}
          className="size-5 rounded-full"
        />
      )}
    </div>
  )
}

type TransactionAmountLineProps = {
  amount: string
  chain: Chain
  prefix: '-' | '+'
  size?: TransactionAmountSize
  token: Currency
}

type TransactionAmountSize = 'sm' | 'xs'

const transactionAmountSizeClass: Record<TransactionAmountSize, string> = {
  sm: 'text-sm',
  xs: 'text-xs',
}

const TokenAmountLine = ({ amount, chain, prefix, size = 'xs', token }: TransactionAmountLineProps) => {
  const formattedAmount = useMemo(() => {
    try {
      return formatDisplayNumber(formatUnits(BigInt(amount || '0'), token.decimals), { significantDigits: 6 })
    } catch {
      return '--'
    }
  }, [amount, token.decimals])

  return (
    <div className="flex min-w-0 items-center gap-1 max-sm:justify-between">
      <TokenLogoWithChain chainId={chain} currency={token} />
      <span className={cn('truncate font-medium text-subText', transactionAmountSizeClass[size])}>
        {prefix}
        {formattedAmount} {token.symbol}
      </span>
    </div>
  )
}

const TransactionAmount = ({ size = 'xs', tx }: { size?: TransactionAmountSize; tx: NormalizedTxResponse }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <TokenAmountLine amount={tx.inputAmount} chain={tx.sourceChain} prefix="-" size={size} token={tx.sourceToken} />
    <TokenAmountLine amount={tx.outputAmount} chain={tx.targetChain} prefix="+" size={size} token={tx.targetToken} />
  </div>
)

const TransactionHashLink = ({ hash, href }: { hash: string; href: string }) => (
  <div className="flex min-w-0 items-center gap-2">
    <span className="truncate text-sm font-medium text-subText">{shortenHash(hash)}</span>
    <ExternalLinkIcon className="w-4 shrink-0 text-subText" href={href} />
  </div>
)

const FillTransaction = ({ tx }: { tx: NormalizedTxResponse }) => {
  if (tx.targetTxHash) {
    return <TransactionHashLink hash={tx.targetTxHash} href={getTargetExplorerLink(tx)} />
  }

  if (isProcessingTransactionStatus(tx.status)) {
    return <Skeleton height="16px" width="104px" />
  }

  return <span className="mr-1 text-sm font-medium text-subText">··· ···</span>
}

const MobileDetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex min-w-0 items-center justify-between gap-3">
    <span className="shrink-0 text-sm font-medium text-text">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

const TransactionCard = ({ tx }: { tx: NormalizedTxResponse }) => (
  <div className="flex flex-col gap-2 rounded-lg border border-darkBorder p-3 hover:bg-background-60">
    <div className="flex items-start justify-between gap-3">
      <TransactionTime tx={tx} />
      <StatusBadge status={tx.status} />
    </div>

    <div className="flex items-center justify-between gap-3">
      <ChainRoute tx={tx} />
      <TransactionAmount size="sm" tx={tx} />
    </div>

    <MobileDetailRow label={t`Deposit:`}>
      <TransactionHashLink hash={tx.sourceTxHash} href={getSourceExplorerLink(tx)} />
    </MobileDetailRow>
    <MobileDetailRow label={t`Fill:`}>
      <FillTransaction tx={tx} />
    </MobileDetailRow>
  </div>
)

const TransactionRow = ({ isLast, tx }: { isLast: boolean; tx: NormalizedTxResponse }) => (
  <TransactionTableGrid
    className={cn('min-h-16 border-b border-border/20 px-4 py-3 hover:bg-background-60', isLast && 'border-b-0')}
  >
    <TransactionTime tx={tx} />
    <StatusBadge status={tx.status} />
    <ChainRoute tx={tx} />
    <TransactionAmount tx={tx} />
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 justify-end gap-2">
        <span className="shrink-0 text-sm font-medium text-text">{t`Deposit:`}</span>
        <TransactionHashLink hash={tx.sourceTxHash} href={getSourceExplorerLink(tx)} />
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        <span className="shrink-0 text-sm font-medium text-text">{t`Fill:`}</span>
        <FillTransaction tx={tx} />
      </div>
    </div>
  </TransactionTableGrid>
)

const TransactionHistory = () => {
  const transactions = useTransactionHistory()
  const [currentPage, setCurrentPage] = useState(1)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const lastPage = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  const visibleTransactions = useMemo(
    () => transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, transactions],
  )
  const showPagination = transactions.length > PAGE_SIZE

  useEffect(() => {
    if (currentPage > lastPage) {
      setCurrentPage(lastPage)
    }
  }, [currentPage, lastPage])

  return (
    <div className="w-full overflow-hidden rounded-xl border border-darkBorder max-sm:rounded-lg">
      {upToSmall ? (
        <div className="cursor-default bg-background px-4 py-3">
          <TransactionTableHeaderCell>{t`History`}</TransactionTableHeaderCell>
        </div>
      ) : (
        <TransactionTableGrid className="cursor-default bg-background px-4 py-3">
          <TransactionTableHeaderCell>{t`Created`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell>{t`Status`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell>{t`Route`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell>{t`Amount`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell className="text-right">{t`Actions`}</TransactionTableHeaderCell>
        </TransactionTableGrid>
      )}

      <div className={cn(upToSmall && transactions.length > 0 ? 'flex flex-col gap-3 p-3' : '')}>
        {transactions.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-6">
            <NoTransactionIcon className="size-20" />
            <span className="text-center text-sm font-medium text-subText">{t`No historical data available.`}</span>
          </div>
        ) : (
          visibleTransactions.map((tx, index) =>
            upToSmall ? (
              <TransactionCard key={tx.id} tx={tx} />
            ) : (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isLast={!showPagination && index === visibleTransactions.length - 1}
              />
            ),
          )
        )}
      </div>

      {showPagination && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <Pagination
            onPageChange={setCurrentPage}
            totalCount={transactions.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            haveBg={false}
            className="!p-0"
          />
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
