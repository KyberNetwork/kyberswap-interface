import type {
  ActivityRow,
  ActivityType,
  Address,
  AdvisoryActionAvailability,
  AgentCard,
  AgentPerformanceResponse,
  AgentPositionEventsResponse,
  AgentPositionResponse,
  AgentPositionsResponse,
  AgentProfile,
  AgentResponse,
  AgentSnapshot,
  AgentStats,
  AgentStatsResponse,
  AgentsResponse,
  CapitalInProjectionStatus,
  Chain,
  ChainsResponse,
  CopyAccountBalancesResponse,
  CopyAccountHistoryResponse,
  CopyAccountPositionsResponse,
  CopyAccountResponse,
  CopyAccountStatus,
  CopyAccountSummary,
  CopyAccountWalletInventoryResponse,
  CopyRunCashbackPolicy,
  CopyRunCashbackPolicyResponse,
  CopyRunPerformanceResponse,
  CopyRunPositionsResponse,
  CopyRunResponse,
  CopyRunStatus,
  CopyRunSummary,
  CopyRunView,
  CopyRunsResponse,
  CotLog,
  CotLogsResponse,
  CursorPagination,
  CursorResponse,
  DataStatus,
  LeaderboardResponse,
  LeaderboardSummaryResponse,
  Metric,
  MetricStatus,
  OwnerActivityResponse,
  OwnerCopyAccountsResponse,
  OwnerCopySummary,
  OwnerCopySummaryResponse,
  OwnerPositionsResponse,
  PendingSellObligation,
  PendingSellObligationsResponse,
  PerformanceInterval,
  PerformancePoint,
  PerformanceSeries,
  PinnedStableBalanceStatus,
  PositionEvent,
  PositionExitKind,
  PositionLifecycle,
  PositionQuantityState,
  PositionSummary,
  ResponseMeta,
  SingleResponse,
  StrategyKey,
  Token,
  WalletBalanceRow,
} from 'services/copyTrading/types'

// Wire response shapes kept private to the adapter boundary.
type ApiMetric = Metric

type ApiValuation = {
  valueUsd?: string
  priceUsd?: string
  priceSource?: string
  priceAsOf?: string
  asOf?: string
  status?: DataStatus
  isEstimated?: boolean
  isFinal?: boolean
}

type ApiToken = {
  chainId?: string
  address?: string
  symbol?: string
  name?: string
  decimals?: number
  logoUrl?: string
}

type ApiChain = {
  chainId?: string
  slug?: string
  name?: string
  iconUrl?: string
  isEnabled?: boolean
}

type ApiAgentMetrics = {
  apr30d?: ApiMetric
  winRatePct?: ApiMetric
  lifetimeVolumeUsd?: ApiMetric
  copiers?: ApiMetric
  aumUsd?: ApiMetric
  openPositions?: ApiMetric
  totalRealizedPnlUsd?: ApiMetric
  maxDrawdownPct?: ApiMetric
  winningPositionCount?: ApiMetric
  losingPositionCount?: ApiMetric
  breakevenPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
}

type ApiAgentCard = {
  agentId?: string
  chainId?: string
  leaderAddress?: string
  displayName?: string
  avatarUrl?: string
  isVerified?: boolean
  badges?: string[]
  modelName?: string
  asOf?: string
  strategyLabel?: string
  strategyCategories?: string[]
  metrics?: ApiAgentMetrics
  flatFeeRatePct?: ApiMetric
  startCopyAvailability?: AdvisoryActionAvailability
}

type ApiAgentProfile = ApiAgentCard & {
  bio?: string
  liveSince?: string
  whitelistedSymbols?: string[]
  tags?: string[]
  strategyExecutionItems?: { label?: string; description?: string }[]
}

type ApiPosition = {
  positionId?: string
  userPositionId?: string
  agentPositionId?: string
  copyRunId?: string
  agentId?: string
  chainId?: string
  copyAccount?: string
  tradeId?: string
  token?: ApiToken
  lifecycle?: string
  remainingBaseRaw?: string
  totalGrossBaseBoughtRaw?: string
  totalGrossBaseSoldRaw?: string
  upfrontFeeCapturedBaseRaw?: string
  upfrontFeeReleasedBaseRaw?: string
  netBaseReceivedRaw?: string
  remainingNetBaseRaw?: string
  displayBaseRaw?: string
  entryValuation?: ApiValuation
  currentValuation?: ApiValuation
  exitValuation?: ApiValuation
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  unrealizedPnlPct?: ApiMetric
  flatFeeCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  estimatedCashbackUsd?: ApiMetric
  skippedSellCount?: ApiMetric
  latestSkippedRatio?: ApiMetric
  cumulativeSkippedRatio?: ApiMetric
  quantityState?: string
  exitKind?: string
  actionKind?: string
  availableActionKinds?: string[]
  isLeftover?: boolean
  leftoverReason?: string
  leftoverValuation?: ApiValuation
  latestSkipPublicErrorCode?: string
  durationSeconds?: string
  durationAsOf?: string
  openedAt?: string
  closedAt?: string
}

type ApiPerformancePoint = {
  timestamp?: string
  series?: string
  interval?: string
  valueUsd?: ApiMetric
  tradeId?: string
  positionId?: string
  token?: ApiToken
}

type ApiAgentActionLog = {
  actionLogId?: string
  chainId?: string
  occurredAt?: string
  trigger?: string
  dataSummary?: string
  reasoningSummary?: string
  actionSummary?: string
  action?: string
  status?: string
  txHash?: string
  leaderPositionId?: string
  summary?: string
  blockNumber?: string
  tokenAddress?: string
  model?: string
  strategyVersion?: string
}

type ApiAgentSnapshot = {
  agentId?: string
  chainId?: string
  leaderAddress?: string
  displayName?: string
  avatarUrl?: string
  isVerified?: boolean
  modelName?: string
  strategyLabel?: string
  strategyCategories?: string[]
  badges?: string[]
  metrics?: ApiAgentMetrics
}

type ApiCopyRun = {
  copyRunId?: string
  ownerAddress?: string
  agentId?: string
  chainId?: string
  copyAccount?: string
  status?: string
  capitalInProjectionStatus?: string
  startedAt?: string
  stoppedAt?: string
  capitalInUsd?: ApiMetric
  capitalOutUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  myAprSinceCopy?: ApiMetric
  openPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
  leftoverPositionCount?: ApiMetric
  leftoverValueUsd?: ApiMetric
  durationSeconds?: string
  durationAsOf?: string
  flatFeesCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  estimatedCashbackPendingUsd?: ApiMetric
  agentSnapshot?: ApiAgentSnapshot
  addCapitalAvailability?: ApiAgentCard['startCopyAvailability']
  stopCopyAvailability?: ApiAgentCard['startCopyAvailability']
  withdrawQuoteAvailability?: ApiAgentCard['startCopyAvailability']
}

type ApiCopyRunCashbackPolicy = {
  copyRunId?: string
  chainId?: string
  copyAccount?: string
  agentId?: string
  capCashbackRatioRaw?: string
  pnlRateRaw?: string
  scope?: string
  status?: string
  selectionPolicyVersion?: string
  cashbackFormulaVersion?: number
  selectedAt?: string
  invalidatedAt?: string
  unavailableReason?: string
  fallbackAt?: string
}

type ApiOwnerCopySummary = {
  ownerAddress?: string
  view?: string
  totalAllocatedUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  openPositionCount?: ApiMetric
  activeCopyRuns?: ApiMetric
  closedCopyRuns?: ApiMetric
  closedPositionCount?: ApiMetric
  closedCapitalUsd?: ApiMetric
  leftoverPositionCount?: ApiMetric
  leftoverValueUsd?: ApiMetric
  flatFeesCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  estimatedCashbackPendingUsd?: ApiMetric
}

type ApiActivity = {
  activityId?: string
  ownerAddress?: string
  agentId?: string
  chainId?: string
  copyRunId?: string
  copyAccount?: string
  type?: string
  summary?: string
  occurredAt?: string
  userPositionId?: string
  followerPositionId?: string
  tradeId?: string
  txHash?: string
  agentDisplayName?: string
  agentAvatarUrl?: string
  copyLifecycle?: {
    eventId?: string
    eventType?: string
    beforeStatus?: string
    afterStatus?: string
  }
  position?: {
    eventId?: string
    actionType?: string
    baseTokenAddress?: string
    quoteTokenAddress?: string
    baseAmountRaw?: string
    quoteAmountRaw?: string
    accountingStatus?: string
    grossBaseSoldRaw?: string
    grossQuoteReceivedRaw?: string
    baseToken?: ApiToken
    quoteToken?: ApiToken
    grossBaseBoughtRaw?: string
    upfrontFeeCapturedBaseRaw?: string
    upfrontFeeReleasedBaseRaw?: string
    netBaseReceivedRaw?: string
    netBaseSoldRaw?: string
    displayBaseRaw?: string
    settlementValueUsd?: ApiMetric
    realizedPnlUsd?: ApiMetric
    flatFeeCapturedUsd?: ApiMetric
    cashbackReceivedUsd?: ApiMetric
  }
  capital?: {
    movementType?: string
    amountRaw?: string
    tokenAddress?: string
    token?: ApiToken
    valueUsd?: ApiMetric
  }
  fee?: {
    amountRaw?: string
    tokenAddress?: string
    token?: ApiToken
    valueUsd?: ApiMetric
  }
  execution?: {
    executionKind?: string
    eventSeq?: string
    eventType?: string
    actionKind?: string
    copyJobId?: string
    exitActionId?: string
    executionId?: string
    copyJobAction?: string
    copyJobStatus?: string
    actionStatus?: string
    executionStatus?: string
    publicErrorCode?: string
    publicErrorMessage?: string
    configIndex?: number
    minBaseTokenRateRaw?: string
    configDeadlineRaw?: string
    token?: ApiToken
    displayAmountRaw?: string
    valueUsd?: ApiMetric
  }
}

type ApiCopyAccount = {
  chainId?: string
  copyAccount?: string
  ownerAddress?: string
  status?: string
  activeCopyRuns?: ApiMetric
  totalAllocatedUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  availableBalanceUsd?: ApiMetric
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  openPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
  leftoverPositionCount?: ApiMetric
  leftoverValueUsd?: ApiMetric
  flatFeesCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  estimatedCashbackPendingUsd?: ApiMetric
  agentSnapshot?: ApiAgentSnapshot
  copyRunId?: string
  startedAt?: string
  stoppedAt?: string
  addCapitalAvailability?: ApiAgentCard['startCopyAvailability']
  stopCopyAvailability?: ApiAgentCard['startCopyAvailability']
  withdrawQuoteAvailability?: ApiAgentCard['startCopyAvailability']
}

type ApiWalletBalance = {
  chainId?: string
  copyAccount?: string
  tokenAddress?: string
  amountDecimal?: string
  balanceSource?: string
  freshnessStatus?: string
  balanceAsOfBlock?: string
  cachedAt?: string
  stalenessReason?: string
  token?: ApiToken
  currentValuation?: ApiValuation
}

type ApiSingleResponse<T> = {
  data?: T
  meta?: ResponseMeta
}

type ApiCursorResponse<T> = {
  data?: T[]
  pagination?: Partial<CursorPagination>
  meta?: ResponseMeta
}

type ApiBalancesResponse = ApiCursorResponse<ApiWalletBalance> & {
  pinnedStableBalance?: {
    status?: string
    balance?: ApiWalletBalance
  }
}

type ApiWalletInventoryResponse = {
  data?: ApiWalletBalance[]
  walletInventoryValueUsd?: ApiMetric
  complete?: boolean
  pinnedStableBalance?: ApiBalancesResponse['pinnedStableBalance']
  meta?: ResponseMeta
}

// Shared normalization helpers.
const isMetricRenderable = (status?: MetricStatus) =>
  status === 'METRIC_STATUS_CURRENT' || status === 'METRIC_STATUS_STALE'

const isValuationRenderable = (valuation?: ApiValuation) =>
  valuation?.status === 'DATA_STATUS_CURRENT' ||
  valuation?.status === 'DATA_STATUS_STALE' ||
  valuation?.isFinal === true

const metricValue = (metric?: ApiMetric) => (isMetricRenderable(metric?.status) ? metric?.value : undefined)
const chainIdNumber = (chainId?: string) => Number(chainId || 0)

const performanceSeriesMap: Record<string, PerformanceSeries> = {
  PERFORMANCE_SERIES_PORTFOLIO_EQUITY: 'portfolio_value',
  PERFORMANCE_SERIES_CUMULATIVE_REALIZED_PNL: 'cumulative_realized_pnl',
  PERFORMANCE_SERIES_PERIOD_REALIZED_PNL: 'period_realized_pnl',
  PERFORMANCE_SERIES_PER_TRADE_REALIZED_PNL: 'per_trade_realized_pnl',
}

const performanceIntervalMap: Record<string, PerformanceInterval> = {
  PERFORMANCE_INTERVAL_DAY: 'day',
  PERFORMANCE_INTERVAL_WEEK: 'week',
  PERFORMANCE_INTERVAL_MONTH: 'month',
}

const toToken = (token?: ApiToken): Token => ({
  chainId: chainIdNumber(token?.chainId),
  address: (token?.address || '') as Address,
  symbol: token?.symbol,
  name: token?.name || token?.symbol,
  decimals: token?.decimals,
  iconUrl: token?.logoUrl,
})

const toPositionLifecycle = (lifecycle?: string): PositionLifecycle => {
  const value = lifecycle?.replace('POSITION_LIFECYCLE_', '').toLowerCase()
  return value === 'active' || value === 'closing' || value === 'closed' ? value : 'unknown'
}

const toPositionQuantityState = (quantityState?: string): PositionQuantityState => {
  const value = quantityState?.replace('POSITION_QUANTITY_STATE_', '').toLowerCase()
  return value === 'open_full' || value === 'open_partial' || value === 'closed' ? value : 'unknown'
}

const formatRawAmount = (value: string, decimals?: number) => {
  if (decimals === undefined) return undefined
  if (!/^\d+$/.test(value) || decimals <= 0) return value

  const padded = value.padStart(decimals + 1, '0')
  const integer = padded.slice(0, -decimals)
  const fraction = padded.slice(-decimals).replace(/0+$/, '')
  return fraction ? `${integer}.${fraction}` : integer
}

const toStrategy = (categories?: string[], label?: string): StrategyKey => {
  const category = categories?.find(value => value !== 'STRATEGY_CATEGORY_UNSPECIFIED')
  if (category) return category.replace('STRATEGY_CATEGORY_', '').toLowerCase() as StrategyKey

  const normalizedLabel = label?.trim().toLowerCase()
  return (
    normalizedLabel === 'focused' || normalizedLabel === 'diversified' || normalizedLabel === 'active'
      ? normalizedLabel
      : 'unknown'
  ) as StrategyKey
}

const toAgentSnapshot = (snapshot: ApiAgentSnapshot): AgentSnapshot => ({
  agentId: snapshot.agentId || '',
  chainId: chainIdNumber(snapshot.chainId),
  leaderAddress: (snapshot.leaderAddress || '') as Address,
  displayName: snapshot.displayName || snapshot.agentId || '',
  avatarUrl: snapshot.avatarUrl,
  isVerified: snapshot.isVerified === true,
  modelName: snapshot.modelName || '',
  strategy: toStrategy(snapshot.strategyCategories, snapshot.strategyLabel),
  strategyLabel: snapshot.strategyLabel,
  strategyCategories: (snapshot.strategyCategories || []) as AgentSnapshot['strategyCategories'],
  badges: snapshot.badges || [],
  metrics: snapshot.metrics || {},
})

const toAgentStats = (metrics?: ApiAgentMetrics): AgentStats => ({
  apr30dPct: metricValue(metrics?.apr30d),
  winRatePct: metricValue(metrics?.winRatePct),
  volumeUsd: metricValue(metrics?.lifetimeVolumeUsd),
  copiers: metricValue(metrics?.copiers),
  aumUsd: metricValue(metrics?.aumUsd),
  openPositions: metricValue(metrics?.openPositions),
  totalRealizedPnlUsd: metricValue(metrics?.totalRealizedPnlUsd),
  maxDrawdownPct: metricValue(metrics?.maxDrawdownPct),
  metrics: metrics || {},
})

const toAgentCard = (agent: ApiAgentCard): AgentCard => ({
  agentId: agent.agentId || '',
  chainId: chainIdNumber(agent.chainId),
  leaderAddress: (agent.leaderAddress || '') as Address,
  displayName: agent.displayName || agent.agentId || '',
  avatarUrl: agent.avatarUrl,
  isVerified: agent.isVerified === true,
  badges: agent.badges || [],
  isTrending: agent.badges?.some(badge => badge.toLowerCase() === 'trending') === true,
  strategy: toStrategy(agent.strategyCategories, agent.strategyLabel),
  strategyLabel: agent.strategyLabel,
  strategyCategories: (agent.strategyCategories || []) as AgentCard['strategyCategories'],
  modelName: agent.modelName || '',
  stats: toAgentStats(agent.metrics),
  flatFeeRatePct: metricValue(agent.flatFeeRatePct),
  flatFeeRatePctMetric: agent.flatFeeRatePct,
  startCopyAvailability: agent.startCopyAvailability,
  asOf: agent.asOf,
})

const toAgentProfile = (agent: ApiAgentProfile): AgentProfile => ({
  ...toAgentCard(agent),
  bio: agent.bio,
  liveSince: agent.liveSince,
  whitelistedSymbols: agent.whitelistedSymbols || [],
  tags: agent.tags || [],
  strategyExecutionItems:
    agent.strategyExecutionItems?.map(item => ({
      label: item.label || '',
      description: item.description || '',
    })) || [],
})

const toPositionStatus = (lifecycle: PositionLifecycle) =>
  lifecycle === 'closed'
    ? ('closed' as const)
    : lifecycle === 'active' || lifecycle === 'closing'
    ? ('open' as const)
    : ('unknown' as const)

const toPositionExitKind = (exitKind?: string): PositionExitKind | undefined => {
  if (
    exitKind === 'POSITION_EXIT_KIND_UNSPECIFIED' ||
    exitKind === 'POSITION_EXIT_KIND_ALIGNED' ||
    exitKind === 'POSITION_EXIT_KIND_MANUAL'
  ) {
    return exitKind
  }

  return undefined
}

const toPosition = (position: ApiPosition): PositionSummary => {
  const token = toToken(position.token)
  const amountRaw = position.displayBaseRaw || position.remainingBaseRaw || '0'
  const lifecycle = toPositionLifecycle(position.lifecycle)

  return {
    positionId: position.positionId || '',
    userPositionId: position.userPositionId,
    agentPositionId: position.agentPositionId,
    copyRunId: position.copyRunId,
    agentId: position.agentId || '',
    chainId: chainIdNumber(position.chainId),
    copyAccount: position.copyAccount as Address | undefined,
    tradeId: position.tradeId || '',
    token,
    status: toPositionStatus(lifecycle),
    lifecycle,
    amountRaw,
    amountDecimal: formatRawAmount(amountRaw, token.decimals),
    remainingBaseRaw: position.remainingBaseRaw,
    totalGrossBaseBoughtRaw: position.totalGrossBaseBoughtRaw,
    totalGrossBaseSoldRaw: position.totalGrossBaseSoldRaw,
    upfrontFeeCapturedBaseRaw: position.upfrontFeeCapturedBaseRaw,
    upfrontFeeReleasedBaseRaw: position.upfrontFeeReleasedBaseRaw,
    netBaseReceivedRaw: position.netBaseReceivedRaw,
    remainingNetBaseRaw: position.remainingNetBaseRaw,
    displayBaseRaw: position.displayBaseRaw,
    entryValuation: position.entryValuation,
    currentValuation: position.currentValuation,
    exitValuation: position.exitValuation,
    entryPriceUsd: isValuationRenderable(position.entryValuation) ? position.entryValuation?.priceUsd : undefined,
    currentPriceUsd: isValuationRenderable(position.currentValuation) ? position.currentValuation?.priceUsd : undefined,
    exitPriceUsd: isValuationRenderable(position.exitValuation) ? position.exitValuation?.priceUsd : undefined,
    valueUsd: isValuationRenderable(position.currentValuation)
      ? position.currentValuation?.valueUsd
      : isValuationRenderable(position.exitValuation)
      ? position.exitValuation?.valueUsd
      : undefined,
    realizedPnlUsd: metricValue(position.realizedPnlUsd),
    unrealizedPnlUsd: metricValue(position.unrealizedPnlUsd),
    unrealizedPnlPct: metricValue(position.unrealizedPnlPct),
    flatFeeCapturedUsd: metricValue(position.flatFeeCapturedUsd),
    cashbackReceivedUsd: metricValue(position.cashbackReceivedUsd),
    netFeeCostUsd: metricValue(position.netFeeCostUsd),
    estimatedCashbackUsd: metricValue(position.estimatedCashbackUsd),
    metrics: {
      realizedPnlUsd: position.realizedPnlUsd,
      unrealizedPnlUsd: position.unrealizedPnlUsd,
      unrealizedPnlPct: position.unrealizedPnlPct,
      flatFeeCapturedUsd: position.flatFeeCapturedUsd,
      cashbackReceivedUsd: position.cashbackReceivedUsd,
      netFeeCostUsd: position.netFeeCostUsd,
      estimatedCashbackUsd: position.estimatedCashbackUsd,
      skippedSellCount: position.skippedSellCount,
      latestSkippedRatio: position.latestSkippedRatio,
      cumulativeSkippedRatio: position.cumulativeSkippedRatio,
    },
    quantityState: toPositionQuantityState(position.quantityState),
    exitKind: toPositionExitKind(position.exitKind),
    actionKind: position.actionKind as PositionSummary['actionKind'],
    availableActionKinds: (position.availableActionKinds || []) as PositionSummary['availableActionKinds'],
    isLeftover: position.isLeftover,
    leftoverReason: position.leftoverReason,
    leftoverValuation: position.leftoverValuation,
    latestSkipPublicErrorCode: position.latestSkipPublicErrorCode,
    durationSeconds: position.durationSeconds,
    durationAsOf: position.durationAsOf,
    openedAt: position.openedAt || '',
    closedAt: position.closedAt,
  }
}

const toPerformancePoint = (point: ApiPerformancePoint): PerformancePoint => {
  const value = metricValue(point.valueUsd)
  const isRealizedPnl = point.series !== 'PERFORMANCE_SERIES_PORTFOLIO_EQUITY'

  return {
    timestamp: point.timestamp || '',
    series: performanceSeriesMap[point.series || ''],
    interval: performanceIntervalMap[point.interval || ''],
    portfolioValueUsd: isRealizedPnl ? undefined : value,
    realizedPnlUsd: isRealizedPnl ? value : undefined,
    tradeId: point.tradeId,
    positionId: point.positionId,
    token: point.token ? toToken(point.token) : undefined,
    metric: point.valueUsd || {},
  }
}

const toCopyRunStatus = (status?: string): CopyRunStatus => {
  const value = status?.replace('COPY_RUN_STATUS_', '').toLowerCase()
  return (
    value === 'active' || value === 'closing' || value === 'closed' || value === 'stopped' ? value : 'unknown'
  ) as CopyRunStatus
}

const toCopyAccountStatus = (status?: string): CopyAccountStatus => {
  const value = status?.replace('COPY_ACCOUNT_STATUS_', '').toLowerCase()
  return (
    value === 'active' || value === 'closing' || value === 'closed' || value === 'stopped' ? value : 'unknown'
  ) as CopyAccountStatus
}

const toCapitalInProjectionStatus = (status?: string): CapitalInProjectionStatus => {
  const value = status
    ?.replace('COPY_RUN_CAPITAL_IN_PROJECTION_STATUS_', '')
    .replace('CAPITAL_IN_PROJECTION_STATUS_', '')
    .toLowerCase()
  return value === 'syncing' || value === 'ready' || value === 'unavailable' ? value : 'unknown'
}

const toCopyRun = (run: ApiCopyRun): CopyRunSummary => {
  const capitalInProjectionStatus = toCapitalInProjectionStatus(run.capitalInProjectionStatus)

  return {
    copyRunId: run.copyRunId || '',
    ownerAddress: (run.ownerAddress || '') as Address,
    agentId: run.agentId || run.agentSnapshot?.agentId || '',
    chainId: chainIdNumber(run.chainId),
    copyAccount: (run.copyAccount || '') as Address,
    status: toCopyRunStatus(run.status),
    capitalInProjectionStatus,
    startedAt: run.startedAt || '',
    stoppedAt: run.stoppedAt,
    capitalInUsd: capitalInProjectionStatus === 'ready' ? metricValue(run.capitalInUsd) : undefined,
    capitalOutUsd: metricValue(run.capitalOutUsd),
    portfolioValueUsd: metricValue(run.portfolioValueUsd),
    realizedPnlUsd: metricValue(run.realizedPnlUsd),
    unrealizedPnlUsd: metricValue(run.unrealizedPnlUsd),
    myAprSinceCopyPct: metricValue(run.myAprSinceCopy),
    openPositionCount: metricValue(run.openPositionCount),
    closedPositionCount: metricValue(run.closedPositionCount),
    leftoverPositionCount: metricValue(run.leftoverPositionCount),
    leftoverValueUsd: metricValue(run.leftoverValueUsd),
    flatFeesCapturedUsd: metricValue(run.flatFeesCapturedUsd),
    cashbackReceivedUsd: metricValue(run.cashbackReceivedUsd),
    netFeeCostUsd: metricValue(run.netFeeCostUsd),
    estimatedCashbackPendingUsd: metricValue(run.estimatedCashbackPendingUsd),
    durationSeconds: run.durationSeconds,
    durationAsOf: run.durationAsOf,
    addCapitalAvailability: run.addCapitalAvailability,
    stopCopyAvailability: run.stopCopyAvailability,
    withdrawQuoteAvailability: run.withdrawQuoteAvailability,
    metrics: {
      capitalInUsd: run.capitalInUsd,
      capitalOutUsd: run.capitalOutUsd,
      portfolioValueUsd: run.portfolioValueUsd,
      realizedPnlUsd: run.realizedPnlUsd,
      unrealizedPnlUsd: run.unrealizedPnlUsd,
      myAprSinceCopy: run.myAprSinceCopy,
      openPositionCount: run.openPositionCount,
      closedPositionCount: run.closedPositionCount,
      leftoverPositionCount: run.leftoverPositionCount,
      leftoverValueUsd: run.leftoverValueUsd,
      flatFeesCapturedUsd: run.flatFeesCapturedUsd,
      cashbackReceivedUsd: run.cashbackReceivedUsd,
      netFeeCostUsd: run.netFeeCostUsd,
      estimatedCashbackPendingUsd: run.estimatedCashbackPendingUsd,
    },
    agentSnapshot: run.agentSnapshot ? toAgentSnapshot(run.agentSnapshot) : undefined,
    agentStats: toAgentStats(run.agentSnapshot?.metrics),
  }
}

const toPositionActivity = (detail: ApiActivity['position']): ActivityRow['position'] =>
  detail
    ? {
        ...detail,
        baseTokenAddress: detail.baseTokenAddress as Address | undefined,
        quoteTokenAddress: detail.quoteTokenAddress as Address | undefined,
        baseToken: detail.baseToken ? toToken(detail.baseToken) : undefined,
        quoteToken: detail.quoteToken ? toToken(detail.quoteToken) : undefined,
      }
    : undefined

const toCapitalActivity = (detail: ApiActivity['capital']): ActivityRow['capital'] =>
  detail
    ? {
        ...detail,
        tokenAddress: detail.tokenAddress as Address | undefined,
        token: detail.token ? toToken(detail.token) : undefined,
      }
    : undefined

const toFeeActivity = (detail: ApiActivity['fee']): ActivityRow['fee'] =>
  detail
    ? {
        ...detail,
        tokenAddress: detail.tokenAddress as Address | undefined,
        token: detail.token ? toToken(detail.token) : undefined,
      }
    : undefined

const toExecutionActivity = (detail: ApiActivity['execution']): ActivityRow['execution'] =>
  detail
    ? {
        ...detail,
        token: detail.token ? toToken(detail.token) : undefined,
      }
    : undefined

const toActivity = (activity: ApiActivity): ActivityRow => ({
  activityId: activity.activityId || '',
  ownerAddress: (activity.ownerAddress || '') as Address,
  agentId: activity.agentId || '',
  chainId: chainIdNumber(activity.chainId),
  copyRunId: activity.copyRunId,
  copyAccount: activity.copyAccount as Address | undefined,
  activityType: (activity.type?.replace('ACTIVITY_TYPE_', '').toLowerCase() || 'unknown') as ActivityType,
  summary: activity.summary || '',
  occurredAt: activity.occurredAt || '',
  userPositionId: activity.userPositionId,
  followerPositionId: activity.followerPositionId,
  tradeId: activity.tradeId,
  txHash: activity.txHash,
  agentDisplayName: activity.agentDisplayName,
  agentAvatarUrl: activity.agentAvatarUrl,
  copyLifecycle: activity.copyLifecycle,
  position: toPositionActivity(activity.position),
  capital: toCapitalActivity(activity.capital),
  fee: toFeeActivity(activity.fee),
  execution: toExecutionActivity(activity.execution),
})

const toCopyAccount = (account: ApiCopyAccount): CopyAccountSummary => ({
  chainId: chainIdNumber(account.chainId),
  copyAccount: (account.copyAccount || '') as Address,
  ownerAddress: (account.ownerAddress || '') as Address,
  status: toCopyAccountStatus(account.status),
  activeCopyRuns: metricValue(account.activeCopyRuns),
  totalAllocatedUsd: metricValue(account.totalAllocatedUsd),
  portfolioValueUsd: metricValue(account.portfolioValueUsd),
  availableBalanceUsd: metricValue(account.availableBalanceUsd),
  realizedPnlUsd: metricValue(account.realizedPnlUsd),
  unrealizedPnlUsd: metricValue(account.unrealizedPnlUsd),
  openPositionCount: metricValue(account.openPositionCount),
  closedPositionCount: metricValue(account.closedPositionCount),
  leftoverPositionCount: metricValue(account.leftoverPositionCount),
  leftoverValueUsd: metricValue(account.leftoverValueUsd),
  flatFeesCapturedUsd: metricValue(account.flatFeesCapturedUsd),
  cashbackReceivedUsd: metricValue(account.cashbackReceivedUsd),
  netFeeCostUsd: metricValue(account.netFeeCostUsd),
  estimatedCashbackPendingUsd: metricValue(account.estimatedCashbackPendingUsd),
  copyRunId: account.copyRunId,
  startedAt: account.startedAt,
  stoppedAt: account.stoppedAt,
  addCapitalAvailability: account.addCapitalAvailability,
  stopCopyAvailability: account.stopCopyAvailability,
  withdrawQuoteAvailability: account.withdrawQuoteAvailability,
  metrics: {
    activeCopyRuns: account.activeCopyRuns,
    totalAllocatedUsd: account.totalAllocatedUsd,
    portfolioValueUsd: account.portfolioValueUsd,
    availableBalanceUsd: account.availableBalanceUsd,
    realizedPnlUsd: account.realizedPnlUsd,
    unrealizedPnlUsd: account.unrealizedPnlUsd,
    openPositionCount: account.openPositionCount,
    closedPositionCount: account.closedPositionCount,
    leftoverPositionCount: account.leftoverPositionCount,
    leftoverValueUsd: account.leftoverValueUsd,
    flatFeesCapturedUsd: account.flatFeesCapturedUsd,
    cashbackReceivedUsd: account.cashbackReceivedUsd,
    netFeeCostUsd: account.netFeeCostUsd,
    estimatedCashbackPendingUsd: account.estimatedCashbackPendingUsd,
  },
  agentSnapshot: account.agentSnapshot ? toAgentSnapshot(account.agentSnapshot) : undefined,
})

const toWalletBalance = (balance: ApiWalletBalance): WalletBalanceRow => ({
  chainId: chainIdNumber(balance.chainId),
  copyAccount: (balance.copyAccount || '') as Address,
  tokenAddress: (balance.tokenAddress || '') as Address,
  amountDecimal: balance.amountDecimal || '0',
  balanceSource: balance.balanceSource || '',
  freshnessStatus: balance.freshnessStatus || '',
  balanceAsOfBlock: balance.balanceAsOfBlock || '',
  cachedAt: balance.cachedAt || '',
  stalenessReason: balance.stalenessReason,
  token: balance.token ? toToken(balance.token) : undefined,
  valueUsd: isValuationRenderable(balance.currentValuation) ? balance.currentValuation?.valueUsd : undefined,
  currentValuation: balance.currentValuation,
})

const normalizePagination = (pagination?: Partial<CursorPagination>): CursorPagination => ({
  nextCursor: pagination?.nextCursor,
  hasMore: pagination?.hasMore === true,
  limit: pagination?.limit || 25,
})

const singleResponse = <ApiValue, Value>(
  response: ApiSingleResponse<ApiValue>,
  transform: (value: ApiValue) => Value,
): SingleResponse<Value> => ({
  data: transform(response.data as ApiValue),
  meta: response.meta,
})

const cursorResponse = <ApiValue, Value>(
  response: ApiCursorResponse<ApiValue>,
  transform: (value: ApiValue) => Value,
): CursorResponse<Value> => ({
  data: (response.data || []).map(transform),
  pagination: normalizePagination(response.pagination),
  meta: response.meta,
})

// Endpoint response adapters.
export const adaptChainsResponse = (response: ApiSingleResponse<ApiChain[]>): ChainsResponse => ({
  data: (response.data || []).map(
    (chain): Chain => ({
      chainId: chainIdNumber(chain.chainId),
      slug: chain.slug || '',
      name: chain.name || '',
      iconUrl: chain.iconUrl || '',
      isEnabled: chain.isEnabled === true,
    }),
  ),
  meta: response.meta,
})

export const adaptLeaderboardSummaryResponse = (
  response: ApiSingleResponse<{
    asOf?: string
    agentCount?: ApiMetric
    totalAumUsd?: ApiMetric
    totalCopierCount?: ApiMetric
    lifetimeVolumeUsd?: ApiMetric
  }>,
): LeaderboardSummaryResponse =>
  singleResponse(response, summary => ({
    asOf: summary.asOf,
    totalAgents: metricValue(summary.agentCount),
    totalAumUsd: metricValue(summary.totalAumUsd),
    totalCopiers: metricValue(summary.totalCopierCount),
    totalVolumeUsd: metricValue(summary.lifetimeVolumeUsd),
    metrics: {
      agentCount: summary.agentCount,
      totalAumUsd: summary.totalAumUsd,
      totalCopierCount: summary.totalCopierCount,
      lifetimeVolumeUsd: summary.lifetimeVolumeUsd,
    },
  }))

export const adaptLeaderboardResponse = (response: ApiCursorResponse<ApiAgentCard>): LeaderboardResponse =>
  cursorResponse(response, toAgentCard)

export const adaptAgentsResponse = (response: ApiCursorResponse<ApiAgentCard>): AgentsResponse =>
  cursorResponse(response, toAgentCard)

export const adaptAgentResponse = (response: ApiSingleResponse<ApiAgentProfile>): AgentResponse =>
  singleResponse(response, toAgentProfile)

export const adaptAgentStatsResponse = (response: ApiSingleResponse<ApiAgentMetrics>): AgentStatsResponse =>
  singleResponse(response, toAgentStats)

export const adaptPerformanceResponse = (
  response: ApiCursorResponse<ApiPerformancePoint>,
): AgentPerformanceResponse | CopyRunPerformanceResponse => cursorResponse(response, toPerformancePoint)

export const adaptPositionsResponse = (
  response: ApiCursorResponse<ApiPosition>,
): AgentPositionsResponse | CopyRunPositionsResponse | OwnerPositionsResponse | CopyAccountPositionsResponse =>
  cursorResponse(response, toPosition)

export const adaptPositionResponse = (response: ApiSingleResponse<ApiPosition>): AgentPositionResponse =>
  singleResponse(response, toPosition)

export const adaptPositionEventsResponse = (
  response: ApiCursorResponse<{
    eventId?: string
    positionId?: string
    chainId?: string
    eventType?: string
    summary?: string
    occurredAt?: string
    txHash?: string
    blockNumber?: string
  }>,
): AgentPositionEventsResponse =>
  cursorResponse(
    response,
    (event): PositionEvent => ({
      eventId: event.eventId || '',
      positionId: event.positionId || '',
      activityType: event.eventType?.toLowerCase() || '',
      chainId: chainIdNumber(event.chainId),
      summary: event.summary || '',
      occurredAt: event.occurredAt || '',
      txHash: event.txHash,
      blockNumber: event.blockNumber,
      metadata: {
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    }),
  )

export const adaptActionLogsResponse = (response: ApiCursorResponse<ApiAgentActionLog>): CotLogsResponse =>
  cursorResponse(
    response,
    (log): CotLog => ({
      logId: log.actionLogId || '',
      agentId: '',
      chainId: chainIdNumber(log.chainId),
      positionId: log.leaderPositionId,
      trigger: log.trigger || '',
      data: log.dataSummary || '',
      reasoning: log.reasoningSummary || '',
      action: log.actionSummary || log.action || '',
      actionCode: log.action,
      status: log.status || '',
      summary: log.summary,
      txHash: log.txHash,
      blockNumber: log.blockNumber,
      tokenAddress: log.tokenAddress as Address | undefined,
      model: log.model,
      strategyVersion: log.strategyVersion,
      occurredAt: log.occurredAt || '',
    }),
  )

export const adaptOwnerCopySummaryResponse = (
  response: ApiSingleResponse<ApiOwnerCopySummary>,
): OwnerCopySummaryResponse =>
  singleResponse(
    response,
    (summary): OwnerCopySummary => ({
      ownerAddress: (summary.ownerAddress || '') as Address,
      view: (summary.view === 'OWNER_COPY_VIEW_HISTORY' ? 'history' : 'open') as CopyRunView,
      totalAllocatedUsd: metricValue(summary.totalAllocatedUsd),
      portfolioValueUsd: metricValue(summary.portfolioValueUsd),
      realizedPnlUsd: metricValue(summary.realizedPnlUsd),
      unrealizedPnlUsd: metricValue(summary.unrealizedPnlUsd),
      openPositions: metricValue(summary.openPositionCount),
      activeCopies: metricValue(summary.activeCopyRuns),
      closedCopies: metricValue(summary.closedCopyRuns),
      closedPositions: metricValue(summary.closedPositionCount),
      closedCapitalUsd: metricValue(summary.closedCapitalUsd),
      leftoverPositions: metricValue(summary.leftoverPositionCount),
      leftoverValueUsd: metricValue(summary.leftoverValueUsd),
      flatFeesCapturedUsd: metricValue(summary.flatFeesCapturedUsd),
      cashbackReceivedUsd: metricValue(summary.cashbackReceivedUsd),
      netFeeCostUsd: metricValue(summary.netFeeCostUsd),
      estimatedCashbackPendingUsd: metricValue(summary.estimatedCashbackPendingUsd),
      metrics: {
        totalAllocatedUsd: summary.totalAllocatedUsd,
        portfolioValueUsd: summary.portfolioValueUsd,
        realizedPnlUsd: summary.realizedPnlUsd,
        unrealizedPnlUsd: summary.unrealizedPnlUsd,
        openPositionCount: summary.openPositionCount,
        activeCopyRuns: summary.activeCopyRuns,
        closedCopyRuns: summary.closedCopyRuns,
        closedPositionCount: summary.closedPositionCount,
        closedCapitalUsd: summary.closedCapitalUsd,
        leftoverPositionCount: summary.leftoverPositionCount,
        leftoverValueUsd: summary.leftoverValueUsd,
        flatFeesCapturedUsd: summary.flatFeesCapturedUsd,
        cashbackReceivedUsd: summary.cashbackReceivedUsd,
        netFeeCostUsd: summary.netFeeCostUsd,
        estimatedCashbackPendingUsd: summary.estimatedCashbackPendingUsd,
      },
    }),
  )

export const adaptCopyRunsResponse = (response: ApiCursorResponse<ApiCopyRun>): CopyRunsResponse =>
  cursorResponse(response, toCopyRun)

export const adaptCopyRunResponse = (response: ApiSingleResponse<ApiCopyRun>): CopyRunResponse =>
  singleResponse(response, toCopyRun)

export const adaptCopyRunCashbackPolicyResponse = (
  response: ApiSingleResponse<ApiCopyRunCashbackPolicy>,
): CopyRunCashbackPolicyResponse =>
  singleResponse(
    response,
    (policy): CopyRunCashbackPolicy => ({
      copyRunId: policy.copyRunId || '',
      chainId: chainIdNumber(policy.chainId),
      copyAccount: (policy.copyAccount || '') as Address,
      agentId: policy.agentId || '',
      capCashbackRatioRaw: policy.capCashbackRatioRaw,
      pnlRateRaw: policy.pnlRateRaw,
      scope: policy.scope || 'COPY_RUN_CASHBACK_POLICY_SCOPE_UNSPECIFIED',
      status: policy.status || 'COPY_RUN_CASHBACK_POLICY_STATUS_UNSPECIFIED',
      selectionPolicyVersion: policy.selectionPolicyVersion,
      cashbackFormulaVersion: policy.cashbackFormulaVersion,
      selectedAt: policy.selectedAt,
      invalidatedAt: policy.invalidatedAt,
      unavailableReason: policy.unavailableReason,
      fallbackAt: policy.fallbackAt,
    }),
  )

export const adaptActivityResponse = (
  response: ApiCursorResponse<ApiActivity>,
): OwnerActivityResponse | CopyAccountHistoryResponse => cursorResponse(response, toActivity)

export const adaptCopyAccountsResponse = (response: ApiCursorResponse<ApiCopyAccount>): OwnerCopyAccountsResponse =>
  cursorResponse(response, toCopyAccount)

export const adaptCopyAccountResponse = (response: ApiSingleResponse<ApiCopyAccount>): CopyAccountResponse =>
  singleResponse(response, toCopyAccount)

export const adaptCopyAccountBalancesResponse = (response: ApiBalancesResponse): CopyAccountBalancesResponse => ({
  ...cursorResponse(response, toWalletBalance),
  pinnedStableBalance: response.pinnedStableBalance
    ? {
        status: response.pinnedStableBalance.status as PinnedStableBalanceStatus | undefined,
        balance: response.pinnedStableBalance.balance
          ? toWalletBalance(response.pinnedStableBalance.balance)
          : undefined,
      }
    : undefined,
})

export const adaptCopyAccountWalletInventoryResponse = (
  response: ApiWalletInventoryResponse,
): CopyAccountWalletInventoryResponse => ({
  data: (response.data || []).map(toWalletBalance),
  walletInventoryValueUsd: response.walletInventoryValueUsd,
  complete: response.complete === true,
  pinnedStableBalance: response.pinnedStableBalance
    ? {
        status: response.pinnedStableBalance.status as PinnedStableBalanceStatus | undefined,
        balance: response.pinnedStableBalance.balance
          ? toWalletBalance(response.pinnedStableBalance.balance)
          : undefined,
      }
    : undefined,
  meta: response.meta,
})

export const adaptPendingSellObligationsResponse = (
  response: ApiCursorResponse<PendingSellObligation>,
): PendingSellObligationsResponse => cursorResponse(response, obligation => obligation)
