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

type RemainingInWalletCardProps = {
  loading: boolean
  positionAssets: PositionSummary[]
  quoteBalance?: WalletBalanceRow
}

const RemainingInWalletCard = ({ loading, positionAssets, quoteBalance }: RemainingInWalletCardProps) => {
  const hasAssets = !!quoteBalance || !!positionAssets.length
  const totalValueUsd = [quoteBalance?.valueUsd, ...positionAssets.map(position => position.valueUsd)].reduce(
    (total, value) => {
      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? total + numericValue : total
    },
    0,
  )

  return (
    <SidePanelCard
      collapsible
      bodyClassName="max-h-[300px] gap-0 overflow-y-auto"
      headerRight={<span className="text-lg font-medium text-primary">{formatUsd(String(totalValueUsd))}</span>}
      title={
        <HStack className="min-w-0 items-center gap-2">
          <CreditCard size={18} className="shrink-0" />
          <span className="truncate">Remaining in Wallet</span>
        </HStack>
      }
    >
      {/* TODO(copy-trading): Replace this first-page positions + pinned quote-token approximation with the dedicated Remaining in Wallet API when BE provides it. */}
      {loading && !hasAssets ? (
        <Center className="min-h-20">
          <Loader />
        </Center>
      ) : hasAssets ? (
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
      ) : (
        <Center className="min-h-20 text-center text-sm text-subText">No assets remaining</Center>
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
