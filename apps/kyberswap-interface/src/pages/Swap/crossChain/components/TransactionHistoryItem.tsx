import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { format } from 'date-fns'
import { type HTMLAttributes, type ReactNode, useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { formatUnits } from 'viem'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import {
  type Chain,
  type Currency,
  NonEvmChain,
  NonEvmChainInfo,
  type TransactionStatus,
  isProcessingTransactionStatus,
} from 'pages/Swap/crossChain/adapters/types'
import { GasDropTransactionLine } from 'pages/Swap/crossChain/components/GasDropTransactionLine'
import { TokenLogoWithChain } from 'pages/Swap/crossChain/components/TokenLogoWithChain'
import { registry } from 'pages/Swap/crossChain/factory'
import type { HistoryTransaction } from 'pages/Swap/crossChain/transactions/history'
import { useHistoryToken } from 'pages/Swap/crossChain/transactions/useHistoryToken'
import { normalizeAdapterName } from 'pages/Swap/crossChain/utils'
import { ExternalLinkIcon } from 'theme'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const isEvmChainId = (chain: Chain): chain is ChainId => typeof chain === 'number'

const matchesToken = (token: Currency | string, query: string) => {
  if (typeof token === 'string') return token.toLowerCase().includes(query)
  return [
    token.symbol,
    'name' in token ? token.name : undefined,
    'address' in token ? token.address : undefined,
    'id' in token ? token.id : undefined,
    'assetId' in token ? token.assetId : undefined,
    'contractAddress' in token ? token.contractAddress : undefined,
  ].some(value => value?.toLowerCase().includes(query))
}

export const TransactionTableGrid = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
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

const getSourceExplorerLink = (tx: HistoryTransaction) => {
  if (tx.sourceChain === NonEvmChain.Near)
    return tx.fromBackend || tx.depositAddress
      ? `https://nearblocks.io/txns/${tx.sourceTxHash}`
      : `https://nearblocks.io/address/${tx.id}`
  if (tx.sourceChain === NonEvmChain.Bitcoin) return `https://mempool.space/tx/${tx.sourceTxHash}`
  if (tx.sourceChain === NonEvmChain.Solana) return `https://solscan.io/tx/${tx.sourceTxHash}`

  return NETWORKS_INFO[tx.sourceChain] ? getEtherscanLink(tx.sourceChain, tx.sourceTxHash, 'transaction') : ''
}

const getTargetExplorerLink = (tx: HistoryTransaction) => {
  if (!tx.targetTxHash) return ''
  if (!tx.fromBackend && tx.adapter.toLowerCase() === 'debridge')
    return `https://app.debridge.finance/order?orderId=${tx.targetTxHash}`
  if (tx.targetChain === NonEvmChain.Near) return `https://nearblocks.io/txns/${tx.targetTxHash}`
  if (tx.targetChain === NonEvmChain.Bitcoin) return `https://mempool.space/tx/${tx.targetTxHash}`
  if (tx.targetChain === NonEvmChain.Solana) return `https://solscan.io/tx/${tx.targetTxHash}`

  return NETWORKS_INFO[tx.targetChain] ? getEtherscanLink(tx.targetChain, tx.targetTxHash, 'transaction') : ''
}

const getChainLogo = (chain: Chain) =>
  (isEvmChainId(chain) ? NETWORKS_INFO[chain]?.icon : NonEvmChainInfo[chain]?.icon) || UnknownToken
const getChainName = (chain: Chain) =>
  (isEvmChainId(chain) ? NETWORKS_INFO[chain]?.name : NonEvmChainInfo[chain]?.name) || String(chain)

const StatusBadge = ({ status }: { status?: TransactionStatus }) => {
  const statusLabelMap: Record<TransactionStatus, string> = {
    Success: t`Success`,
    Failed: t`Failed`,
    Refunded: t`Refunded`,
    Processing: t`Processing`,
  }
  const normalizedStatus = status || 'Processing'

  return (
    <div
      className={cn(
        'flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
        normalizedStatus === 'Success'
          ? 'bg-primary-20 text-primary'
          : normalizedStatus === 'Failed'
          ? 'bg-red-20 text-red'
          : 'bg-warning-20 text-warning',
      )}
    >
      {statusLabelMap[normalizedStatus]}
    </div>
  )
}

const TransactionTime = ({ tx }: { tx: HistoryTransaction }) => {
  const adapter = registry.getAdapter(tx.adapter)
  const normalizedAdapterName = normalizeAdapterName(tx.adapter)
  const adapterAlias = adapter?.getAliases?.().find(alias => normalizeAdapterName(alias.name) === normalizedAdapterName)
  const adapterName = adapterAlias?.name || adapter?.getName() || tx.adapter
  const adapterIcon = adapterAlias?.icon || adapter?.getIcon()
  const txDate = new Date(tx.timestamp)
  const senderLabel = tx.sender?.includes('.near') ? tx.sender : shortenHash(tx.sender)

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <div className="flex min-w-fit items-center gap-1">
          <img
            src={adapterIcon || UnknownToken}
            className="size-4 rounded-full"
            width={16}
            height={16}
            alt={adapterName}
            title={adapterName}
          />
        </div>
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

const ChainRoute = ({ tx }: { tx: HistoryTransaction }) => {
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
  token: Currency | string
}

type TransactionAmountSize = 'sm' | 'xs'

const TokenAmountLine = ({ amount, chain, prefix, size = 'xs', token }: TransactionAmountLineProps) => {
  const currency = typeof token === 'string' ? undefined : token
  const symbol =
    typeof token === 'string' ? (token.length > 14 ? `${token.slice(0, 6)}…${token.slice(-4)}` : token) : token.symbol
  const decimals = currency?.decimals
  const formattedAmount = useMemo(() => {
    if (decimals === undefined) return '--'
    try {
      return formatDisplayNumber(formatUnits(BigInt(amount || '0'), decimals), { significantDigits: 6 })
    } catch {
      return '--'
    }
  }, [amount, decimals])

  return (
    <div className="flex min-w-0 items-center gap-1 max-sm:justify-between">
      <TokenLogoWithChain chainId={chain} currency={currency} />
      <span className={cn('truncate font-medium text-subText', size === 'sm' ? 'text-sm' : 'text-xs')}>
        {prefix}
        {formattedAmount} {symbol}
      </span>
    </div>
  )
}

const TransactionAmount = ({ size = 'sm', tx }: { size?: TransactionAmountSize; tx: HistoryTransaction }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <TokenAmountLine amount={tx.inputAmount} chain={tx.sourceChain} prefix="-" size={size} token={tx.sourceToken} />
    <TokenAmountLine amount={tx.outputAmount} chain={tx.targetChain} prefix="+" size={size} token={tx.targetToken} />
    {tx.gasDrop && <GasDropTransactionLine tx={tx} />}
  </div>
)

const TransactionHashLink = ({ hash, href }: { hash: string; href: string }) => (
  <div className="flex min-w-0 items-center gap-2">
    <span className="truncate text-sm font-medium text-subText">{shortenHash(hash)}</span>
    {href && <ExternalLinkIcon className="w-4 shrink-0 text-subText" href={href} />}
  </div>
)

const FillTransaction = ({ tx }: { tx: HistoryTransaction }) => {
  if (tx.targetTxHash) {
    return <TransactionHashLink hash={tx.targetTxHash} href={getTargetExplorerLink(tx)} />
  }

  if (isProcessingTransactionStatus(tx.status)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-subText" role="status">
        <Loader size="14px" className="shrink-0 text-subText motion-reduce:animate-none" aria-hidden />
        {t`Pending`}
      </span>
    )
  }

  return <span className="text-sm font-medium text-subText">··· ···</span>
}

const MobileDetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex min-w-0 items-center justify-between gap-3">
    <span className="shrink-0 text-sm font-medium text-text">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

const TransactionCard = ({ tx }: { tx: HistoryTransaction }) => (
  <div className="flex flex-col gap-2 rounded-lg border border-darkBorder p-3 hover:bg-background-60">
    <div className="flex items-start justify-between gap-3">
      <TransactionTime tx={tx} />
      <StatusBadge status={tx.status} />
    </div>

    <div className="flex items-center justify-between gap-3">
      <ChainRoute tx={tx} />
      <TransactionAmount tx={tx} />
    </div>

    <MobileDetailRow label={t`Deposit:`}>
      <TransactionHashLink hash={tx.sourceTxHash} href={getSourceExplorerLink(tx)} />
    </MobileDetailRow>
    <MobileDetailRow label={t`Fill:`}>
      <FillTransaction tx={tx} />
    </MobileDetailRow>
  </div>
)

const TransactionRow = ({ showPagination, tx }: { showPagination: boolean; tx: HistoryTransaction }) => (
  <TransactionTableGrid
    className={cn(
      'min-h-16 border-b border-border/20 px-4 py-3 hover:bg-background-60',
      !showPagination && 'last:border-b-0',
    )}
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

type TransactionHistoryItemProps = {
  tx: HistoryTransaction
  mobile: boolean
  showPagination: boolean
  filter?: string
}

export const TransactionHistoryItem = ({ tx, mobile, showPagination, filter }: TransactionHistoryItemProps) => {
  const sourceToken = useHistoryToken(tx.sourceToken, tx.sourceChain)
  const targetToken = useHistoryToken(tx.targetToken, tx.targetChain)
  // Lookup must stay mounted while filtered out: a symbol search can start
  // before metadata arrives. Match raw IDs too (including native sentinels).
  if (filter && ![tx.sourceToken, tx.targetToken, sourceToken, targetToken].some(token => matchesToken(token, filter)))
    return null
  const resolved = { ...tx, sourceToken, targetToken }
  return mobile ? <TransactionCard tx={resolved} /> : <TransactionRow tx={resolved} showPagination={showPagination} />
}
