import { TableCell, TableGrid, TableHeader, getMarketTableGridTemplateColumns } from 'components/Listing/Table'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import TextSkeleton from 'components/Skeleton/TextSkeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type MarketListSkeletonProps = {
  rows?: number
  animated?: boolean
}

const MarketTableGrid = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <TableGrid className={className} columns={getMarketTableGridTemplateColumns()} {...rest} />
)

const MARKET_ROW_VARIANTS = [
  { symbol: 64, name: 48, buyPrice: 56, buyChange: 48, sellPrice: 56, sellChange: 48, volume: 64, marketCap: 64 },
  { symbol: 80, name: 60, buyPrice: 64, buyChange: 54, sellPrice: 62, sellChange: 56, volume: 72, marketCap: 70 },
  { symbol: 72, name: 54, buyPrice: 58, buyChange: 60, sellPrice: 68, sellChange: 50, volume: 68, marketCap: 76 },
  { symbol: 88, name: 66, buyPrice: 66, buyChange: 52, sellPrice: 60, sellChange: 58, volume: 76, marketCap: 68 },
] as const

const MarketNameCellSkeleton = ({ index }: { index: number }) => {
  const widths = MARKET_ROW_VARIANTS[index % MARKET_ROW_VARIANTS.length]

  return (
    <TableCell className="flex-row gap-2">
      <TableCellSkeleton circle width={24} height={24} />
      <Stack className="gap-0.5">
        <TextSkeleton width={widths.symbol} size="base" />
        <TextSkeleton width={widths.name} size="sm" />
      </Stack>
    </TableCell>
  )
}

const MarketValueCellSkeleton = ({ width }: { width: number }) => (
  <TableCell className="items-end justify-center">
    <TextSkeleton width={width} size="base" />
  </TableCell>
)

const MarketPriceWindowHeaderSkeleton = () => (
  <TableCell className="flex-row items-center justify-end gap-1">
    <TableCellSkeleton circle width={60} height={26} />
    <Center className="size-[26px]">
      <TableCellSkeleton width={14} height={14} />
    </Center>
  </TableCell>
)

const MarketMobileControlHeaderSkeleton = ({
  labelWidth,
  controlWidth,
}: {
  labelWidth: number
  controlWidth: number
}) => (
  <TableCell className="items-end">
    <TextSkeleton width={labelWidth} size="sm" />
    <TableCellSkeleton circle width={controlWidth} height={26} />
  </TableCell>
)

const MarketDesktopRowSkeleton = ({ index }: { index: number }) => {
  const widths = MARKET_ROW_VARIANTS[index % MARKET_ROW_VARIANTS.length]

  return (
    <MarketTableGrid className="p-3">
      <MarketNameCellSkeleton index={index} />
      <MarketValueCellSkeleton width={widths.buyPrice} />
      <MarketValueCellSkeleton width={widths.buyChange} />
      <MarketValueCellSkeleton width={widths.sellPrice} />
      <MarketValueCellSkeleton width={widths.sellChange} />
      <MarketValueCellSkeleton width={widths.volume} />
      <MarketValueCellSkeleton width={widths.marketCap} />
      <TableCell />
    </MarketTableGrid>
  )
}

const MarketMobileRowSkeleton = ({ index }: { index: number }) => {
  const widths = MARKET_ROW_VARIANTS[index % MARKET_ROW_VARIANTS.length]

  return (
    <TableGrid className="rounded-xl bg-background/80 p-3" columns="1fr 1fr 1fr">
      <MarketNameCellSkeleton index={index} />
      <MarketValueCellSkeleton width={widths.buyPrice} />
      <MarketValueCellSkeleton width={widths.buyChange} />
    </TableGrid>
  )
}

export const MarketTableHeaderSkeleton = () => (
  <>
    <TableHeader className="max-md:hidden" style={{ gridTemplateColumns: getMarketTableGridTemplateColumns() }}>
      <TableCell>
        <TextSkeleton width={44} size="sm" />
      </TableCell>
      <TableCell className="col-span-4 items-center">
        <TextSkeleton width={108} size="sm" />
      </TableCell>
      <TableCell className="col-span-2 items-center">
        <TextSkeleton width={120} size="sm" />
      </TableCell>
      <TableCell />
    </TableHeader>

    <MarketTableGrid className="border-b border-tableHeader p-3 max-md:hidden">
      <TableCell />
      <MarketValueCellSkeleton width={56} />
      <MarketPriceWindowHeaderSkeleton />
      <MarketValueCellSkeleton width={56} />
      <MarketPriceWindowHeaderSkeleton />
      <MarketValueCellSkeleton width={70} />
      <MarketValueCellSkeleton width={70} />
      <TableCell />
    </MarketTableGrid>

    <div className="hidden border-b border-tableHeader max-md:block">
      <HStack className="gap-3 p-3">
        <TextSkeleton width={110} size="sm" />
        <TextSkeleton width={130} size="sm" />
      </HStack>
    </div>

    <TableHeader className="hidden grid-cols-3 max-md:grid">
      <TableCell>
        <TextSkeleton width={44} size="sm" />
      </TableCell>
      <MarketMobileControlHeaderSkeleton labelWidth={64} controlWidth={76} />
      <MarketMobileControlHeaderSkeleton labelWidth={76} controlWidth={102} />
    </TableHeader>
  </>
)

const MarketDesktopListSkeleton = ({ rows = 8, animated = true }: MarketListSkeletonProps) => (
  <div className={cn('max-md:hidden', animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <MarketDesktopRowSkeleton key={index} index={index} />
    ))}
  </div>
)

const MarketMobileListSkeleton = ({ rows = 8, animated = true }: MarketListSkeletonProps) => (
  <div className={cn('hidden flex-col gap-2 py-2 max-md:flex', animated && 'animate-pulse')}>
    {Array.from({ length: rows }, (_, index) => (
      <MarketMobileRowSkeleton key={index} index={index} />
    ))}
  </div>
)

const MarketListSkeleton = (props: MarketListSkeletonProps) => (
  <>
    <MarketDesktopListSkeleton {...props} />
    <MarketMobileListSkeleton {...props} />
  </>
)

export default MarketListSkeleton
