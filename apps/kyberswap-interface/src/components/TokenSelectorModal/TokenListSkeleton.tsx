import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'

const SKELETON_ROWS = 9

/** Placeholder rows shown while the token list loads (chain switch, tab data fetch). */
export const TokenListSkeleton = () => (
  <div className="flex flex-1 flex-col overflow-hidden px-2 pt-2" data-testid="token-list-skeleton">
    {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
      <HStack key={index} className="h-12 items-center justify-between gap-3 px-3">
        <HStack className="min-w-0 flex-1 items-center gap-2">
          <Skeleton circle width={16} height={16} variant="darkSubtle" />
          <Skeleton circle width={24} height={24} variant="darkSubtle" />
          <Stack className="gap-1">
            <Skeleton width={56} height={12} variant="darkSubtle" />
            <Skeleton width={88} height={10} variant="darkSubtle" />
          </Stack>
        </HStack>
        <div className="flex w-[104px] justify-end">
          <Skeleton width={64} height={14} variant="darkSubtle" />
        </div>
        <div className="flex w-[104px] justify-end">
          <Skeleton width={72} height={14} variant="darkSubtle" />
        </div>
      </HStack>
    ))}
  </div>
)
