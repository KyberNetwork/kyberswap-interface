import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'

import { HStack } from 'components/Stack'
import { BALANCE_COLUMN_CLASS, METRIC_COLUMN_CLASS, TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { TOKEN_METRIC_COLUMNS, TokenMetricColumn, TokenSort, TokenSortField } from 'components/TokenSelectorModal/types'
import { MouseoverTooltip } from 'components/Tooltip'
import { Z_INDEXS } from 'constants/styles'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { cn } from 'utils/cn'

// Map the internal sort direction to the shared SortIcon's Direction enum.
const toDirection = (dir: 'asc' | 'desc'): Direction => (dir === 'asc' ? Direction.ASC : Direction.DESC)

// Cells own column sizing; their content owns the hover and click area.
type HeaderCellProps = {
  children: ReactNode
  className?: string
  align?: 'left' | 'right'
}

const HeaderCell = ({ children, className, align = 'right' }: HeaderCellProps) => (
  <HStack
    className={cn('min-w-0 shrink-0 items-center', align === 'left' ? 'justify-start' : 'justify-end', className)}
  >
    <HStack className="w-fit min-w-0 max-w-full items-center">{children}</HStack>
  </HStack>
)

// A clickable, sortable column header (Price & 24h change) with the shared pool-list sort arrows.
type SortHeaderProps = {
  label: ReactNode
  field: TokenSortField
  sort: TokenSort | null
  onSort?: (field: TokenSortField) => void
}

const SortHeader = ({ label, field, sort, onSort }: SortHeaderProps) => (
  <button
    type="button"
    data-testid={`sort-header-${field}`}
    onClick={() => onSort?.(field)}
    className="flex w-fit shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap uppercase transition-colors hover:text-text"
  >
    {label}
    <SortIcon sorted={sort?.field === field ? toDirection(sort.dir) : undefined} />
  </button>
)

// Copy for one of the switchable metrics. Built per render so the `t` macro picks up locale changes.
// The labels carry their own casing — the period qualifier reads as "24h", not "24H". That qualifier
// only fits from `sm` up; below it the wider column would leave the token name a few pixels.
const metricCopy = (metric: TokenMetricColumn) =>
  metric === 'volume24h'
    ? {
        label: (
          <>
            <span className="sm:hidden">
              <Trans>VOL</Trans>
            </span>
            <span className="hidden sm:inline">
              <Trans>24h VOL</Trans>
            </span>
          </>
        ),
        show: t`Show 24h volume`,
        sort: t`Sort by 24h volume`,
      }
    : { label: <Trans>FDV</Trans>, show: t`Show fully diluted valuation`, sort: t`Sort by fully diluted valuation` }

// The Trending / New tabs' third column header: a switch choosing which metric the rows show — 24h
// volume or FDV — plus the sort control for whichever metric is active. The showing metric's
// own button doubles as a sort target, so the sort stays reachable without aiming at the small arrows.
type MetricColumnHeaderProps = {
  metric: TokenMetricColumn
  onMetricChange?: (metric: TokenMetricColumn) => void
  sort: TokenSort | null
  onSort?: (field: TokenSortField) => void
}

const MetricColumnHeader = ({ metric, onMetricChange, sort, onSort }: MetricColumnHeaderProps) => (
  <HStack className="w-fit min-w-0 max-w-full items-center gap-0.5 sm:gap-1">
    {/* The column is a fixed width the rows match, and the labels are translatable — so the switch
        shrinks and its labels ellipsize rather than spilling left over the Price column. English
        needs less than the column holds, so it only bites in locales that translate longer. */}
    <div className="flex min-w-0 items-center rounded-md bg-buttonBlack p-0.5" role="group" aria-label={t`Metric`}>
      {TOKEN_METRIC_COLUMNS.map(option => {
        const active = option === metric
        const copy = metricCopy(option)
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={active ? copy.sort : copy.show}
            data-testid={`metric-column-${option}`}
            onClick={() => (active ? onSort?.(option) : onMetricChange?.(option))}
            className={cn(
              'min-w-0 truncate rounded px-[3px] py-0.5 text-[10px] font-medium transition-colors sm:px-1.5 sm:text-xs',
              active ? 'bg-buttonGray text-text' : 'text-subText hover:text-text',
            )}
          >
            {copy.label}
          </button>
        )
      })}
    </div>
    <button
      type="button"
      data-testid={`sort-header-${metric}`}
      aria-label={metricCopy(metric).sort}
      onClick={() => onSort?.(metric)}
      className="flex w-fit shrink-0 cursor-pointer items-center"
    >
      <SortIcon sorted={sort?.field === metric ? toDirection(sort.dir) : undefined} />
    </button>
  </HStack>
)

type Props = {
  activeTab: TokenSelectorTab
  metricColumn: TokenMetricColumn
  sort: TokenSort | null
  onSort?: (field: TokenSortField) => void
  onMetricChange?: (metric: TokenMetricColumn) => void
}

export const TokenListHeader = ({ activeTab, metricColumn, sort, onSort, onMetricChange }: Props) => {
  const isAllTab = activeTab === TokenSelectorTab.All
  const isImportedTab = activeTab === TokenSelectorTab.Imported
  const isTrendingTab = activeTab === TokenSelectorTab.Trending
  const isNewTab = activeTab === TokenSelectorTab.New
  return (
    <HStack className="shrink-0 items-center px-2 text-xs font-medium uppercase text-subText">
      <HeaderCell className="flex-1" align="left">
        <Trans>Token</Trans>
      </HeaderCell>
      <HStack className="shrink-0 items-center gap-3">
        {!isAllTab && (
          <HeaderCell className="w-[72px] sm:w-[132px]">
            <MouseoverTooltip
              placement="top"
              width="fit-content"
              style={{ zIndex: Z_INDEXS.MODAL }}
              text={<Trans>Price & 24h change</Trans>}
            >
              <SortHeader label={<Trans>Price</Trans>} field="priceChange24h" sort={sort} onSort={onSort} />
            </MouseoverTooltip>
          </HeaderCell>
        )}
        {isTrendingTab || isNewTab ? (
          <HeaderCell className={METRIC_COLUMN_CLASS}>
            <MetricColumnHeader metric={metricColumn} onMetricChange={onMetricChange} sort={sort} onSort={onSort} />
          </HeaderCell>
        ) : (
          <HeaderCell className={BALANCE_COLUMN_CLASS}>
            <Trans>Balance</Trans>
          </HeaderCell>
        )}
        {/* Spacer aligning the header with the imported rows' remove-token column. */}
        {isImportedTab && <span className="w-6 shrink-0" aria-hidden="true" />}
      </HStack>
    </HStack>
  )
}
