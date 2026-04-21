import { t } from '@lingui/macro'
import { KeyboardEvent, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { VaultInterval, useVaultDetailQuery, useVaultMetricsQuery } from 'services/vault'

import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { ApyBarChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
import {
  ActionCard,
  ActionPlaceholder,
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
import { toVaultInfoFromDetail } from 'pages/Earns/utils/vault'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type ActionTabKey = 'deposit' | 'withdraw'
type PeriodKey = '24H' | '7D' | '30D'

const PERIOD_OPTIONS: PeriodKey[] = ['24H', '7D', '30D']
const PERIOD_TO_INTERVAL: Record<PeriodKey, VaultInterval> = {
  '24H': '1d',
  '7D': '7d',
  '30D': '30d',
}

const formatApy = (value: number) => formatDisplayNumber(value, { style: 'decimal', fractionDigits: 2 })

const VaultDetail = () => {
  const { chainId: chainIdParam, vaultId } = useParams<{ chainId?: string; vaultId?: string }>()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const chainId = Number(chainIdParam)
  const hasValidParams = !!vaultId && Number.isFinite(chainId) && chainId > 0

  const {
    data: detail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useVaultDetailQuery({ chainId, vaultId: vaultId as string }, { skip: !hasValidParams })

  const [activeTab, setActiveTab] = useState<ActionTabKey>('deposit')
  const [tvlPeriod, setTvlPeriod] = useState<PeriodKey>('7D')
  const [apyPeriod, setApyPeriod] = useState<PeriodKey>('7D')

  const { data: tvlMetrics } = useVaultMetricsQuery(
    { chainId, vaultId: vaultId as string, interval: PERIOD_TO_INTERVAL[tvlPeriod] },
    { skip: !hasValidParams },
  )
  const { data: apyMetrics } = useVaultMetricsQuery(
    { chainId, vaultId: vaultId as string, interval: PERIOD_TO_INTERVAL[apyPeriod] },
    { skip: !hasValidParams },
  )

  const vault = useMemo(() => (detail ? toVaultInfoFromDetail(detail) : undefined), [detail])

  const chartHeight = upToXXSmall ? 170 : upToSmall ? 200 : 240

  const tvlSeries = useMemo(
    () => (tvlMetrics?.tvl || []).map(p => ({ value: Number(p.value) || 0 })),
    [tvlMetrics?.tvl],
  )
  const apySeries = useMemo(
    () => (apyMetrics?.apy || []).map(p => ({ value: Number(p.value) || 0 })),
    [apyMetrics?.apy],
  )

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

  if (isDetailLoading || !vault) {
    return (
      <PageWrapper>
        <HeaderRow>
          <BackArrow
            role="button"
            tabIndex={0}
            aria-label={t`Go back`}
            onClick={handleBack}
            onKeyDown={handleBackKey}
          />
          <HeaderTitle>{t`Loading...`}</HeaderTitle>
        </HeaderRow>
      </PageWrapper>
    )
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
          <HeaderTitleMuted>{vault.label}</HeaderTitleMuted>
        </HeaderTitle>
        <HeaderApy>
          <HeaderApyValue>{formatApy(vault.apy)}%</HeaderApyValue>
          <HeaderApyLabel>{t`APY`}</HeaderApyLabel>
        </HeaderApy>
      </HeaderRow>

      <ContentGrid>
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
                <VaultNameMuted>{vault.label}</VaultNameMuted>
              </VaultName>
            </VaultMetaLeft>
            <ProtocolTag>
              <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
              <span>
                {t`managed by`} {vault.partner}
              </span>
            </ProtocolTag>
          </VaultMetaRow>

          <ChartsBody>
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
                <TvlLineChart data={tvlSeries} height={chartHeight} />
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
                <ApyBarChart data={apySeries} height={chartHeight} />
              </ChartBox>
            </ChartSection>
          </ChartsBody>

          <HowItWorks>
            <HowItWorksLabel>{t`How it works:`}</HowItWorksLabel>
            <span>{t`Strategy vault optimizing yield across DeFi; earnings auto-compound.`}</span>
          </HowItWorks>
        </ChartsCard>

        <ActionCard>
          <ActionTabs>
            <ActionTab type="button" $active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
              {t`Deposit`}
            </ActionTab>
            <ActionTabDivider />
            <ActionTab type="button" $active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
              {t`Withdraw`}
            </ActionTab>
          </ActionTabs>
          <ActionPlaceholder key={activeTab}>
            {activeTab === 'deposit' ? t`Deposit flow coming soon.` : t`Withdraw flow coming soon.`}
          </ActionPlaceholder>
        </ActionCard>
      </ContentGrid>
    </PageWrapper>
  )
}

export default VaultDetail
