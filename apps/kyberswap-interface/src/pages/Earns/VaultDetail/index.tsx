import { Trans, t } from '@lingui/macro'
import { KeyboardEvent, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import {
  VaultInterval,
  useVaultDetailQuery,
  useVaultMetricsQuery,
  useVaultPositionBalanceHistoryQuery,
  useVaultPositionDetailQuery,
  useVaultPositionGrowthHistoryQuery,
} from 'services/vault'

import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApyBarChart, BalanceLineChart, EarningLineChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
import DepositTab from 'pages/Earns/VaultDetail/DepositTab'
import VaultDetailPageSkeleton from 'pages/Earns/VaultDetail/PageSkeleton'
import WithdrawTab from 'pages/Earns/VaultDetail/WithdrawTab'
import ZapRouteStrip, { VaultRouteSummary } from 'pages/Earns/VaultDetail/ZapRouteStrip'
import {
  ActionCard,
  ActionTab,
  ActionTabDivider,
  ActionTabs,
  BackArrow,
  ChartBox,
  ChartHeader,
  ChartSection,
  ChartTitle,
  ChartsBody,
  ChartsCard,
  ChartsColumn,
  ContentGrid,
  HeaderApy,
  HeaderApyLabel,
  HeaderApyValue,
  HeaderRow,
  HeaderTitle,
  HeaderTitleMuted,
  HowItWorks,
  HowItWorksLabel,
  PageWrapper,
  PeriodTab,
  PeriodTabs,
  ProtocolTag,
  TokenIconWrapperSm,
  TokenStack,
  VaultMetaLeft,
  VaultMetaRow,
  VaultName,
  VaultNameMuted,
} from 'pages/Earns/VaultDetail/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import { VAULT_POLLING_INTERVAL } from 'pages/Earns/constants/vault'
import { useRefreshOnVaultTx } from 'pages/Earns/hooks/useRefreshOnVaultTx'
import {
  VaultDetailTab,
  toBalanceSeries,
  toChartSeries,
  toGrowthSeries,
  toVaultInfoFromDetail,
} from 'pages/Earns/utils/vault'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

/** The balance chart's heading, which carries the share count it plots. Only the amount rolls when a poll moves it. */
const PositionBalanceTitle = ({ balance }: { balance?: { amount: string; symbol: string } }) => (
  <ChartTitle className="min-w-0 truncate">
    {balance ? (
      <Trans>
        Position Balance: <AnimatedNumber value={balance.amount} /> {balance.symbol}
      </Trans>
    ) : (
      t`Position Balance`
    )}
  </ChartTitle>
)

type PeriodKey = '24H' | '7D' | '30D'

const PERIOD_OPTIONS: PeriodKey[] = ['24H', '7D', '30D']
const PERIOD_TO_INTERVAL: Record<PeriodKey, VaultInterval> = {
  '24H': '1d',
  '7D': '7d',
  '30D': '30d',
}

const formatApy = (value?: number) =>
  value === undefined ? '--' : `${formatDisplayNumber(value, { style: 'decimal', fractionDigits: 2 })}%`

const VaultDetail = () => {
  const { chainId: chainIdParam, vaultId } = useParams<{ chainId?: string; vaultId?: string }>()
  const navigate = useNavigate()
  const { account } = useActiveWeb3React()
  const [searchParams, setSearchParams] = useSearchParams()
  const [routeSummary, setRouteSummary] = useState<VaultRouteSummary | null>(null)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const chainId = Number(chainIdParam)
  const hasValidParams = !!vaultId && Number.isFinite(chainId) && chainId > 0

  const {
    data: detail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useVaultDetailQuery(
    { chainId, vaultId: vaultId as string },
    { skip: !hasValidParams, pollingInterval: VAULT_POLLING_INTERVAL },
  )

  const activeTab: VaultDetailTab = searchParams.get('tab') === 'withdraw' ? 'withdraw' : 'deposit'
  const setActiveTab = (tab: VaultDetailTab) => {
    searchParams.set('tab', tab)
    setSearchParams(searchParams, { replace: true })
  }
  const [tvlPeriod, setTvlPeriod] = useState<PeriodKey>('7D')
  const [apyPeriod, setApyPeriod] = useState<PeriodKey>('7D')
  const [earningPeriod, setEarningPeriod] = useState<PeriodKey>('7D')
  const [balancePeriod, setBalancePeriod] = useState<PeriodKey>('7D')

  const { data: tvlMetrics } = useVaultMetricsQuery(
    { chainId, vaultId: vaultId as string, interval: PERIOD_TO_INTERVAL[tvlPeriod] },
    { skip: !hasValidParams },
  )
  const { data: apyMetrics } = useVaultMetricsQuery(
    { chainId, vaultId: vaultId as string, interval: PERIOD_TO_INTERVAL[apyPeriod] },
    { skip: !hasValidParams },
  )

  const { data: position, refetch: refetchPosition } = useVaultPositionDetailQuery(
    { chainId, userAddress: (account || '').toLowerCase(), vaultId: vaultId as string },
    { skip: !hasValidParams || !account, pollingInterval: VAULT_POLLING_INTERVAL },
  )

  // Only a wallet that holds something has a history to plot.
  const hasPosition = Number(position?.shareBalance || 0) > 0
  // Waiting on the position to answer before asking for its history costs a whole round trip, and
  // the charts are the last thing on the page to fill. Both go out with it instead.
  const { data: growthHistory } = useVaultPositionGrowthHistoryQuery(
    {
      chainId,
      userAddress: (account || '').toLowerCase(),
      vaultId: vaultId as string,
      interval: PERIOD_TO_INTERVAL[earningPeriod],
    },
    { skip: !hasValidParams || !account },
  )
  const { data: balanceHistory } = useVaultPositionBalanceHistoryQuery(
    {
      chainId,
      userAddress: (account || '').toLowerCase(),
      vaultId: vaultId as string,
      interval: PERIOD_TO_INTERVAL[balancePeriod],
    },
    { skip: !hasValidParams || !account },
  )

  const vault = useMemo(() => (detail ? toVaultInfoFromDetail(detail) : undefined), [detail])

  // The balance chart is denominated in the vault's base token; the shares behind it sit in its heading.
  const positionBalance = useMemo(() => {
    const shares = Number(position?.shareBalance || 0)
    const symbol = detail?.shareToken?.symbol
    if (!shares || !symbol) return undefined
    return { amount: formatDisplayNumber(shares, { style: 'decimal', significantDigits: 6 }), symbol }
  }, [position?.shareBalance, detail?.shareToken?.symbol])

  // The user's own transactions refresh at once rather than waiting for the next poll.
  useRefreshOnVaultTx(refetchPosition)

  const chartHeight = upToXXSmall ? 170 : upToSmall ? 200 : 240

  const tvlSeries = useMemo(() => toChartSeries(tvlMetrics, point => point.tvl), [tvlMetrics])
  const apySeries = useMemo(() => toChartSeries(apyMetrics, point => point.rate), [apyMetrics])
  const earningSeries = useMemo(() => toGrowthSeries(growthHistory), [growthHistory])
  const balanceSeries = useMemo(() => toBalanceSeries(balanceHistory), [balanceHistory])

  const handleBack = () => navigate(-1)
  const handleBackKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleBack()
    }
  }

  if (!hasValidParams || isDetailError) {
    return <Navigate to={APP_PATHS.EARN_VAULTS} replace />
  }

  if (isDetailLoading || !detail || !vault) {
    return <VaultDetailPageSkeleton />
  }

  return (
    <PageWrapper>
      <HeaderRow>
        <BackArrow role="button" tabIndex={0} aria-label={t`Go back`} onClick={handleBack} onKeyDown={handleBackKey} />
        <TokenStack>
          <TokenLogo src={vault.tokenIcon} alt={vault.token} size={32} />
          <TokenLogo
            src={vault.chainIcon}
            alt={vault.chainName}
            size={14}
            style={{ position: 'absolute', bottom: -2, right: -4, borderRadius: '4px' }}
          />
        </TokenStack>
        <HeaderTitle>
          {vault.token}
          <HeaderTitleMuted>{t`Yield`}</HeaderTitleMuted>
        </HeaderTitle>
        <HeaderApy>
          <HeaderApyValue>
            <AnimatedNumber value={formatApy(vault.apy)} />
          </HeaderApyValue>
          <HeaderApyLabel>{t`APY`}</HeaderApyLabel>
        </HeaderApy>
      </HeaderRow>

      <ContentGrid>
        <ChartsColumn>
          {routeSummary ? <ZapRouteStrip summary={routeSummary} /> : null}

          <ChartsCard>
            <VaultMetaRow>
              <VaultMetaLeft>
                <TokenIconWrapperSm>
                  <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
                  <TokenLogo
                    src={vault.chainIcon}
                    alt={vault.chainName}
                    size={12}
                    style={{ position: 'absolute', bottom: -2, right: -4, borderRadius: '4px' }}
                  />
                </TokenIconWrapperSm>
                <VaultName>
                  {vault.token}
                  <VaultNameMuted>{t`Yield`}</VaultNameMuted>
                </VaultName>
              </VaultMetaLeft>
              <ProtocolTag>
                {vault.partnerLogo ? (
                  <img
                    src={vault.partnerLogo}
                    alt={vault.partner}
                    width={16}
                    height={16}
                    style={{ borderRadius: '50%' }}
                  />
                ) : null}
                <span>
                  {t`managed by`} {vault.partner}
                </span>
              </ProtocolTag>
            </VaultMetaRow>

            <ChartsBody>
              {hasPosition ? (
                <ChartSection>
                  <ChartHeader>
                    <ChartTitle>{t`Earning in USD`}</ChartTitle>
                    <PeriodTabs>
                      {PERIOD_OPTIONS.map(period => (
                        <PeriodTab
                          key={period}
                          type="button"
                          $active={earningPeriod === period}
                          onClick={() => setEarningPeriod(period)}
                        >
                          {period}
                        </PeriodTab>
                      ))}
                    </PeriodTabs>
                  </ChartHeader>
                  <ChartBox key={`earning-${earningPeriod}`}>
                    <EarningLineChart data={earningSeries} height={chartHeight} showAxes />
                  </ChartBox>
                </ChartSection>
              ) : null}

              {/* Someone with a stake is here for their own holding, so it takes the slot the
                  vault's total size occupies for everyone else. */}
              {hasPosition ? (
                <ChartSection>
                  <ChartHeader>
                    <PositionBalanceTitle balance={positionBalance} />
                    <PeriodTabs>
                      {PERIOD_OPTIONS.map(period => (
                        <PeriodTab
                          key={period}
                          type="button"
                          $active={balancePeriod === period}
                          onClick={() => setBalancePeriod(period)}
                        >
                          {period}
                        </PeriodTab>
                      ))}
                    </PeriodTabs>
                  </ChartHeader>
                  <ChartBox key={`balance-${balancePeriod}`}>
                    <BalanceLineChart data={balanceSeries} height={chartHeight} symbol={vault?.token} showAxes />
                  </ChartBox>
                </ChartSection>
              ) : (
                <ChartSection>
                  <ChartHeader>
                    <ChartTitle>{t`TVL`}</ChartTitle>
                    <PeriodTabs>
                      {PERIOD_OPTIONS.map(period => (
                        <PeriodTab
                          key={period}
                          type="button"
                          $active={tvlPeriod === period}
                          onClick={() => setTvlPeriod(period)}
                        >
                          {period}
                        </PeriodTab>
                      ))}
                    </PeriodTabs>
                  </ChartHeader>
                  <ChartBox key={`tvl-${tvlPeriod}`}>
                    <TvlLineChart data={tvlSeries} height={chartHeight} showAxes />
                  </ChartBox>
                </ChartSection>
              )}

              <ChartSection>
                <ChartHeader>
                  <ChartTitle>{t`APY`}</ChartTitle>
                  <PeriodTabs>
                    {PERIOD_OPTIONS.map(period => (
                      <PeriodTab
                        key={period}
                        type="button"
                        $active={apyPeriod === period}
                        onClick={() => setApyPeriod(period)}
                      >
                        {period}
                      </PeriodTab>
                    ))}
                  </PeriodTabs>
                </ChartHeader>
                <ChartBox key={`apy-${apyPeriod}`}>
                  <ApyBarChart data={apySeries} height={chartHeight} showAxes />
                </ChartBox>
              </ChartSection>
            </ChartsBody>

            <HowItWorks>
              <HowItWorksLabel>{t`How it works:`}</HowItWorksLabel>
              <span>{t`Strategy vault optimizing yield across DeFi; earnings auto-compound.`}</span>
            </HowItWorks>
          </ChartsCard>
        </ChartsColumn>

        <ActionCard>
          <ActionTabs>
            <ActionTab type="button" $active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
              {t`Deposit`}
            </ActionTab>
            <ActionTabDivider />
            <ActionTab type="button" $active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
              {t`Withdraw`}
            </ActionTab>
            <ActionTabDivider />
          </ActionTabs>
          {activeTab === 'deposit' ? (
            <DepositTab
              key={`deposit-${detail.vaultId}`}
              vault={detail}
              onDeposited={refetchPosition}
              onRouteChange={setRouteSummary}
            />
          ) : (
            <WithdrawTab
              key={`withdraw-${detail.vaultId}`}
              vault={detail}
              position={position}
              onRequested={refetchPosition}
              onRouteChange={setRouteSummary}
            />
          )}
        </ActionCard>
      </ContentGrid>
    </PageWrapper>
  )
}

export default VaultDetail
