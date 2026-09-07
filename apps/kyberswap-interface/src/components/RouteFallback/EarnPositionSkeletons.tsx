import { ListingPageWrapper } from 'components/Listing/Page'
import { TableWrapper } from 'components/Listing/Table'
import PositionListSkeleton, { PositionTableHeaderSkeleton } from 'components/RouteFallback/PositionListSkeleton'
import { ControlSkeleton, TitleRowSkeleton } from 'components/RouteFallback/common'
import Skeleton from 'components/Skeleton'

const PositionSummarySkeleton = () => (
  <>
    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 max-sm:hidden">
      <Skeleton height={119} containerClassName="block" />
      <Skeleton height={119} containerClassName="block" />
    </div>
    <Skeleton height={328} containerClassName="hidden max-sm:block" />
  </>
)

export const EarnPositionsSkeleton = () => (
  <ListingPageWrapper>
    <TitleRowSkeleton width={256} />

    {/* All Chains pill (left) + Explore Pools button (right) — above the banner. */}
    <div className="flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
      <ControlSkeleton width={140} rounded />
      <ControlSkeleton width={155} />
    </div>

    <PositionSummarySkeleton />

    {/* All Protocols + Position Status pills (left) + search pill (right). */}
    <div className="flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
      <div className="flex flex-wrap gap-4 max-sm:gap-3">
        <ControlSkeleton width={140} rounded />
        <ControlSkeleton width={144} rounded />
      </div>
      <ControlSkeleton width={320} rounded />
    </div>

    {/* Desktop keeps the same header/body structure as the live table; tablet/mobile hide the header. */}
    <TableWrapper className="max-[1300px]:rounded-none max-[1300px]:bg-transparent">
      <div className="animate-pulse">
        <PositionTableHeaderSkeleton />
        <PositionListSkeleton animated={false} />
      </div>
    </TableWrapper>
  </ListingPageWrapper>
)
