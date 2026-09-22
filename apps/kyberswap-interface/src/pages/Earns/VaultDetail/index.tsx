import { Trans, t } from '@lingui/macro'
import { KeyboardEvent, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import {
  VaultInterval,
  useVaultDetailQuery,
  useVaultMetricsQuery,
  useVaultPositionDetailQuery,
  useVaultPositionGrowthHistoryQuery,
} from 'services/vault'

import { ReactComponent as BagIcon } from 'assets/svg/earn/ic_bag.svg'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApyBarChart, EarningLineChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
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
import { VaultDetailTab, toChartSeries, toGrowthSeries, toVaultInfoFromDetail } from 'pages/Earns/utils/vault'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

/** The user's stake, under the TVL heading. Only the amount rolls when a poll moves it. */
const PositionBalance = ({ amount, symbol }: { amount: string; symbol: string }) => (
  <span className="truncate text-xs leading-4 text-subText">
    <Trans>
      Your balance: <AnimatedNumber value={amount} /> {symbol}
    </Trans>
  </span>
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
  const { data: growthHistory } = useVaultPositionGrowthHistoryQuery(
    {
      chainId,
      userAddress: (account || '').toLowerCase(),
      vaultId: vaultId as string,
      interval: PERIOD_TO_INTERVAL[earningPeriod],
    },
    { skip: !hasValidParams || !account || !hasPosition },
  )

  const vault = useMemo(() => (detail ? toVaultInfoFromDetail(detail) : undefined), [detail])

  // The chart plots the vault's own size; the user's stake in it rides along as a sub-heading.
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

              <ChartSection>
                <ChartHeader>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <ChartTitle>{t`TVL`}</ChartTitle>
                    {positionBalance ? <PositionBalance {...positionBalance} /> : null}
                  </div>
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
              <BagIcon width={16} height={16} />
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
