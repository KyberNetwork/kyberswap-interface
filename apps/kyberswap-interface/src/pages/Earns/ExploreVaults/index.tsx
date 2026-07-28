import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useVaultListQuery, useVaultPositionsQuery } from 'services/vault'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import DropdownMenu from 'components/DropdownMenu'
import MultiSelectDropdownMenu from 'components/DropdownMenu/MultiSelect'
import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApyBarChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
import { VAULT_CHAIN_OPTIONS } from 'pages/Earns/ExploreVaults/sampleData'
import {
  ApyValue,
  CardBody,
  CardFooter,
  CardHeader,
  ChartWrapper,
  DepositButton,
  Disclaimer,
  EmptyStateSubtitle,
  EmptyStateTitle,
  EmptyStateWrapper,
  FilterControls,
  FilterRow,
  MetricLabel,
  MetricRow,
  ProtocolTag,
  SortByGroup,
  SortByLabel,
  TokenIconWrapper,
  TvlValue,
  VaultCard,
  VaultCardsGrid,
  VaultList,
  VaultListActions,
  VaultListChartWrapper,
  VaultListMetric,
  VaultListMetricLabel,
  VaultListMetricText,
  VaultListMetricValue,
  VaultListRow,
  VaultListRowMain,
  VaultPageTitle,
  VaultPageWrapper,
  ViewPositionButton,
  ViewToggleButton,
  ViewToggleGroup,
} from 'pages/Earns/ExploreVaults/styles'
import { VaultInfo, VaultSortBy, VaultViewMode } from 'pages/Earns/ExploreVaults/types'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { toVaultInfo } from 'pages/Earns/utils/vault'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const formatTvl = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 3 })

const SORT_BY_OPTIONS = [
  { label: 'APY', value: VaultSortBy.APY },
  { label: 'TVL', value: VaultSortBy.TVL },
]

const SORT_FIELD_BY_KEY: Record<VaultSortBy, string> = {
  [VaultSortBy.APY]: 'apy7d',
  [VaultSortBy.TVL]: 'tvlUsd',
}

const buildVaultDetailPath = (chainId: number, vaultId: string) =>
  APP_PATHS.EARN_VAULT_DETAIL.replace(':chainId', String(chainId)).replace(':vaultId', vaultId)

const ExploreVaultCard = ({ vault, hasPosition }: { vault: VaultInfo; hasPosition: boolean }) => {
  const navigate = useNavigate()

  const goToDetail = () => {
    if (vault.disabled) return
    navigate(buildVaultDetailPath(vault.chainId, vault.id))
  }

  return (
    <VaultCard
      role="button"
      tabIndex={vault.disabled ? -1 : 0}
      aria-disabled={vault.disabled || undefined}
      $clickable
      $disabled={vault.disabled}
      onClick={goToDetail}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToDetail()
        }
      }}
    >
      <CardHeader>
        <div className="flex items-center gap-1">
          <TokenIconWrapper>
            <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
            <TokenLogo
              src={vault.chainIcon}
              alt={vault.chainName}
              size={12}
              style={{ position: 'absolute', bottom: -2, right: -4 }}
            />
          </TokenIconWrapper>
          <span className="ml-1 text-base text-white2">{vault.token}</span>
          <span className="text-base text-gray">{vault.label}</span>
        </div>

        <div className="flex items-center gap-3">
          {hasPosition && (
            <ViewPositionButton
              type="button"
              onClick={e => {
                e.stopPropagation()
                goToDetail()
              }}
            >
              {t`View Position`}
            </ViewPositionButton>
          )}
          <DepositButton
            type="button"
            $disabled={vault.disabled}
            disabled={vault.disabled}
            onClick={e => {
              e.stopPropagation()
              goToDetail()
            }}
          >
            {t`+ Deposit`}
          </DepositButton>
        </div>
      </CardHeader>

      <CardBody>
        <div className="flex flex-col gap-1">
          <MetricRow>
            <MetricLabel>APY</MetricLabel>
            <ApyValue>{vault.apy.toFixed(2)}%</ApyValue>
          </MetricRow>
          <ChartWrapper $height={28}>
            <ApyBarChart data={vault.apyHistory} height={28} />
          </ChartWrapper>
        </div>

        <div className="flex flex-col gap-4">
          <MetricRow>
            <MetricLabel>TVL</MetricLabel>
            <TvlValue>{formatTvl(vault.tvl)}</TvlValue>
          </MetricRow>
          <ChartWrapper $height={49}>
            <TvlLineChart data={vault.tvlHistory} height={49} />
          </ChartWrapper>
        </div>

        <CardFooter>
          <ProtocolTag>
            <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            <span>
              {t`managed by`} {vault.partner}
            </span>
          </ProtocolTag>
        </CardFooter>
      </CardBody>
    </VaultCard>
  )
}

const ExploreVaultListItem = ({ vault, hasPosition }: { vault: VaultInfo; hasPosition: boolean }) => {
  return (
    <VaultListRow $disabled={vault.disabled}>
      <VaultListRowMain>
        <TokenIconWrapper>
          <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
          <TokenLogo
            src={vault.chainIcon}
            alt={vault.chainName}
            size={12}
            style={{ position: 'absolute', bottom: -2, right: -4 }}
          />
        </TokenIconWrapper>
        <span className="ml-1 text-base text-white2">{vault.token}</span>
        <span className="text-base text-gray">{vault.label}</span>
        <ProtocolTag className="ml-1">
          <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
          <span>{`managed by ${vault.partner}`}</span>
        </ProtocolTag>
      </VaultListRowMain>

      <VaultListMetric>
        <VaultListMetricText>
          <VaultListMetricLabel>APY</VaultListMetricLabel>
          <VaultListMetricValue>{vault.apy.toFixed(2)}%</VaultListMetricValue>
        </VaultListMetricText>
        <VaultListChartWrapper>
          <ApyBarChart data={vault.apyHistory} height={28} />
        </VaultListChartWrapper>
      </VaultListMetric>

      <VaultListMetric>
        <VaultListMetricText>
          <VaultListMetricLabel>TVL</VaultListMetricLabel>
          <VaultListMetricValue>{formatTvl(vault.tvl)}</VaultListMetricValue>
        </VaultListMetricText>
        <VaultListChartWrapper>
          <TvlLineChart data={vault.tvlHistory} height={28} />
        </VaultListChartWrapper>
      </VaultListMetric>

      <VaultListActions>
        {hasPosition && <ViewPositionButton>{t`View Position`}</ViewPositionButton>}
        <DepositButton $disabled={vault.disabled}>{t`+ Deposit`}</DepositButton>
      </VaultListActions>
    </VaultListRow>
  )
}

const ExploreVaultListItemSkeleton = () => (
  <VaultListRow>
    <VaultListRowMain>
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
      <PositionSkeleton width={40} height={18} />
      <PositionSkeleton width={30} height={18} />
      <PositionSkeleton width={140} height={20} style={{ borderRadius: '8px' }} />
    </VaultListRowMain>
    <VaultListMetric>
      <PositionSkeleton width={160} height={28} />
    </VaultListMetric>
    <VaultListMetric>
      <PositionSkeleton width={160} height={28} />
    </VaultListMetric>
    <VaultListActions>
      <PositionSkeleton width={90} height={32} />
    </VaultListActions>
  </VaultListRow>
)

const ExploreVaultCardSkeleton = () => (
  <VaultCard className="gap-4">
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-1">
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={18} />
        <PositionSkeleton width={30} height={18} />
      </div>
      <PositionSkeleton width={80} height={28} />
    </div>
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <PositionSkeleton width={30} height={16} />
        <PositionSkeleton width={80} height={32} />
      </div>
      <PositionSkeleton width="100%" height={28} />
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <PositionSkeleton width={30} height={16} />
        <PositionSkeleton width={60} height={24} />
      </div>
      <PositionSkeleton width="100%" height={49} />
    </div>
    <PositionSkeleton width={140} height={22} />
  </VaultCard>
)

const ExploreVaults = () => {
  const { account } = useActiveWeb3React()
  const [search, setSearch] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const [sortBy, setSortBy] = useState<VaultSortBy>(VaultSortBy.APY)
  const [viewMode, setViewMode] = useState<VaultViewMode>(VaultViewMode.GRID)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  /* list layout needs ~900px of horizontal space; below upToLarge we always show gallery
     (matches the gallery's own 3 -> 2 column transition at the same breakpoint) */
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { data: vaultListData, isLoading } = useVaultListQuery({
    chainIds: selectedChain || undefined,
    keyword: search.trim() || undefined,
    sorts: `${SORT_FIELD_BY_KEY[sortBy]}:desc`,
    pageSize: 100,
  })

  const { data: positionsData } = useVaultPositionsQuery(
    { userAddress: (account || '').toLowerCase(), pageSize: 100 },
    { skip: !account },
  )

  const vaults = useMemo<VaultInfo[]>(() => (vaultListData?.vaults || []).map(toVaultInfo), [vaultListData?.vaults])

  const userVaultIds = useMemo(() => {
    const set = new Set<string>()
    positionsData?.positions?.forEach(p => {
      if (p.vault?.id) set.add(p.vault.id)
    })
    return set
  }, [positionsData?.positions])

  const chainLabel = useMemo(() => {
    const selected = VAULT_CHAIN_OPTIONS.find(c => c.value === selectedChain)
    return selected?.label || VAULT_CHAIN_OPTIONS[0].label
  }, [selectedChain])

  const effectiveViewMode = upToLarge ? VaultViewMode.GRID : viewMode

  return (
    <VaultPageWrapper>
      <VaultPageTitle>{t`Explore`}</VaultPageTitle>

      <FilterRow>
        <FilterControls>
          <MultiSelectDropdownMenu
            alignItems="flex-start"
            highlightOnSelect
            label={chainLabel}
            options={VAULT_CHAIN_OPTIONS}
            value={selectedChain}
            onChange={value => setSelectedChain(value.toString())}
          />

          <SortByGroup>
            <SortByLabel>{t`Sort by:`}</SortByLabel>
            <DropdownMenu
              alignItems="flex-start"
              width={70}
              options={SORT_BY_OPTIONS}
              value={sortBy}
              onChange={value => setSortBy(value as VaultSortBy)}
            />
          </SortByGroup>

          <ViewToggleGroup role="group" aria-label={t`Layout`}>
            <ViewToggleButton
              type="button"
              aria-label={t`List view`}
              aria-pressed={viewMode === VaultViewMode.LIST}
              $active={viewMode === VaultViewMode.LIST}
              onClick={() => setViewMode(VaultViewMode.LIST)}
            >
              <ListViewIcon />
            </ViewToggleButton>
            <ViewToggleButton
              type="button"
              aria-label={t`Gallery view`}
              aria-pressed={viewMode === VaultViewMode.GRID}
              $active={viewMode === VaultViewMode.GRID}
              onClick={() => setViewMode(VaultViewMode.GRID)}
            >
              <GridViewIcon />
            </ViewToggleButton>
          </ViewToggleGroup>
        </FilterControls>

        <Search
          placeholder={t`Search by token or vaults`}
          searchValue={search}
          onSearch={setSearch}
          style={{ height: '36px', width: upToSmall ? '100%' : '400px' }}
        />
      </FilterRow>

      {!isLoading && vaults.length === 0 ? (
        <EmptyStateWrapper>
          <IconEarnNotFound />
          <EmptyStateTitle>{t`No vaults found`}</EmptyStateTitle>
          <EmptyStateSubtitle>
            <span>{t`Try adjusting your filters or search keyword.`}</span>
          </EmptyStateSubtitle>
        </EmptyStateWrapper>
      ) : effectiveViewMode === VaultViewMode.GRID ? (
        <VaultCardsGrid>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ExploreVaultCardSkeleton key={i} />)
            : vaults.map(vault => (
                <ExploreVaultCard key={vault.id} vault={vault} hasPosition={userVaultIds.has(vault.id)} />
              ))}
        </VaultCardsGrid>
      ) : (
        <VaultList>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ExploreVaultListItemSkeleton key={i} />)
            : vaults.map(vault => (
                <ExploreVaultListItem key={vault.id} vault={vault} hasPosition={userVaultIds.has(vault.id)} />
              ))}
        </VaultList>
      )}

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>
    </VaultPageWrapper>
  )
}

export default ExploreVaults
