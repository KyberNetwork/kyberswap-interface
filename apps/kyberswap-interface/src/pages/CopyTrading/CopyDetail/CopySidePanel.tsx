import { Token as CurrencyToken } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { CreditCard } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import type { AgentProfile, CopyRunSummary, PositionSummary, Token, WalletBalanceRow } from 'services/copyTrading/types'

import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { Center, HStack, Stack } from 'components/Stack'
import {
  AgentRiskCard,
  CopyCapitalCard,
  SidePanelCard,
  type SidePanelCardWrapperProps,
  StrategyExecutionCard,
  WishlistedTokensCard,
  WithdrawQuoteCard,
} from 'pages/CopyTrading/components/AgentSidebarCards'
import { copyRunStatusTextClassName } from 'pages/CopyTrading/components/common'
import { formatTokenAmount, formatUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

const POSITION_ASSET_LIMIT = 10

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
  loading: boolean
  positionAssets: PositionSummary[]
  quoteBalance?: WalletBalanceRow
}

const RemainingInWalletCard = ({
  bodyClassName,
  collapsible = true,
  headerRight,
  initialExpanded = false,
  loading,
  positionAssets,
  quoteBalance,
  title,
  ...sidePanelCardProps
}: RemainingInWalletCardProps) => {
  const hasAssets = !!quoteBalance || !!positionAssets.length
  const hasContent = loading || hasAssets
  const totalValueUsd = [quoteBalance?.valueUsd, ...positionAssets.map(position => position.valueUsd)].reduce(
    (total, value) => {
      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? total + numericValue : total
    },
    0,
  )

  return (
    <SidePanelCard
      {...sidePanelCardProps}
      collapsible={collapsible && hasContent}
      bodyClassName={cn('max-h-[300px] gap-0 overflow-y-auto', bodyClassName)}
      headerRight={
        headerRight ?? <span className="text-lg font-medium text-primary">{formatUsd(String(totalValueUsd))}</span>
      }
      initialExpanded={initialExpanded}
      title={
        title ?? (
          <HStack className="min-w-0 items-center gap-2">
            <CreditCard size={18} className="shrink-0" />
            <span className="truncate">Remaining in Wallet</span>
          </HStack>
        )
      }
    >
      {hasContent && (
        <>
          {/* TODO(copy-trading): Replace this first-page positions + pinned quote-token approximation with the dedicated Remaining in Wallet API when BE provides it. */}
          {loading && !hasAssets ? (
            <Center className="min-h-20">
              <Loader />
            </Center>
          ) : (
            <>
              {quoteBalance && (
                <AssetRow
                  amount={quoteBalance.amountDecimal}
                  chainId={quoteBalance.chainId}
                  token={quoteBalance.token}
                  tokenAddress={quoteBalance.tokenAddress}
                  valueUsd={quoteBalance.valueUsd}
                />
              )}
              {positionAssets.map(position => (
                <AssetRow
                  key={position.positionId}
                  amount={position.amountDecimal}
                  chainId={position.chainId}
                  token={position.token}
                  tokenAddress={position.token.address}
                  valueUsd={position.valueUsd}
                />
              ))}
            </>
          )}
        </>
      )}
    </SidePanelCard>
  )
}

type CopySidePanelProps = {
  agent: AgentProfile
  positions: PositionSummary[]
  run: CopyRunSummary
}

const CopySidePanel = ({ agent, positions, run }: CopySidePanelProps) => {
  const { openAddCapital, openStopCopy, openWithdrawQuote } = useCopyTradeWrite()
  const accountQuery = { chainId: run.chainId, copyAccount: run.copyAccount }
  const skipCopyAccount = !run.copyAccount || !run.chainId
  const { data: positionResponse, isFetching: isPositionsFetching } = copyTradingApi.useGetCopyAccountPositionsQuery(
    { ...accountQuery, status: 'open', limit: POSITION_ASSET_LIMIT },
    { skip: skipCopyAccount },
  )
  const { data: balanceResponse, isFetching: isBalanceFetching } = copyTradingApi.useGetCopyAccountBalancesQuery(
    { ...accountQuery, limit: 1 },
    { skip: skipCopyAccount },
  )
  const pinnedStableBalance = balanceResponse?.pinnedStableBalance
  const quoteBalance =
    pinnedStableBalance?.status === 'PINNED_STABLE_BALANCE_STATUS_PRESENT' ? pinnedStableBalance.balance : undefined
  const positionAssets = positionResponse?.data || []
  const assetsLoading = isPositionsFetching || isBalanceFetching
  const isTerminal = run.status === 'stopped' || run.status === 'closed'

  const capitalCard = (
    <CopyCapitalCard
      addCapitalAvailability={run.addCapitalAvailability}
      capital={formatUsd(run.capitalInUsd)}
      headerRight={
        run.status === 'stopped' ? (
          <span className="text-sm font-normal text-subText">{formatDateTime(run.stoppedAt)}</span>
        ) : undefined
      }
      stopCopyAvailability={run.stopCopyAvailability}
      title={
        run.status === 'stopped' ? (
          <HStack className={cn('items-center gap-2', copyRunStatusTextClassName.stopped)}>
            <span className="size-4 shrink-0 rounded-full bg-current" aria-hidden />
            <span>Stopped Copy</span>
          </HStack>
        ) : run.status === 'closed' ? (
          <HStack className={cn('items-center gap-2', copyRunStatusTextClassName.closed)}>
            <span className="size-4 shrink-0 rounded-full bg-current" aria-hidden />
            <span>Closed Copy</span>
          </HStack>
        ) : (
          'Current Copying'
        )
      }
      onAddCapital={isTerminal ? undefined : () => openAddCapital(run, agent.displayName)}
      onStopCopy={isTerminal ? undefined : () => openStopCopy(run, positions, agent.displayName)}
    />
  )

  const remainingInWallet = (
    <RemainingInWalletCard loading={assetsLoading} positionAssets={positionAssets} quoteBalance={quoteBalance} />
  )

  if (isTerminal) {
    return (
      <Stack className="gap-4">
        {capitalCard}
        {remainingInWallet}
        {run.status === 'stopped' && (
          <WithdrawQuoteCard
            availability={run.withdrawQuoteAvailability}
            onWithdraw={() => openWithdrawQuote(run, run.withdrawQuoteAvailability)}
          />
        )}
      </Stack>
    )
  }

  return (
    <Stack className="gap-4">
      {capitalCard}
      {remainingInWallet}
      <AgentRiskCard agent={agent} />
      {run.status === 'active' && <StrategyExecutionCard items={agent.strategyExecutionItems} />}
      <WishlistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default CopySidePanel
