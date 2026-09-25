import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useVaultListQuery, useVaultPositionsQuery } from 'services/vault'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import DropdownMenu from 'components/DropdownMenu'
import MultiSelectDropdownMenu from 'components/DropdownMenu/MultiSelect'
import SelectedOptionsLabel from 'components/DropdownMenu/SelectedOptionsLabel'
import { ListingPageTitle } from 'components/Listing/Page'
import Search from 'components/Search'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { ApyBarChart, TvlLineChart } from 'pages/Earns/ExploreVaults/MiniCharts'
import {
  ApyValue,
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitleLink,
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
  SearchGroup,
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
  VaultPageWrapper,
  ViewPositionButton,
  ViewToggleButton,
  ViewToggleGroup,
} from 'pages/Earns/ExploreVaults/styles'
import { VaultInfo, VaultSortBy, VaultViewMode } from 'pages/Earns/ExploreVaults/types'
import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import VaultDepositModal from 'pages/Earns/components/VaultDeposit/VaultDepositModal'
import { VAULT_CHAIN_OPTIONS, VAULT_PROTOCOL_OPTIONS } from 'pages/Earns/constants/vaultFilters'
import { buildVaultDetailPath, toVaultInfo } from 'pages/Earns/utils/vault'
import { formatVaultApy, formatVaultTvl } from 'pages/Earns/utils/vaultFormat'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const SEARCH_DEBOUNCE_MS = 300

const SORT_BY_OPTIONS = [
  { label: 'APY', value: VaultSortBy.APY },
  { label: 'TVL', value: VaultSortBy.TVL },
]

const VAULT_VIEW_MODE_KEY = 'earn-vaults-view-mode'

const readStoredViewMode = (): VaultViewMode => {
  try {
    return window.localStorage.getItem(VAULT_VIEW_MODE_KEY) === VaultViewMode.LIST
      ? VaultViewMode.LIST
      : VaultViewMode.GRID
  } catch {
    return VaultViewMode.GRID
  }
}

const SORT_FIELD_BY_KEY: Record<VaultSortBy, string> = {
  [VaultSortBy.APY]: 'apy7d',
  [VaultSortBy.TVL]: 'tvlUsd',
}

type VaultItemProps = {
  vault: VaultInfo
  hasPosition: boolean
  onDeposit: (vault: VaultInfo) => void
  /** Position in the list, used to stagger the entrance; omitted when the item should just appear. */
  revealIndex?: number
}

const VaultIdentity = ({ vault }: { vault: VaultInfo }) => (
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
    <span className="text-base text-gray">{t`Yield`}</span>
  </div>
)

const ExploreVaultCard = ({ vault, hasPosition, onDeposit, revealIndex }: VaultItemProps) => {
  const navigate = useNavigate()
  const detailPath = buildVaultDetailPath(vault.chainId, vault.id)
  // Tells the Earn sidebar which vault section this detail page belongs to.
  const detailState = { from: APP_PATHS.EARN_VAULTS }

  return (
    <VaultCard $subgrid $clickable={!vault.disabled} $disabled={vault.disabled} $revealIndex={revealIndex}>
      <CardHeader>
        {vault.disabled ? (
          <VaultIdentity vault={vault} />
        ) : (
          <CardTitleLink to={detailPath} state={detailState}>
            <VaultIdentity vault={vault} />
          </CardTitleLink>
        )}

        <CardActions>
          {hasPosition && (
            <ViewPositionButton type="button" onClick={() => navigate(detailPath, { state: detailState })}>
              {t`View Position`}
            </ViewPositionButton>
          )}
          <DepositButton
            type="button"
            $disabled={vault.disabled}
            disabled={vault.disabled}
            onClick={() => onDeposit(vault)}
          >
            {t`+ Deposit`}
          </DepositButton>
        </CardActions>
      </CardHeader>

      <CardBody>
        <div className="flex flex-col gap-1">
          <MetricRow>
            <MetricLabel>APY</MetricLabel>
            <ApyValue>{formatVaultApy(vault.apy)}</ApyValue>
          </MetricRow>
          <ChartWrapper $height={28}>
            <ApyBarChart data={vault.apyHistory} height={28} />
          </ChartWrapper>
        </div>

        <div className="flex flex-col gap-4">
          <MetricRow>
            <MetricLabel>TVL</MetricLabel>
            <TvlValue>{formatVaultTvl(vault.tvl)}</TvlValue>
          </MetricRow>
          <ChartWrapper $height={49}>
            <TvlLineChart data={vault.tvlHistory} height={49} />
          </ChartWrapper>
        </div>

        <CardFooter>
          <ProtocolTag>
            {vault.partnerLogo ? (
              <img src={vault.partnerLogo} alt={vault.partner} width={16} height={16} style={{ borderRadius: '50%' }} />
            ) : null}
            <span>
              {t`managed by`} {vault.partner}
            </span>
          </ProtocolTag>
        </CardFooter>
      </CardBody>
    </VaultCard>
  )
}

const ExploreVaultListItem = ({ vault, hasPosition, onDeposit, revealIndex }: VaultItemProps) => {
  const navigate = useNavigate()
  const detailPath = buildVaultDetailPath(vault.chainId, vault.id)
  // Tells the Earn sidebar which vault section this detail page belongs to.
  const detailState = { from: APP_PATHS.EARN_VAULTS }

  const identity = (
    <>
      <TokenIconWrapper>
        <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
        <TokenLogo
          src={vault.chainIcon}
          alt={vault.chainName}
          size={12}
          style={{ position: 'absolute', bottom: -2, right: -4 }}
        />
      </TokenIconWrapper>
      <span className="ml-1 shrink-0 text-base text-white2">{vault.token}</span>
      <span className="truncate text-base text-gray">{t`Yield`}</span>
    </>
  )

  return (
    <VaultListRow
      $disabled={vault.disabled}
      $revealIndex={revealIndex}
      className={cn(!vault.disabled && 'cursor-pointer')}
    >
      <VaultListRowMain>
        {vault.disabled ? (
          identity
        ) : (
          <CardTitleLink to={detailPath} state={detailState} className="flex min-w-0 items-center gap-2">
            {identity}
          </CardTitleLink>
        )}
        {/* The tag gives way first when the row is short of space: it says the same thing on every
            row, so it is the one part worth losing before the vault's own name. */}
        <ProtocolTag className="relative z-[1] ml-1 min-w-0 [flex-shrink:20]">
          {vault.partnerLogo ? (
            <img
              src={vault.partnerLogo}
              alt={vault.partner}
              width={16}
              height={16}
              className="shrink-0"
              style={{ borderRadius: '50%' }}
            />
          ) : null}
          <span className="truncate">
            {t`managed by`} {vault.partner}
          </span>
        </ProtocolTag>
      </VaultListRowMain>

      <VaultListMetric>
        <VaultListMetricText>
          <VaultListMetricLabel>APY</VaultListMetricLabel>
          <VaultListMetricValue className="text-primary">{formatVaultApy(vault.apy)}</VaultListMetricValue>
        </VaultListMetricText>
        <VaultListChartWrapper>
          <ApyBarChart data={vault.apyHistory} height={28} />
        </VaultListChartWrapper>
      </VaultListMetric>

      <VaultListMetric>
        <VaultListMetricText>
          <VaultListMetricLabel>TVL</VaultListMetricLabel>
          <VaultListMetricValue>{formatVaultTvl(vault.tvl)}</VaultListMetricValue>
        </VaultListMetricText>
        <VaultListChartWrapper>
          <TvlLineChart data={vault.tvlHistory} height={28} />
        </VaultListChartWrapper>
      </VaultListMetric>

      <VaultListActions className="relative z-[1]">
        {hasPosition && (
          <ViewPositionButton type="button" onClick={() => navigate(detailPath, { state: detailState })}>
            {t`View Position`}
          </ViewPositionButton>
        )}
        <DepositButton
          type="button"
          $disabled={vault.disabled}
          disabled={vault.disabled}
          onClick={() => onDeposit(vault)}
        >
          {t`+ Deposit`}
        </DepositButton>
      </VaultListActions>
    </VaultListRow>
  )
}

/** Placeholder rows while the list loads — the API serves three vaults today. */
const SKELETON_COUNT = 3

const ExploreVaultListItemSkeleton = () => (
  <VaultListRow>
    <VaultListRowMain>
      <ValueSkeleton className="size-6 rounded-full" />
      <ValueSkeleton className="h-6 w-14" />
      <ValueSkeleton className="h-6 w-10" />
      <ValueSkeleton className="ml-1 h-6 w-36 rounded-lg" />
    </VaultListRowMain>

    {Array.from({ length: 2 }, (_, index) => (
      <VaultListMetric key={index}>
        <VaultListMetricText>
          <ValueSkeleton className="h-5 w-8" />
          <ValueSkeleton className="h-6 w-16" />
        </VaultListMetricText>
        <VaultListChartWrapper>
          <ValueSkeleton className="size-full rounded-lg" />
        </VaultListChartWrapper>
      </VaultListMetric>
    ))}

    <VaultListActions>
      <ValueSkeleton className="h-[34px] w-24 rounded-3xl" />
    </VaultListActions>
  </VaultListRow>
)

const ExploreVaultCardSkeleton = () => (
  <VaultCard $subgrid>
    <CardHeader>
      <div className="flex items-center gap-1">
        <ValueSkeleton className="size-6 rounded-full" />
        <ValueSkeleton className="ml-1 h-6 w-14" />
        <ValueSkeleton className="h-6 w-10" />
      </div>
      <CardActions>
        <ValueSkeleton className="h-[34px] w-24 rounded-3xl" />
      </CardActions>
    </CardHeader>

    <CardBody>
      {/* APY over its bars, then TVL over its line — the two sections the card always carries. */}
      <div className="flex flex-col gap-1">
        <MetricRow>
          <ValueSkeleton className="h-6 w-9" />
          <ValueSkeleton className="h-8 w-28" />
        </MetricRow>
        <ChartWrapper $height={28}>
          <ValueSkeleton className="size-full rounded-lg" />
        </ChartWrapper>
      </div>

      <div className="flex flex-col gap-4">
        <MetricRow>
          <ValueSkeleton className="h-6 w-9" />
          <ValueSkeleton className="h-6 w-20" />
        </MetricRow>
        <ChartWrapper $height={49}>
          <ValueSkeleton className="size-full rounded-lg" />
        </ChartWrapper>
      </div>

      <CardFooter>
        <ValueSkeleton className="h-6 w-40 rounded-lg" />
      </CardFooter>
    </CardBody>
  </VaultCard>
)

const ExploreVaults = () => {
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  const [depositVault, setDepositVault] = useState<VaultInfo | null>(null)
  const [search, setSearch] = useState('')
  // One request per keystroke would also re-render every card and its two sparklines.
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)
  const [selectedChain, setSelectedChain] = useState('')
  const [selectedProtocol, setSelectedProtocol] = useState('')
  const [sortBy, setSortBy] = useState<VaultSortBy>(VaultSortBy.APY)
  // `stagger` travels with the mode so it is fixed for the life of a rendered list: a list that
  // arrives through the cross-fade never reveals itself a second time.
  const [view, setView] = useState<{ mode: VaultViewMode; stagger: boolean }>(() => ({
    mode: readStoredViewMode(),
    stagger: true,
  }))
  const viewMode = view.mode
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  /* list layout needs ~900px of horizontal space; below upToLarge we always show gallery
     (matches the gallery's own 3 -> 2 column transition at the same breakpoint) */
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { data: vaultListData, isLoading } = useVaultListQuery({
    chainIds: selectedChain || undefined,
    providers: selectedProtocol || undefined,
    keyword: debouncedSearch.trim() || undefined,
    sorts: `${SORT_FIELD_BY_KEY[sortBy]}:desc`,
    pageSize: 100,
  })

  const { data: positionsData } = useVaultPositionsQuery(
    { userAddress: (account || '').toLowerCase(), pageSize: 100 },
    { skip: !account },
  )

  const vaults = useMemo<VaultInfo[]>(() => (vaultListData?.vaults || []).map(toVaultInfo), [vaultListData?.vaults])

  // Only the cross-fade suppresses the stagger, and only for the list it hands over: a result set
  // fetched under new filters is a fresh arrival and animates in like any other.
  useEffect(() => {
    setView(current => (current.stagger ? current : { ...current, stagger: true }))
  }, [selectedChain, selectedProtocol, sortBy, debouncedSearch])

  const userVaultIds = useMemo(() => {
    const set = new Set<string>()
    positionsData?.positions?.forEach(p => {
      if (p.vault?.id) set.add(p.vault.id)
    })
    return set
  }, [positionsData?.positions])

  const selectViewMode = useCallback((next: VaultViewMode) => {
    try {
      window.localStorage.setItem(VAULT_VIEW_MODE_KEY, next)
    } catch {
      /* ignore write errors (private mode / quota) */
    }

    // A view transition cross-fades the outgoing layout; browsers without support swap instantly.
    const startViewTransition = document.startViewTransition?.bind(document)
    if (!startViewTransition) {
      setView({ mode: next, stagger: false })
      return
    }

    startViewTransition(() => {
      flushSync(() => setView({ mode: next, stagger: false }))
    })
  }, [])

  const effectiveViewMode = upToLarge ? VaultViewMode.GRID : viewMode

  return (
    <VaultPageWrapper>
      <ListingPageTitle backLabel="Go back" onBack={() => navigate(-1)}>
        {t`Explore`}
      </ListingPageTitle>

      <FilterRow>
        <FilterControls>
          <MultiSelectDropdownMenu
            alignItems="flex-start"
            highlightOnSelect
            label={
              <SelectedOptionsLabel
                options={VAULT_CHAIN_OPTIONS}
                value={selectedChain}
                allLabel={VAULT_CHAIN_OPTIONS[0].label}
                manyLabel={count => t`Selected: ${count} chains`}
              />
            }
            options={VAULT_CHAIN_OPTIONS}
            value={selectedChain}
            onChange={value => setSelectedChain(value.toString())}
          />

          <MultiSelectDropdownMenu
            alignItems="flex-start"
            highlightOnSelect
            label={
              <SelectedOptionsLabel
                options={VAULT_PROTOCOL_OPTIONS}
                value={selectedProtocol}
                allLabel={VAULT_PROTOCOL_OPTIONS[0].label}
                manyLabel={count => t`Selected: ${count} protocols`}
              />
            }
            options={VAULT_PROTOCOL_OPTIONS}
            value={selectedProtocol}
            onChange={value => setSelectedProtocol(value.toString())}
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
        </FilterControls>

        <SearchGroup>
          <Search
            placeholder={t`Search by token or vaults`}
            searchValue={search}
            onSearch={setSearch}
            style={{ height: '36px', width: upToSmall ? '100%' : '400px' }}
          />

          <ViewToggleGroup role="group" aria-label={t`Layout`}>
            <ViewToggleButton
              type="button"
              aria-label={t`List view`}
              aria-pressed={viewMode === VaultViewMode.LIST}
              $active={viewMode === VaultViewMode.LIST}
              onClick={() => selectViewMode(VaultViewMode.LIST)}
            >
              <ListViewIcon />
            </ViewToggleButton>
            <ViewToggleButton
              type="button"
              aria-label={t`Gallery view`}
              aria-pressed={viewMode === VaultViewMode.GRID}
              $active={viewMode === VaultViewMode.GRID}
              onClick={() => selectViewMode(VaultViewMode.GRID)}
            >
              <GridViewIcon />
            </ViewToggleButton>
          </ViewToggleGroup>
        </SearchGroup>
      </FilterRow>

      {!isLoading && vaults.length === 0 ? (
        <EmptyStateWrapper>
          <IconEarnNotFound />
          <EmptyStateTitle>{t`No vaults found`}</EmptyStateTitle>
          <EmptyStateSubtitle>
            <span>{t`Try adjusting your filters or search keyword.`}</span>
          </EmptyStateSubtitle>
        </EmptyStateWrapper>
      ) : (
        <div className="ks-vault-results">
          {effectiveViewMode === VaultViewMode.GRID ? (
            <VaultCardsGrid>
              {isLoading
                ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <ExploreVaultCardSkeleton key={i} />)
                : vaults.map((vault, index) => (
                    <ExploreVaultCard
                      key={vault.id}
                      vault={vault}
                      hasPosition={userVaultIds.has(vault.id)}
                      onDeposit={setDepositVault}
                      revealIndex={view.stagger ? index : undefined}
                    />
                  ))}
            </VaultCardsGrid>
          ) : (
            <VaultList>
              {isLoading
                ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <ExploreVaultListItemSkeleton key={i} />)
                : vaults.map((vault, index) => (
                    <ExploreVaultListItem
                      key={vault.id}
                      vault={vault}
                      hasPosition={userVaultIds.has(vault.id)}
                      onDeposit={setDepositVault}
                      revealIndex={view.stagger ? index : undefined}
                    />
                  ))}
            </VaultList>
          )}
        </div>
      )}

      <Disclaimer>{t`Partner-managed vaults. Auto-compounding. Native withdrawals are not instant.`}</Disclaimer>

      <VaultDepositModal
        target={depositVault ? { chainId: depositVault.chainId, vaultId: depositVault.id } : null}
        onClose={() => setDepositVault(null)}
      />
    </VaultPageWrapper>
  )
}

export default ExploreVaults
