import { formatAprNumber } from '@kyber/utils/dist/number'
import { useMemo, useState } from 'react'
import { PoolDetail as PoolDetailData } from 'services/zapEarn'

import { EarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

import {
  DetailCard,
  DetailLabel,
  DetailPairWrap,
  DetailValue,
  MetricHint,
  MetricLabel,
  MetricTile,
  MetricValue,
  MetricWrap,
  NoteCard,
  PoolInfoActivePlaceholder,
  PoolInfoContent,
  PoolInfoContentCard,
  PoolInfoHeader,
  PoolInfoPlaceholder,
  PoolInfoTab,
  PoolInfoTitle,
  PoolTabsBar,
  SectionBlock,
  SectionBlockTitle,
} from '../styled'

const POOL_INFO_TABS = ['Pool Information', 'Earning', 'Analytics']

const formatCurrency = (value?: number) =>
  value || value === 0 ? formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }) : '--'

const formatPercent = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

interface PoolInformationProps {
  pool?: EarnPool
  poolDetail?: PoolDetailData
  chainName?: string
  dexName?: string
}

const PoolInformation = ({ pool, poolDetail, chainName, dexName }: PoolInformationProps) => {
  const [activeTab, setActiveTab] = useState(POOL_INFO_TABS[0])

  const content = useMemo(() => {
    switch (activeTab) {
      case 'Pool Information':
        return (
          <>
            <SectionBlock>
              <SectionBlockTitle>Pool Wiring</SectionBlockTitle>
              <DetailPairWrap>
                <DetailCard>
                  <DetailLabel>Pool Address</DetailLabel>
                  <DetailValue>{pool?.address || poolDetail?.address || '--'}</DetailValue>
                </DetailCard>
                <DetailCard>
                  <DetailLabel>Protocol And Chain</DetailLabel>
                  <DetailValue>{[dexName, chainName].filter(Boolean).join(' · ') || '--'}</DetailValue>
                </DetailCard>
              </DetailPairWrap>
            </SectionBlock>

            <MetricWrap>
              <MetricTile>
                <MetricLabel>TVL</MetricLabel>
                <MetricValue>{formatCurrency(pool?.tvl || Number(poolDetail?.reserveUsd))}</MetricValue>
                <MetricHint>Explorer TVL with detail fallback.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>24H Volume</MetricLabel>
                <MetricValue>{formatCurrency(pool?.volume)}</MetricValue>
                <MetricHint>From explorer listing data.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>Pool Type</MetricLabel>
                <MetricValue>{poolDetail?.type || '--'}</MetricValue>
                <MetricHint>From `usePoolDetailQuery`.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>Swap Fee</MetricLabel>
                <MetricValue>
                  {pool?.feeTier !== undefined
                    ? `${pool.feeTier}%`
                    : poolDetail?.swapFee !== undefined
                    ? `${poolDetail.swapFee}%`
                    : '--'}
                </MetricValue>
                <MetricHint>Displayed in the header and route summary.</MetricHint>
              </MetricTile>
            </MetricWrap>
            <MetricWrap>
              <MetricTile>
                <MetricLabel>Tick Spacing</MetricLabel>
                <MetricValue>{poolDetail?.positionInfo?.tickSpacing ?? '--'}</MetricValue>
                <MetricHint>Needed for concentrated liquidity price range controls.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>Current Tick</MetricLabel>
                <MetricValue>{poolDetail?.positionInfo?.tick ?? '--'}</MetricValue>
                <MetricHint>Used to determine in-range and price visualization.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>Reserve USD</MetricLabel>
                <MetricValue>{formatCurrency(Number(poolDetail?.reserveUsd))}</MetricValue>
                <MetricHint>Raw reserve value from pool detail endpoint.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>Amplified TVL</MetricLabel>
                <MetricValue>{formatCurrency(Number(poolDetail?.amplifiedTvl))}</MetricValue>
                <MetricHint>Useful for amplified pools when provided.</MetricHint>
              </MetricTile>
            </MetricWrap>
          </>
        )
      case 'Earning':
        return (
          <>
            <MetricWrap>
              <MetricTile>
                <MetricLabel>Est. Pool APR</MetricLabel>
                <MetricValue $accent>{formatPercent(pool?.allApr)}</MetricValue>
                <MetricHint>Total APR from pool explorer.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>LP APR</MetricLabel>
                <MetricValue $accent>{formatPercent(pool?.lpApr)}</MetricValue>
                <MetricHint>Base LP fee APR.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>Reward APR</MetricLabel>
                <MetricValue $accent>
                  {formatPercent((pool?.kemEGApr || 0) + (pool?.kemLMApr || 0) + (pool?.bonusApr || 0))}
                </MetricValue>
                <MetricHint>EG, LM, and bonus APR combined.</MetricHint>
              </MetricTile>
              <MetricTile>
                <MetricLabel>24H Earn Fees</MetricLabel>
                <MetricValue>{formatCurrency(pool?.earnFee)}</MetricValue>
                <MetricHint>Explorer-side earning fee snapshot.</MetricHint>
              </MetricTile>
            </MetricWrap>
            <NoteCard>
              Reward sections, distributions, and farming cycle progress still need to be connected if this page is
              intended to match the full widget or position detail experience.
            </NoteCard>
          </>
        )
      case 'Analytics':
        return (
          <>
            <NoteCard>
              Charting and historical analytics still need a dedicated data source. `PoolDetail` now has the slot and
              metrics to host them cleanly.
            </NoteCard>
          </>
        )
      default:
        return null
    }
  }, [activeTab, chainName, dexName, pool, poolDetail])

  return (
    <PoolInfoContent>
      <PoolInfoContentCard>
        <PoolInfoHeader>
          <PoolInfoTitle>Pool Information</PoolInfoTitle>
          <PoolTabsBar>
            {POOL_INFO_TABS.map(tab => (
              <PoolInfoTab key={tab} $active={tab === activeTab} onClick={() => setActiveTab(tab)}>
                {tab}
              </PoolInfoTab>
            ))}
          </PoolTabsBar>
        </PoolInfoHeader>
      </PoolInfoContentCard>

      <PoolInfoContentCard>
        <PoolInfoActivePlaceholder>{activeTab}</PoolInfoActivePlaceholder>
        <PoolInfoPlaceholder>
          Three-tab detail surface for pool information, earning context, and analytics.
        </PoolInfoPlaceholder>
        {content}
      </PoolInfoContentCard>
    </PoolInfoContent>
  )
}

export default PoolInformation
