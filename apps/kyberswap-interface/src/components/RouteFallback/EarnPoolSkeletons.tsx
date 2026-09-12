import { ListingPageWrapper } from 'components/Listing/Page'
import { TableWrapper } from 'components/Listing/Table'
import PoolListSkeleton, { PoolTableHeaderSkeleton } from 'components/RouteFallback/PoolListSkeleton'
import { ListingFilterTagsSkeleton, TitleRowSkeleton } from 'components/RouteFallback/common'
import Skeleton from 'components/Skeleton'

/**
 * Hero, the two top sections (Liquidity Pools + Partner Vaults), the wide bottom section and the
 * explore button — the shape `pages/Earns/Landing` renders. The shell supplies the page padding.
 */
export const EarnLandingSkeleton = () => (
  <div className="flex w-full flex-col gap-6">
    <div className="flex flex-col items-center gap-8 px-4 pb-4 pt-8 max-xs:gap-6 max-xs:px-0 max-xs:pb-2 max-xs:pt-4">
      <div className="flex w-full max-w-[880px] flex-col items-center gap-4">
        <Skeleton width={520} height={48} />
        <div className="flex w-full flex-col items-center gap-2">
          <Skeleton width="90%" height={20} containerClassName="block w-full text-center" />
          <Skeleton width="70%" height={20} containerClassName="block w-full text-center" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-8 max-xs:flex-col max-xs:gap-4">
        <Skeleton width={133} height={24} />
        <Skeleton width={120} height={32} />
        <Skeleton width={200} height={42} rounded />
      </div>
    </div>

    <div className="grid grid-cols-[868fr_408fr] gap-[22px] max-lg:grid-cols-1 max-lg:gap-4">
      <Skeleton height={470} containerClassName="block" />
      <Skeleton height={470} containerClassName="block" />
    </div>

    <Skeleton height={430} containerClassName="block" />

    <div className="flex justify-center pt-2">
      <Skeleton width={200} height={42} rounded />
    </div>
  </div>
)

export const EarnPoolsSkeleton = () => (
  <ListingPageWrapper>
    {/* Title + subtitle share a gap-2 sub-stack (the real page wraps them in <Stack gap-2>). The subtitle
        is one long line filling the content width on desktop. */}
    <div className="flex flex-col gap-2">
      <div className="max-md:hidden">
        <TitleRowSkeleton width={450} />
      </div>
      <div className="hidden h-16 items-center gap-4 max-md:flex">
        <Skeleton width={24} height={24} />
        <div className="flex min-w-0 max-w-[285px] flex-1 flex-col gap-2">
          <Skeleton width="100%" height={24} containerClassName="block" />
          <Skeleton width="63%" height={24} containerClassName="block" />
        </div>
      </div>
      {/* py-1 reserves the subtitle's 24px line box (16px text + leading) so nothing below shifts down. */}
      <div className="py-1 max-md:hidden">
        <Skeleton width="80%" height={16} containerClassName="block max-w-5xl" />
      </div>
      <div className="hidden h-[72px] flex-col gap-2 py-1 max-md:flex">
        <Skeleton width="100%" height={16} containerClassName="block" />
        <Skeleton width="92%" height={16} containerClassName="block" />
        <Skeleton width="72%" height={16} containerClassName="block" />
      </div>
    </div>

    {/* Category tags (h-42, rounded-xl, gap-4) + My Positions button. */}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <ListingFilterTagsSkeleton widths={[94, 50, 162, 181, 123, 152, 153]} />
      <div className="max-md:hidden">
        <Skeleton width={148} height={36} />
      </div>
    </div>
    {/* Chain / protocol / interval pills (gap-4) + 320px search pill + Create Pool button (h-32, r-16). */}
    <div className="flex flex-wrap items-center justify-between gap-3 max-md:flex-col max-md:items-stretch max-md:gap-4">
      <div className="flex flex-wrap gap-4">
        <Skeleton width={140} height={36} rounded />
        <Skeleton width={140} height={36} rounded />
        <Skeleton width={70} height={36} rounded />
      </div>
      <div className="flex items-center gap-3 max-md:hidden">
        <Skeleton width={320} height={36} rounded />
        <Skeleton width={133} height={32} rounded />
      </div>
      <div className="hidden flex-col items-stretch gap-3 max-md:flex">
        <Skeleton width="100%" height={36} rounded containerClassName="block" />
        <Skeleton width="100%" height={32} rounded containerClassName="block" />
      </div>
    </div>

    <div className="hidden max-md:block">
      <Skeleton width="100%" height={36} containerClassName="block" />
    </div>

    <TableWrapper className="max-md:overflow-visible max-md:rounded-none max-md:bg-transparent">
      <div className="animate-pulse">
        <PoolTableHeaderSkeleton />
        <PoolListSkeleton animated={false} />
      </div>
    </TableWrapper>
  </ListingPageWrapper>
)
