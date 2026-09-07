import { ListingPageWrapper } from 'components/Listing/Page'
import { TableWrapper } from 'components/Listing/Table'
import SmartExitListSkeleton, { SmartExitTableHeaderSkeleton } from 'components/RouteFallback/SmartExitListSkeleton'
import { ControlSkeleton, TitleRowSkeleton } from 'components/RouteFallback/common'

export const SmartExitSkeleton = () => (
  <ListingPageWrapper>
    <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
      <TitleRowSkeleton width={210} />
      <ControlSkeleton width={148} />
    </div>

    <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
      <div className="flex flex-wrap gap-4 max-sm:gap-3">
        <div className="contents max-sm:flex max-sm:w-full max-sm:gap-2">
          <ControlSkeleton width={140} wrapperClassName="max-sm:!w-[calc(50%_-_4px)]" rounded />
          <ControlSkeleton width={140} wrapperClassName="max-sm:!w-[calc(50%_-_4px)]" rounded />
        </div>
        <ControlSkeleton width={140} rounded />
      </div>
      <ControlSkeleton height={38} width={158} />
    </div>

    <TableWrapper className="max-[992px]:rounded-none max-[992px]:bg-transparent">
      <div className="animate-pulse">
        <SmartExitTableHeaderSkeleton />
        <SmartExitListSkeleton animated={false} />
      </div>
    </TableWrapper>
  </ListingPageWrapper>
)
