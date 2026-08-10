import { CreditCard } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import type { AgentProfile, CopyRunSummary, PositionSummary, WalletBalanceRow } from 'services/copyTrading/types'

import Loader from 'components/Loader'
import { Center, HStack, Stack } from 'components/Stack'
import {
  AgentRiskCard,
  CurrentCopyCard,
  SidePanelCard,
  StrategyExecutionCard,
  WishlistedTokensCard,
  WithdrawQuoteCard,
} from 'pages/CopyTrading/components/AgentSidebarCards'
import { formatTokenAmount, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { cn } from 'utils/cn'

const POSITION_ASSET_LIMIT = 10

type CopyStatusCardProps = {
  run: CopyRunSummary
}

const TerminalCopySummary = ({ run }: CopyStatusCardProps) => {
  const realizedPnl = signedUsd(run.realizedPnlUsd)

  return (
    <SidePanelCard title={run.status === 'stopped' ? 'Stopped Copy' : 'Closed Copy'}>
      <HStack className="items-center justify-between gap-4">
        <span className="text-base text-subText">Total Realised P&amp;L</span>
        <span className={cn('text-2xl font-medium', realizedPnl.startsWith('-') ? 'text-red' : 'text-primary')}>
          {realizedPnl}
        </span>
      </HStack>
    </SidePanelCard>
  )
}

type AssetRowProps = {
  amount?: string
  iconUrl?: string
  quote?: boolean
  symbol?: string
  valueUsd?: string
}

const AssetRow = ({ amount, iconUrl, quote, symbol, valueUsd }: AssetRowProps) => (
  <HStack className="items-center justify-between gap-3 px-3 py-2.5">
    <HStack className="min-w-0 items-center gap-2">
      {iconUrl ? (
        <img src={iconUrl} alt="" className="size-6 shrink-0 rounded-full" />
      ) : (
        <Center className="size-6 shrink-0 rounded-full bg-subText-20 text-[10px] text-subText">
          {symbol?.slice(0, 1) || '?'}
        </Center>
      )}
      <Stack className="min-w-0 gap-0.5">
        <HStack className="items-center gap-1.5">
          <span className="truncate text-sm font-medium text-text">{symbol || 'Unknown token'}</span>
          {quote && (
            <span className="rounded bg-primary-12 px-1.5 py-0.5 text-[10px] font-medium text-primary">Quote</span>
          )}
        </HStack>
        <span className="text-xs text-subText">{formatTokenAmount(amount)}</span>
      </Stack>
    </HStack>
    <span className="shrink-0 text-sm font-medium text-text">{formatUsd(valueUsd)}</span>
  </HStack>
)

type RemainingInWalletCardProps = {
  loading: boolean
  positionAssets: PositionSummary[]
  quoteBalance?: WalletBalanceRow
}

const RemainingInWalletCard = ({ loading, positionAssets, quoteBalance }: RemainingInWalletCardProps) => {
  const hasAssets = !!quoteBalance || !!positionAssets.length

  return (
    <SidePanelCard
      title={
        <HStack className="items-center gap-2 text-base text-text">
          <CreditCard size={18} />
          <span>Remaining in Wallet</span>
        </HStack>
      }
    >
      {/* TODO(copy-trading): Replace this first-page positions + pinned quote-token approximation with the dedicated Remaining in Wallet API when BE provides it. */}
      <Stack className="max-h-[300px] gap-0 divide-y divide-darkBorder overflow-y-auto rounded-lg border border-darkBorder bg-background">
        {loading && !hasAssets ? (
          <Center className="min-h-20">
            <Loader />
          </Center>
        ) : hasAssets ? (
          <>
            {quoteBalance && (
              <AssetRow
                amount={quoteBalance.amountDecimal}
                iconUrl={quoteBalance.token?.iconUrl}
                quote
                symbol={quoteBalance.token?.symbol}
                valueUsd={quoteBalance.valueUsd}
              />
            )}
            {positionAssets.map(position => (
              <AssetRow
                key={position.positionId}
                amount={position.amountDecimal}
                iconUrl={position.token.iconUrl}
                symbol={position.token.symbol}
                valueUsd={position.valueUsd}
              />
            ))}
          </>
        ) : (
          <Center className="min-h-20 px-3 text-center text-sm text-subText">No assets remaining</Center>
        )}
      </Stack>
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

  const remainingInWallet = (
    <RemainingInWalletCard loading={assetsLoading} positionAssets={positionAssets} quoteBalance={quoteBalance} />
  )

  if (isTerminal) {
    return (
      <Stack className="gap-4">
        <TerminalCopySummary run={run} />
        {remainingInWallet}
        {run.status === 'stopped' && (
          <WithdrawQuoteCard
            availability={run.withdrawQuoteAvailability}
            onWithdraw={() => openWithdrawQuote(run, run.withdrawQuoteAvailability)}
          />
        )}
        <StrategyExecutionCard items={agent.strategyExecutionItems} />
      </Stack>
    )
  }

  return (
    <Stack className="gap-4">
      <CurrentCopyCard
        addCapitalAvailability={run.addCapitalAvailability}
        capital={formatUsd(run.capitalInUsd)}
        stopCopyAvailability={run.stopCopyAvailability}
        title="Current Copying"
        onAddCapital={() => openAddCapital(run, agent.displayName)}
        onStopCopy={() => openStopCopy(run, positions, agent.displayName)}
      />
      {remainingInWallet}
      <AgentRiskCard agent={agent} />
      <StrategyExecutionCard items={agent.strategyExecutionItems} />
      <WishlistedTokensCard tokens={agent.whitelistedSymbols} />
    </Stack>
  )
}

export default CopySidePanel
