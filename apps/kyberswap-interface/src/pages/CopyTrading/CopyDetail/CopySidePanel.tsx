import { Token as CurrencyToken } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { CreditCard } from 'react-feather'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import type { AgentProfile, Token } from 'services/copyTrading/types/agents'
import type { CopyRunSummary, WalletBalanceRow } from 'services/copyTrading/types/copyRuns'
import type { Metric } from 'services/copyTrading/types/primitives'

import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { Center, HStack } from 'components/Stack'
import { copyDetailResponsiveOrder } from 'pages/CopyTrading/CopyDetail/responsiveOrder'
import {
  AgentRiskCard,
  StrategyExecutionCard,
  WhitelistedTokensCard,
} from 'pages/CopyTrading/components/AgentSidebarCards/AgentProfileCards'
import { CopyCapitalCard, WithdrawQuoteCard } from 'pages/CopyTrading/components/AgentSidebarCards/CopyActionCards'
import {
  SidePanelCard,
  type SidePanelCardWrapperProps,
} from 'pages/CopyTrading/components/AgentSidebarCards/SidePanelCard'
import { ResponsiveDetailContents, ResponsiveDetailItem } from 'pages/CopyTrading/components/common/layout'
import { DataQualityStatusBadge, copyRunStatusTextClassName } from 'pages/CopyTrading/components/common/status'
import { formatDisplayCapitalInUsd, formatTokenAmount, formatUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type AssetRowProps = {
  amount?: string
  chainId: number
  token?: Token
  tokenAddress: string
  valueUsd?: string
}

const AssetRow = ({ amount, chainId, token, tokenAddress, valueUsd }: AssetRowProps) => {
  const currency = useMemo(() => {
    try {
      return new CurrencyToken(chainId, tokenAddress, token?.decimals ?? 0, token?.symbol, token?.name)
    } catch {
      return undefined
    }
  }, [chainId, token?.decimals, token?.name, token?.symbol, tokenAddress])

  return (
    <HStack className="items-center justify-between gap-3 py-2">
      <HStack className="min-w-0 items-center gap-2">
        <CurrencyLogo currency={currency} size="20px" />
        <span className="truncate text-base text-text">
          {formatTokenAmount(amount)} {token?.symbol || 'Unknown token'}
        </span>
      </HStack>
      <span className="shrink-0 text-base text-subText">{formatUsd(valueUsd)}</span>
    </HStack>
  )
}

type RemainingInWalletCardProps = SidePanelCardWrapperProps & {
  assets: WalletBalanceRow[]
  complete: boolean
  loading: boolean
  totalValueUsd?: Metric
}

const RemainingInWalletCard = ({
  assets,
  bodyClassName,
  collapsible = true,
  complete,
  headerRight,
  initialExpanded = false,
  loading,
  title,
  totalValueUsd,
  ...sidePanelCardProps
}: RemainingInWalletCardProps) => {
  const hasAssets = !!assets.length
  const hasContent = loading || hasAssets
  const totalIsRenderable =
    complete && (totalValueUsd?.status === 'METRIC_STATUS_CURRENT' || totalValueUsd?.status === 'METRIC_STATUS_STALE')

  return (
    <SidePanelCard
      {...sidePanelCardProps}
      collapsible={collapsible && hasContent}
      bodyClassName={cn('max-h-[300px] gap-0 overflow-y-auto', bodyClassName)}
      headerRight={
        headerRight ?? (
          <HStack as="span" className="items-center gap-2">
            <span className="text-lg font-medium text-primary">
              {formatUsd(totalIsRenderable ? totalValueUsd.value : undefined)}
            </span>
            {totalIsRenderable && totalValueUsd.status === 'METRIC_STATUS_STALE' && (
              <DataQualityStatusBadge status={totalValueUsd.status} />
            )}
          </HStack>
        )
      }
      initialExpanded={initialExpanded}
      title={
        title ?? (
          <HStack as="span" className="min-w-0 items-center gap-2">
            <CreditCard size={18} className="shrink-0" />
            <span className="truncate">Remaining in Wallet</span>
          </HStack>
        )
      }
    >
      {hasContent && (
        <>
          {loading && !hasAssets ? (
            <Center className="min-h-20">
              <Loader />
            </Center>
          ) : (
            assets.map(asset => (
              <AssetRow
                key={asset.tokenAddress}
                amount={asset.amountDecimal}
                chainId={asset.chainId}
                token={asset.token}
                tokenAddress={asset.tokenAddress}
                valueUsd={asset.valueUsd}
              />
            ))
          )}
        </>
      )}
    </SidePanelCard>
  )
}

type CopySidePanelProps = {
  agent: AgentProfile
  run: CopyRunSummary
}

const CopySidePanel = ({ agent, run }: CopySidePanelProps) => {
  const { openAddCapital, openStopCopy, openWithdrawQuote } = useCopyTradingModal()

  const copyAccountQuery = { chainId: run.chainId, copyAccount: run.copyAccount }
  const skipCopyAccount = !run.copyAccount || !run.chainId
  const { data: inventoryResponse, isFetching: isInventoryFetching } =
    copyAccountApi.useGetCopyAccountWalletInventoryQuery(copyAccountQuery, {
      pollingInterval: 10_000,
      skip: skipCopyAccount,
    })

  const pinnedStableBalance = inventoryResponse?.pinnedStableBalance
  const quoteBalance =
    pinnedStableBalance?.status === 'PINNED_STABLE_BALANCE_STATUS_PRESENT' ? pinnedStableBalance.balance : undefined

  const walletAssets = useMemo(
    () => [
      ...(quoteBalance ? [quoteBalance] : []),
      ...(inventoryResponse?.data || []).filter(
        asset => !quoteBalance || asset.tokenAddress.toLowerCase() !== quoteBalance.tokenAddress.toLowerCase(),
      ),
    ],
    [inventoryResponse?.data, quoteBalance],
  )

  const inventoryComplete =
    inventoryResponse?.complete === true && pinnedStableBalance?.status === 'PINNED_STABLE_BALANCE_STATUS_PRESENT'
  const terminalStatus = run.status === 'stopped' || run.status === 'closed' ? run.status : undefined
  const isTerminal = !!terminalStatus

  const capitalCardTitle = terminalStatus ? (
    <HStack as="span" className={cn('items-center gap-2', copyRunStatusTextClassName[terminalStatus])}>
      <span className="size-4 shrink-0 rounded-full bg-current" aria-hidden />
      <span>{terminalStatus === 'stopped' ? 'Stopped Copy' : 'Closed Copy'}</span>
    </HStack>
  ) : (
    'Current Copying'
  )

  const secondaryCard = run.status === 'active' ? <StrategyExecutionCard items={agent.strategyExecutionItems} /> : null

  const capitalCard = (
    <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.capital}>
      <CopyCapitalCard
        addCapitalAvailability={run.addCapitalAvailability}
        capital={formatDisplayCapitalInUsd(run)}
        headerRight={
          run.status === 'stopped' ? (
            <span className="text-sm font-normal text-subText">{formatDateTime(run.stoppedAt)}</span>
          ) : undefined
        }
        stopCopyAvailability={run.stopCopyAvailability}
        title={capitalCardTitle}
        onAddCapital={isTerminal ? undefined : () => openAddCapital(run)}
        onStopCopy={isTerminal ? undefined : () => openStopCopy(run, agent.displayName)}
      />
    </ResponsiveDetailItem>
  )

  const agentRiskCard = (
    <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.risk}>
      <AgentRiskCard agent={agent} />
    </ResponsiveDetailItem>
  )

  const remainingInWallet = (
    <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.wallet}>
      <RemainingInWalletCard
        assets={walletAssets}
        complete={inventoryComplete}
        loading={isInventoryFetching}
        totalValueUsd={inventoryResponse?.walletInventoryValueUsd}
      />
    </ResponsiveDetailItem>
  )

  return (
    <ResponsiveDetailContents>
      {capitalCard}
      {agentRiskCard}
      {remainingInWallet}
      {secondaryCard && (
        <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.secondary}>
          {secondaryCard}
        </ResponsiveDetailItem>
      )}
      {run.withdrawQuoteAvailability && (
        <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.withdraw}>
          <WithdrawQuoteCard
            availability={run.withdrawQuoteAvailability}
            onWithdraw={() => openWithdrawQuote(run, run.withdrawQuoteAvailability)}
          />
        </ResponsiveDetailItem>
      )}
      {!isTerminal && (
        <ResponsiveDetailItem responsiveOrder={copyDetailResponsiveOrder.tokens}>
          <WhitelistedTokensCard tokens={agent.whitelistedSymbols} />
        </ResponsiveDetailItem>
      )}
    </ResponsiveDetailContents>
  )
}

export default CopySidePanel
