import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { format } from 'date-fns'
import { type HTMLAttributes, type ReactNode, useMemo } from 'react'
import { ChevronRight, CornerDownLeft } from 'react-feather'
import { registry } from 'services/crossChain/factory'
import { normalizeAdapterName } from 'services/crossChain/utils'
import { formatUnits } from 'viem'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { useGasDropValue } from 'components/GasDrop/useGasDropValue'
import GasStation from 'components/Icons/GasStation'
import Loader from 'components/Loader'
import { Center } from 'components/Stack'
import { TransactionDetailButton } from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { useHistoryGasDrop } from 'components/SwapTransactions/kyberCrossExecutionQuery'
import { useHistoryToken } from 'components/SwapTransactions/useHistoryToken'
import { TokenLogoWithChain } from 'components/TokenLogo/TokenLogoWithChain'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { ExternalLinkIcon } from 'theme'
import {
  type Chain,
  type Currency,
  NonEvmChain,
  NonEvmChainInfo,
  type TransactionStatus,
  isProcessingTransactionStatus,
} from 'types/crossChain'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const isEvmChainId = (chain: Chain): chain is ChainId => typeof chain === 'number'

export const TransactionTableGrid = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[minmax(120px,1fr)_64px_88px_minmax(156px,1.3fr)_100px_minmax(160px,1fr)] items-center gap-3',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const getSourceExplorerLink = (tx: HistoryTransaction) => {
  if (tx.sourceChain === NonEvmChain.Near)
    return tx.usesBackendData || tx.depositAddress
      ? `https://nearblocks.io/txns/${tx.sourceTxHash}`
      : `https://nearblocks.io/address/${tx.id}`
  if (tx.sourceChain === NonEvmChain.Bitcoin) return `https://mempool.space/tx/${tx.sourceTxHash}`
  if (tx.sourceChain === NonEvmChain.Solana) return `https://solscan.io/tx/${tx.sourceTxHash}`

  return NETWORKS_INFO[tx.sourceChain] ? getEtherscanLink(tx.sourceChain, tx.sourceTxHash, 'transaction') : ''
}

const getTargetExplorerLink = (tx: HistoryTransaction) => {
  if (!tx.targetTxHash) return ''
  if (!tx.usesBackendData && tx.adapter.toLowerCase() === 'debridge')
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

const TransactionProvider = ({ tx }: { tx: HistoryTransaction }) => {
  const adapter = registry.getAdapter(tx.adapter)
  const normalizedAdapterName = normalizeAdapterName(tx.adapter)
  const adapterAlias = adapter?.getAliases?.().find(alias => normalizeAdapterName(alias.name) === normalizedAdapterName)
  const adapterName = adapterAlias?.name || adapter?.getName() || tx.adapter
  const adapterIcon = adapterAlias?.icon || adapter?.getIcon()
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <img src={adapterIcon || UnknownToken} className="size-4 shrink-0 rounded-full" width={16} height={16} alt="" />
      <span className="truncate text-sm font-medium text-text" title={adapterName}>
        {adapterName}
      </span>
      <TransactionDetailButton tx={tx} />
    </div>
  )
}

const TransactionTime = ({ tx }: { tx: HistoryTransaction }) => {
  const txDate = new Date(tx.timestamp)

  return (
    <div className="flex flex-col gap-1 whitespace-nowrap text-sm font-medium text-subText">
      <span>{format(txDate, 'dd/MM/yyyy')}</span>
      <span>{format(txDate, 'HH:mm:ss')}</span>
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
  token: Currency | string
}

const AmountLine = ({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) => (
  <div className="flex min-w-0 items-center gap-1 max-sm:justify-between">
    {icon}
    <span className={cn('truncate text-sm font-medium text-subText', className)}>{children}</span>
  </div>
)

const TokenAmountLine = ({ amount, chain, prefix, token }: TransactionAmountLineProps) => {
  const currency = typeof token === 'string' ? undefined : token
  const symbol =
    typeof token === 'string'
      ? token.length > 14
        ? `${token.slice(0, 6)}…${token.slice(-4)}`
        : token || t`Unknown token`
      : token.symbol
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
    <AmountLine icon={<TokenLogoWithChain chainId={chain} currency={currency} />} className="text-text">
      {prefix}
      {formattedAmount} {symbol}
    </AmountLine>
  )
}

const GasDropLine = ({ tx }: { tx: HistoryTransaction }) => {
  const native = NativeCurrencies[tx.targetChain as ChainId]
  const gas = tx.gasDropStatus
  const { amountUsd } = useGasDropValue(
    gas?.status === 'Delivered' && gas.amount ? { amount: gas.amount } : undefined,
    tx.targetChain,
  )
  if (!native || (!tx.gasDrop && !gas) || gas?.status === 'NotExecuted') return null

  const text =
    gas?.status === 'Delivered' && gas.amount
      ? `+${formatDisplayNumber(formatUnits(BigInt(gas.amount), native.decimals), { significantDigits: 6 })} ${
          native.symbol
        }`
      : gas?.status === 'Failed'
      ? t`Not delivered`
      : t`Pending`

  return (
    <AmountLine
      className="text-xs"
      icon={
        <Center as="span" className="size-5 shrink-0 text-primary" role="img" aria-label={t`Gas Drop`}>
          <GasStation size={16} />
        </Center>
      }
    >
      {text}
      {amountUsd != null && ` (${formatDisplayNumber(amountUsd, { style: 'currency', fractionDigits: 2 })})`}
    </AmountLine>
  )
}

const TransactionAmount = ({ tx }: { tx: HistoryTransaction }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <TokenAmountLine amount={tx.inputAmount} chain={tx.sourceChain} prefix="-" token={tx.sourceToken} />
    {tx.status === 'Refunded' ? (
      <span className="flex items-center gap-1 text-sm font-medium text-subText">
        <Center as="span" className="size-5 shrink-0" aria-hidden>
          <CornerDownLeft size={16} />
        </Center>
        {t`Refunded`}
      </span>
    ) : (
      <TokenAmountLine amount={tx.outputAmount} chain={tx.targetChain} prefix="+" token={tx.targetToken} />
    )}
    <GasDropLine tx={tx} />
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

  const label = tx.status === 'Failed' ? t`Failed` : tx.status === 'Refunded' ? t`Refunded` : t`Not available`

  return <span className="text-sm font-medium text-subText">{label}</span>
}

const MobileDetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex min-w-0 items-center justify-between gap-3">
    <span className="shrink-0 text-sm font-medium text-text">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

const TransactionCard = ({ tx }: { tx: HistoryTransaction }) => (
  <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-background p-3 transition-colors hover:bg-tableHeader">
    <div className="flex items-start justify-between gap-3">
      <TransactionProvider tx={tx} />
      <StatusBadge status={tx.status} />
    </div>

    <div className="flex min-w-0 items-center justify-between gap-3">
      <ChainRoute tx={tx} />
      <TransactionAmount tx={tx} />
    </div>

    <TransactionTime tx={tx} />

    <MobileDetailRow label={tx.sourceChain === tx.targetChain ? t`Tx Hash:` : t`Deposit:`}>
      <TransactionHashLink hash={tx.sourceTxHash} href={getSourceExplorerLink(tx)} />
    </MobileDetailRow>
    {tx.sourceChain !== tx.targetChain && (
      <MobileDetailRow label={t`Fill:`}>
        <FillTransaction tx={tx} />
      </MobileDetailRow>
    )}
  </div>
)

const TransactionRow = ({ tx }: { tx: HistoryTransaction }) => (
  <TransactionTableGrid className="rounded-lg px-2 py-3 transition-colors hover:bg-tableHeader">
    <TransactionProvider tx={tx} />
    <ChainRoute tx={tx} />
    <div className="flex justify-center">
      <StatusBadge status={tx.status} />
    </div>
    <TransactionAmount tx={tx} />
    <TransactionTime tx={tx} />
    <div
      className={cn('flex min-w-0 flex-col gap-1', tx.sourceChain === tx.targetChain ? 'self-start' : 'self-center')}
    >
      <div className="flex min-w-0 justify-end gap-2">
        <span className="shrink-0 text-sm font-medium text-text">
          {tx.sourceChain === tx.targetChain ? t`Tx Hash:` : t`Deposit:`}
        </span>
        <TransactionHashLink hash={tx.sourceTxHash} href={getSourceExplorerLink(tx)} />
      </div>

      {tx.sourceChain !== tx.targetChain && (
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="shrink-0 text-sm font-medium text-text">{t`Fill:`}</span>
          <FillTransaction tx={tx} />
        </div>
      )}
    </div>
  </TransactionTableGrid>
)

type TransactionHistoryItemProps = {
  tx: HistoryTransaction
  mobile: boolean
}

export const TransactionHistoryItem = ({ tx, mobile }: TransactionHistoryItemProps) => {
  const sourceToken = useHistoryToken(tx.sourceToken, tx.sourceChain)
  const targetToken = useHistoryToken(tx.targetToken, tx.targetChain)
  const gasDropStatus = useHistoryGasDrop(tx)
  const resolved = { ...tx, sourceToken, targetToken, gasDropStatus }
  return mobile ? <TransactionCard tx={resolved} /> : <TransactionRow tx={resolved} />
}
