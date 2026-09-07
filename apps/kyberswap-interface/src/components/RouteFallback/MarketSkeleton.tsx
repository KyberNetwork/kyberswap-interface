import { ListingPageWrapper } from 'components/Listing/Page'
import { TableWrapper } from 'components/Listing/Table'
import MarketListSkeleton, { MarketTableHeaderSkeleton } from 'components/RouteFallback/MarketListSkeleton'
import { ListingFilterTagsSkeleton, TitleRowSkeleton } from 'components/RouteFallback/common'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'

const MarketSkeleton = () => (
  <ListingPageWrapper>
    <Stack className="gap-2">
      <TitleRowSkeleton width={200} />
      <div className="py-1">
        <Skeleton width="80%" height={16} containerClassName="block max-w-5xl" />
      </div>
    </Stack>

    <HStack className="items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
      <ListingFilterTagsSkeleton widths={[52, 48, 61, 75, 47, 65, 73]} />
      <Skeleton width={320} height={36} rounded containerClassName="max-sm:block" />
    </HStack>

    <HStack className="items-center gap-3">
      <Skeleton width={44} height={16} containerClassName="shrink-0" />
      <HStack className="min-w-0 flex-1 flex-wrap gap-2">
        {Array.from({ length: 16 }, (_, index) => (
          <Skeleton key={index} width={32} height={32} borderRadius={8} />
        ))}
      </HStack>
    </HStack>

    <TableWrapper className="max-md:rounded-none max-md:bg-transparent">
      <div className="animate-pulse">
        <MarketTableHeaderSkeleton />
        <MarketListSkeleton animated={false} />
      </div>
    </TableWrapper>
  </ListingPageWrapper>
)

export default MarketSkeleton
