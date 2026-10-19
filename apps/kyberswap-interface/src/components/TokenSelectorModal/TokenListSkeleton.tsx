import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import TextSkeleton from 'components/Skeleton/TextSkeleton'
import { HStack, Stack } from 'components/Stack'
import { BALANCE_COLUMN_CLASS, METRIC_COLUMN_CLASS, TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { cn } from 'utils/cn'

const SKELETON_ROWS = 9
const ROW_WIDTHS = [
  { symbol: 40, name: 80, price: 48, change: 32, balance: 64, value: 40 },
  { symbol: 56, name: 64, price: 64, change: 40, balance: 48, value: 56 },
  { symbol: 32, name: 96, price: 40, change: 48, balance: 56, value: 32 },
  { symbol: 48, name: 72, price: 56, change: 32, balance: 40, value: 48 },
]

/** Match the active tab's columns, with one animation for the entire list. */
export const TokenListSkeleton = ({ activeTab }: { activeTab: TokenSelectorTab }) => {
  const showPrice = activeTab !== TokenSelectorTab.All
  const showMetric = activeTab === TokenSelectorTab.Trending || activeTab === TokenSelectorTab.New
  const showRemove = activeTab === TokenSelectorTab.Imported

  return (
    <Stack
      className="min-h-0 flex-1 animate-pulse gap-2 overflow-hidden motion-reduce:animate-none"
      data-testid="token-list-skeleton"
      aria-hidden="true"
    >
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => {
        const widths = ROW_WIDTHS[index % ROW_WIDTHS.length]
        return (
          <HStack key={index} className="h-12 shrink-0 items-center justify-between gap-2 px-3 sm:gap-3">
            <HStack className="min-w-0 flex-1 items-center gap-2">
              <TableCellSkeleton width={16} height={16} />
              <TableCellSkeleton circle width={24} height={24} />
              <Stack className="min-w-0 gap-0.5">
                <TextSkeleton width={widths.symbol} size="sm" className="max-w-full" />
                <TextSkeleton width={widths.name} height={10} lineHeight={16} className="max-w-full" />
              </Stack>
            </HStack>
            <HStack className="shrink-0 items-center gap-3">
              {showPrice && (
                <Stack className="w-[72px] items-end gap-0.5 sm:w-[132px]">
                  <TextSkeleton width={widths.price} size="sm" />
                  <TextSkeleton width={widths.change} height={10} lineHeight={16} />
                </Stack>
              )}
              <Stack className={cn('items-end gap-0.5', showMetric ? METRIC_COLUMN_CLASS : BALANCE_COLUMN_CLASS)}>
                <TextSkeleton width={widths.balance} size="sm" />
                {!showMetric && <TextSkeleton width={widths.value} height={10} lineHeight={16} />}
              </Stack>
              {showRemove && (
                <HStack className="w-6 justify-center">
                  <TableCellSkeleton width={16} height={16} />
                </HStack>
              )}
            </HStack>
          </HStack>
        )
      })}
    </Stack>
  )
}
