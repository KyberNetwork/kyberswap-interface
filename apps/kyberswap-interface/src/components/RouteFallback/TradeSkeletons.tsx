import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'

// Keep only the destination page's major geometry. The right panel is intentionally omitted at <=1200px so
// the short-lived fallback stays stable and lightweight on smaller screens.
export const SwapPageSkeleton = () => (
  <Stack className="w-full max-w-[1464px] items-stretch gap-6 px-9 py-6 max-sm:gap-4 max-sm:px-4 max-sm:py-5">
    <HStack className="w-full items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6">
      <Center className="z-[1] w-full max-w-[425px] shrink-0 gap-4 lg:sticky lg:top-4">
        <Stack className="w-full gap-2">
          <HStack className="min-h-9 items-center justify-between">
            <HStack className="items-center gap-2.5 sm:gap-[18px]">
              <div className="w-[43px] sm:w-[50px]">
                <Skeleton width="100%" height={23} />
              </div>
              <div className="w-[92px] sm:w-[103px]">
                <Skeleton width="100%" height={23} />
              </div>
              <div className="w-[99px] sm:w-[110px]">
                <Skeleton width="100%" height={23} />
              </div>
            </HStack>
            <HStack className="items-center gap-1">
              <Center className="size-8">
                <Skeleton circle width={28} height={28} />
              </Center>
              <Center className="size-8">
                <Skeleton circle width={28} height={28} />
              </Center>
            </HStack>
          </HStack>
          <Skeleton width={267} height={16} />
        </Stack>

        <Stack className="w-full rounded-[20px] bg-background p-4">
          <Stack className="gap-4">
            <Stack className="gap-3">
              <Stack className="relative gap-3">
                <Skeleton height={104} baseColor="var(--ks-buttonBlack)" />
                <Skeleton height={104} baseColor="var(--ks-buttonBlack)" />
                <Center className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Skeleton circle width={28} height={28} baseColor="var(--ks-buttonBlack)" />
                </Center>
              </Stack>
              <HStack className="h-[23px] items-center gap-1">
                <Skeleton width={80} height={18} baseColor="var(--ks-buttonBlack)" />
                <Skeleton width={44} height={18} baseColor="var(--ks-buttonBlack)" />
              </HStack>
            </Stack>
            <Skeleton width="100%" height={44} rounded baseColor="var(--ks-buttonBlack)" />
          </Stack>
        </Stack>
      </Center>

      <Stack className="min-w-0 max-w-[920px] flex-1 gap-5 max-lg:hidden">
        <div className="grid w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
          <Skeleton height={78} />
          <Skeleton height={78} />
        </div>
        <Skeleton height={481} />
        <Skeleton height={46} />
      </Stack>
    </HStack>
  </Stack>
)
