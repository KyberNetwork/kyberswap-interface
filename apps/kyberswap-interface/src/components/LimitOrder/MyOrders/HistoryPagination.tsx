import { Trans, t } from '@lingui/macro'
import { ChevronLeft, ChevronRight } from 'react-feather'

import { cn } from 'utils/cn'

type HistoryPaginationProps = {
  currentPage: number
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  className?: string
}

const buttonClassName =
  'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-black-20 p-0 text-white-60 hover:bg-black-40 disabled:pointer-events-none disabled:opacity-50'

/**
 * Previous / next controls for the order-history tabs. The backend pages those with an opaque keyset
 * cursor and caps the total at "more than 1000", so there is no page count to number.
 */
const HistoryPagination = ({
  currentPage,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  className,
}: HistoryPaginationProps) => (
  <nav className={cn('flex items-center justify-center gap-2', className)} aria-label={t`Order history pages`}>
    <button
      type="button"
      className={buttonClassName}
      onClick={onPrevious}
      disabled={!canGoPrevious}
      aria-label={t`Previous page`}
      data-testid="limit-order-history-pagination-prev"
    >
      <ChevronLeft width={16} className="text-subText" />
    </button>

    <span className="min-w-16 text-center text-xs font-medium text-subText" aria-live="polite">
      <Trans>Page {currentPage}</Trans>
    </span>

    <button
      type="button"
      className={buttonClassName}
      onClick={onNext}
      disabled={!canGoNext}
      aria-label={t`Next page`}
      data-testid="limit-order-history-pagination-next"
    >
      <ChevronRight width={16} className="text-subText" />
    </button>
  </nav>
)

export default HistoryPagination
