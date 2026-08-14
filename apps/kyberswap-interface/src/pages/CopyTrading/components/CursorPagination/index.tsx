import { ChevronLeft, ChevronRight } from 'react-feather'

import { ButtonLight } from 'components/Button'
import Dots from 'components/Dots'
import { HStack } from 'components/Stack'

export type CursorPaginationState = {
  currentPage: number
  error?: boolean
  hasNextPage: boolean
  navigating?: boolean
  onNextPage: () => void
  onPreviousPage: () => void
  onRetry: () => Promise<unknown> | void
}

const CursorPagination = ({
  currentPage,
  error,
  hasNextPage,
  navigating,
  onNextPage,
  onPreviousPage,
  onRetry,
}: CursorPaginationState) => {
  if (currentPage === 1 && !hasNextPage && !error) return null

  return (
    <HStack className="items-center justify-center gap-3 border-t border-tableHeader bg-background-60 px-6 py-3">
      <ButtonLight
        type="button"
        className="gap-1 sm:w-auto"
        padding="7px 12px"
        disabled={currentPage === 1 || navigating}
        onClick={onPreviousPage}
      >
        <ChevronLeft size={16} aria-hidden />
        Previous
      </ButtonLight>
      <span className="min-w-16 text-center text-sm font-medium text-subText">Page {currentPage}</span>
      {error ? (
        <ButtonLight
          type="button"
          className="sm:w-auto"
          padding="7px 12px"
          disabled={navigating}
          onClick={() => void onRetry()}
        >
          {navigating ? <Dots>Retry</Dots> : 'Retry'}
        </ButtonLight>
      ) : (
        <ButtonLight
          type="button"
          className="gap-1 sm:w-auto"
          padding="7px 12px"
          disabled={!hasNextPage || navigating}
          onClick={onNextPage}
        >
          Next
          <ChevronRight size={16} aria-hidden />
        </ButtonLight>
      )}
    </HStack>
  )
}

export default CursorPagination
