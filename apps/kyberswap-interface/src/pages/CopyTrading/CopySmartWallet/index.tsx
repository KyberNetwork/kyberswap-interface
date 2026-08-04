import { type HTMLAttributes } from 'react'
import { CreditCard, Info } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import type { ActivityRow, CopyAccountSummary, CopyRunSummary, WalletBalanceRow } from 'services/copyTrading/types'

import { Center, HStack, Stack } from 'components/Stack'
import { CopyPositionsTable } from 'pages/CopyTrading/CopyDetail/Tables'
import { SidePanelCard, WithdrawQuoteCard } from 'pages/CopyTrading/components/AgentSidebarCards'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import useInfiniteCursorQuery from 'pages/CopyTrading/components/InfiniteScroll/useInfiniteCursorQuery'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { ContentPanel, ShortenedId, StickySideColumn } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatCount, formatTokenAmount, formatUsd, getActivityLabel, signedUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

const PAGE_SIZE = 10

type CopySmartWalletProps = {
  run: CopyRunSummary
}

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const WalletBalanceGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn('min-w-[640px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]', className)}
      {...props}
    />
  )
}

const ActivityGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[900px] grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]',
        className,
      )}
      {...props}
    />
  )
}

const activityColor = (activity: ActivityRow) => {
  if (activity.activityType.includes('failed') || activity.activityType.includes('skipped')) return 'text-warning'
  if (activity.activityType === 'copy_stopped') return 'text-red'
  if (activity.activityType.includes('closed') || activity.activityType.includes('succeeded')) return 'text-primary'
  return 'text-text'
}

type WalletBalancesTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: WalletBalanceRow[]
}

const WalletBalancesTable = ({ infiniteScroll, loading, rows }: WalletBalancesTableProps) => (
  <Stack>
    <InfiniteScroll {...infiniteScroll}>
      <WalletBalanceGrid header className="sticky top-0 z-[1]">
        <HeaderCell>Token</HeaderCell>
        <HeaderCell className="justify-end text-right">Balance</HeaderCell>
        <HeaderCell className="justify-end text-right">Value</HeaderCell>
        <HeaderCell>Status</HeaderCell>
      </WalletBalanceGrid>
      <TableBody
        className="min-w-[640px]"
        empty={!rows.length}
        emptyMessage="No wallet balances found"
        loading={loading}
      >
        {rows.map(row => (
          <WalletBalanceGrid key={`${row.chainId}:${row.tokenAddress}`}>
            <TableCell>
              <HStack className="items-center gap-2">
                {row.token?.iconUrl ? (
                  <img src={row.token.iconUrl} alt="" className="size-5 rounded-full" />
                ) : (
                  <Center className="size-5 rounded-full bg-subText-20 text-[10px] text-subText">
                    {row.token?.symbol?.slice(0, 1) || '?'}
                  </Center>
                )}
                <span>{row.token?.symbol || row.tokenAddress}</span>
              </HStack>
            </TableCell>
            <TableCell className="text-right">{formatTokenAmount(row.amountDecimal)}</TableCell>
            <TableCell className="text-right">{formatUsd(row.valueUsd)}</TableCell>
            <TableCell className="text-subText">{row.freshnessStatus.replace('DATA_STATUS_', '') || '—'}</TableCell>
          </WalletBalanceGrid>
        ))}
      </TableBody>
    </InfiniteScroll>
  </Stack>
)

type SmartWalletActivityProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: ActivityRow[]
}

const SmartWalletActivity = ({ infiniteScroll, loading, rows }: SmartWalletActivityProps) => (
  <ContentPanel title="Activity">
    <InfiniteScroll {...infiniteScroll}>
      <ActivityGrid header className="sticky top-0 z-[1]">
        <HeaderCell>Trade ID</HeaderCell>
        <HeaderCell>Type</HeaderCell>
        <HeaderCell>Details</HeaderCell>
        <HeaderCell>Tx Hash</HeaderCell>
        <HeaderCell>Time</HeaderCell>
      </ActivityGrid>
      <TableBody
        className="min-w-[900px]"
        empty={!rows.length}
        emptyMessage="No wallet activity found"
        loading={loading}
      >
        {rows.map(row => (
          <ActivityGrid key={row.activityId}>
            <TableCell className="text-subText">
              <ShortenedId value={row.tradeId} />
            </TableCell>
            <TableCell className={activityColor(row)}>{getActivityLabel(row)}</TableCell>
            <TableCell>{row.summary || '—'}</TableCell>
            <TableCell className="text-subText">
              <ShortenedId value={row.txHash} />
            </TableCell>
            <TableCell className="text-subText">{formatDateTime(row.occurredAt)}</TableCell>
          </ActivityGrid>
        ))}
      </TableBody>
    </InfiniteScroll>
  </ContentPanel>
)

const SmartWalletSummary = ({ account, run }: { account?: CopyAccountSummary; run: CopyRunSummary }) => {
  const { openWithdrawQuote } = useCopyTradeWrite()
  const withdrawalAvailability = account?.withdrawQuoteAvailability || run.withdrawQuoteAvailability

  return (
    <Stack className="gap-4">
      <SidePanelCard
        title={
          <HStack className="items-center gap-2 text-base text-text">
            <CreditCard size={18} />
            <span>Remaining in Wallet</span>
          </HStack>
        }
      >
        <HStack className="items-center justify-between gap-4">
          <span className="text-subText">Portfolio value</span>
          <span className="text-xl font-medium text-primary">
            {formatUsd(account?.portfolioValueUsd ?? run.portfolioValueUsd)}
          </span>
        </HStack>
        <HStack className="items-center justify-between gap-4 text-sm">
          <span className="text-subText">Available</span>
          <span className="font-medium text-text">{formatUsd(account?.availableBalanceUsd)}</span>
        </HStack>
        <HStack className="items-center justify-between gap-4 text-sm">
          <span className="text-subText">Positions left</span>
          <span className="font-medium text-text">
            {formatCount(account?.openPositionCount ?? run.openPositionCount)}
          </span>
        </HStack>
        <HStack className="items-start gap-2 text-xs italic text-subText">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>These positions no longer follow the agent. Manage only the actions advertised by the API.</span>
        </HStack>
      </SidePanelCard>

      <WithdrawQuoteCard
        availability={withdrawalAvailability}
        onWithdraw={() => openWithdrawQuote(run, withdrawalAvailability)}
      />
    </Stack>
  )
}

const CopySmartWallet = ({ run }: CopySmartWalletProps) => {
  const accountQuery = { chainId: run.chainId, copyAccount: run.copyAccount }
  const { data: accountResponse } = copyTradingApi.useGetCopyAccountQuery(accountQuery)
  const [getBalances] = copyTradingApi.useLazyGetCopyAccountBalancesQuery()
  const [getPositions] = copyTradingApi.useLazyGetCopyAccountPositionsQuery()
  const [getHistory] = copyTradingApi.useLazyGetCopyAccountHistoryQuery()

  const balances = useInfiniteCursorQuery({
    queryKey: ['copy-trading', 'copy-account-balances', run.chainId, run.copyAccount],
    queryFn: cursor => getBalances({ ...accountQuery, cursor, limit: PAGE_SIZE }).unwrap(),
  })
  const positions = useInfiniteCursorQuery({
    queryKey: ['copy-trading', 'copy-account-positions', run.chainId, run.copyAccount, 'open'],
    queryFn: cursor => getPositions({ ...accountQuery, status: 'open', cursor, limit: PAGE_SIZE }).unwrap(),
  })
  const activity = useInfiniteCursorQuery({
    queryKey: ['copy-trading', 'copy-account-history', run.chainId, run.copyAccount],
    queryFn: cursor => getHistory({ ...accountQuery, cursor, limit: PAGE_SIZE }).unwrap(),
  })

  const stats: LeaderboardStat[] = [
    {
      label: 'Realised P&L',
      value: signedUsd(run.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      status: run.metrics.realizedPnlUsd?.status,
    },
    {
      label: 'Fee Paid',
      value: formatUsd(run.flatFeesCapturedUsd),
      icon: copyTradingStatIconMap.volume,
      status: run.metrics.flatFeesCapturedUsd?.status,
    },
    {
      label: 'Cashback Received',
      value: formatUsd(run.cashbackReceivedUsd),
      icon: copyTradingStatIconMap.money,
      status: run.metrics.cashbackReceivedUsd?.status,
    },
    {
      label: 'Stopped At',
      value: formatDateTime(run.stoppedAt),
      icon: copyTradingStatIconMap.positionClose,
    },
  ]

  return (
    <Stack className="gap-4">
      <Leaderboard items={stats} size="sm" />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-4 max-xl:grid-cols-1">
        <Stack className="min-w-0 gap-4">
          <ContentPanel title="Wallet">
            <WalletBalancesTable
              infiniteScroll={balances.infiniteScroll}
              loading={balances.isFetching && !balances.items.length}
              rows={balances.items}
            />
          </ContentPanel>

          <ContentPanel
            title="Positions"
            titleAddon={
              <Center className="size-5 rounded-full bg-warning-20 text-xs text-warning">
                {formatCount(run.openPositionCount)}
              </Center>
            }
          >
            <CopyPositionsTable
              infiniteScroll={positions.infiniteScroll}
              loading={positions.isFetching && !positions.items.length}
              rows={positions.items}
            />
          </ContentPanel>

          <SmartWalletActivity
            infiniteScroll={activity.infiniteScroll}
            loading={activity.isFetching && !activity.items.length}
            rows={activity.items}
          />
        </Stack>

        <StickySideColumn>
          <SmartWalletSummary account={accountResponse?.data} run={run} />
        </StickySideColumn>
      </div>
    </Stack>
  )
}

export default CopySmartWallet
