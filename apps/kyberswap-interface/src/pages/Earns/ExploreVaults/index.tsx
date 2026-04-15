import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { ApyBarChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
import { SAMPLE_VAULTS, VAULT_CHAIN_OPTIONS } from 'pages/Earns/ExploreVaults/sampleData'
import {
  ApyValue,
  CardBody,
  CardFooter,
  CardHeader,
  ChartWrapper,
  DepositButton,
  Disclaimer,
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
import DropdownMenu from 'pages/Earns/components/DropdownMenu'
import MultiSelectDropdownMenu from 'pages/Earns/components/DropdownMenu/MultiSelect'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const formatTvl = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 3 })

const SORT_BY_OPTIONS = [
  { label: 'APY', value: VaultSortBy.APY },
  { label: 'TVL', value: VaultSortBy.TVL },
]

/** IDs of vaults user has deposited into (mock) */
const USER_DEPOSITED_VAULT_IDS = new Set(['eth-yield-mainnet'])

const ExploreVaultCard = ({ vault }: { vault: VaultInfo }) => {
  const theme = useTheme()
  const hasPosition = USER_DEPOSITED_VAULT_IDS.has(vault.id)

  return (
    <VaultCard>
      <CardHeader>
        <Flex alignItems="center" style={{ gap: '4px' }}>
          <TokenIconWrapper>
            <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
            <TokenLogo
              src={vault.chainIcon}
              alt={vault.chainName}
              size={12}
              style={{ position: 'absolute', bottom: -2, right: -4 }}
            />
          </TokenIconWrapper>
          <Text fontSize={16} color={theme.white2} style={{ marginLeft: '4px' }}>
            {vault.token}
          </Text>
          <Text fontSize={16} color={theme.gray}>
            {vault.label}
          </Text>
        </Flex>

        <Flex alignItems="center" style={{ gap: '12px' }}>
          {hasPosition && <ViewPositionButton>{t`View Position`}</ViewPositionButton>}
          <DepositButton $disabled={vault.disabled}>{t`+ Deposit`}</DepositButton>
        </Flex>
      </CardHeader>

      <CardBody>
        <Flex flexDirection="column" style={{ gap: '4px' }}>
          <MetricRow>
            <MetricLabel>APY</MetricLabel>
            <ApyValue>{vault.apy.toFixed(2)}%</ApyValue>
          </MetricRow>
          <ChartWrapper $height={28}>
            <ApyBarChart data={vault.apyHistory} height={28} />
          </ChartWrapper>
        </Flex>

        <Flex flexDirection="column" style={{ gap: '16px' }}>
          <MetricRow>
            <MetricLabel>TVL</MetricLabel>
            <TvlValue>{formatTvl(vault.tvl)}</TvlValue>
          </MetricRow>
          <ChartWrapper $height={49}>
            <TvlLineChart data={vault.tvlHistory} height={49} />
          </ChartWrapper>
        </Flex>

        <CardFooter>
          <ProtocolTag>
            <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            <span>{`managed by ${vault.partner}`}</span>
          </ProtocolTag>
        </CardFooter>
      </CardBody>
    </VaultCard>
  )
}

const ExploreVaultListItem = ({ vault }: { vault: VaultInfo }) => {
  const theme = useTheme()
  const hasPosition = USER_DEPOSITED_VAULT_IDS.has(vault.id)

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
        <Text fontSize={16} color={theme.white2} style={{ marginLeft: '4px' }}>
          {vault.token}
        </Text>
        <Text fontSize={16} color={theme.gray}>
          {vault.label}
        </Text>
        <ProtocolTag style={{ marginLeft: '4px' }}>
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
  <VaultCard style={{ gap: '16px' }}>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <Flex alignItems="center" style={{ gap: '4px' }}>
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={18} />
        <PositionSkeleton width={30} height={18} />
      </Flex>
      <PositionSkeleton width={80} height={28} />
    </Flex>
    <Flex flexDirection="column" style={{ gap: '4px' }}>
      <Flex alignItems="flex-end" style={{ gap: '8px' }}>
        <PositionSkeleton width={30} height={16} />
        <PositionSkeleton width={80} height={32} />
      </Flex>
      <PositionSkeleton width="100%" height={28} />
    </Flex>
    <Flex flexDirection="column" style={{ gap: '16px' }}>
      <Flex alignItems="flex-end" style={{ gap: '8px' }}>
        <PositionSkeleton width={30} height={16} />
        <PositionSkeleton width={60} height={24} />
      </Flex>
      <PositionSkeleton width="100%" height={49} />
    </Flex>
    <PositionSkeleton width={140} height={22} />
  </VaultCard>
)

const ExploreVaults = () => {
  const [search, setSearch] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const [sortBy, setSortBy] = useState<VaultSortBy>(VaultSortBy.APY)
  const [viewMode, setViewMode] = useState<VaultViewMode>(VaultViewMode.GRID)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  /* list layout needs ~900px of horizontal space; below upToLarge we always show gallery
     (matches the gallery's own 3 -> 2 column transition at the same breakpoint) */
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const filteredVaults = useMemo(() => {
    let result = SAMPLE_VAULTS

    if (selectedChain) {
      result = result.filter(v => v.chainId.toString() === selectedChain)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        v =>
          v.token.toLowerCase().includes(q) ||
          v.partner.toLowerCase().includes(q) ||
          v.chainName.toLowerCase().includes(q),
      )
    }

    const sortKey = sortBy === VaultSortBy.TVL ? 'tvl' : 'apy'
    return [...result].sort((a, b) => b[sortKey] - a[sortKey])
  }, [search, selectedChain, sortBy])

  const chainLabel = useMemo(() => {
    const selected = VAULT_CHAIN_OPTIONS.find(c => c.value === selectedChain)
    return selected?.label || VAULT_CHAIN_OPTIONS[0].label
  }, [selectedChain])

  const isLoading = false
  const effectiveViewMode = upToLarge ? VaultViewMode.GRID : viewMode

  return (
    <VaultPageWrapper>
      <VaultPageTitle>{t`Explore`}</VaultPageTitle>

      <FilterRow>
        <FilterControls>
          <MultiSelectDropdownMenu
            alignLeft
            highlightOnSelect
            label={chainLabel}
            options={VAULT_CHAIN_OPTIONS}
            value={selectedChain}
            onChange={value => setSelectedChain(value.toString())}
          />

          <SortByGroup>
            <SortByLabel>{t`Sort by:`}</SortByLabel>
            <DropdownMenu
              alignLeft
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

      {effectiveViewMode === VaultViewMode.GRID ? (
        <VaultCardsGrid>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ExploreVaultCardSkeleton key={i} />)
            : filteredVaults.map(vault => <ExploreVaultCard key={vault.id} vault={vault} />)}
        </VaultCardsGrid>
      ) : (
        <VaultList>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ExploreVaultListItemSkeleton key={i} />)
            : filteredVaults.map(vault => <ExploreVaultListItem key={vault.id} vault={vault} />)}
        </VaultList>
      )}

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>
    </VaultPageWrapper>
  )
}

export default ExploreVaults
