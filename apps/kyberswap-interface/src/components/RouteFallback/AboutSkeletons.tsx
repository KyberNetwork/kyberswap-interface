import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'

export const AboutKyberSwapSkeleton = () => (
  <Stack className="w-full max-w-[1228px] items-center gap-12 px-3 py-20 lg:py-32">
    <Stack className="items-center gap-8">
      <Center className="h-12 w-full max-w-[700px] max-sm:h-9">
        <Skeleton height={48} containerClassName="w-4/5 max-sm:hidden" />
        <Skeleton height={36} containerClassName="hidden w-4/5 max-sm:block" />
      </Center>

      <HStack className="w-full max-w-[1000px] flex-wrap justify-center gap-4">
        {Array.from({ length: 18 }, (_, index) => (
          <Skeleton key={index} circle width={36} height={36} />
        ))}
      </HStack>

      <Stack className="w-full items-center gap-4">
        <Center className="h-[56px] w-full max-w-[700px] gap-2">
          <Skeleton height={18} containerClassName="w-full" />
          <Skeleton height={18} containerClassName="w-4/5" />
        </Center>

        <Skeleton width={216} height={42} borderRadius={99} />
      </Stack>
    </Stack>

    <HStack className="w-full max-w-[900px] gap-4">
      <Skeleton height={104} containerClassName="flex-1" />
      <Skeleton height={104} containerClassName="flex-1" />
    </HStack>
  </Stack>
)

export const AboutKncSkeleton = () => (
  <Stack className="w-full max-w-[1228px] items-center gap-20 px-3 py-20 lg:gap-32 lg:py-32">
    <Stack className="w-full items-center gap-8">
      <Center className="h-12 w-full max-w-[700px] max-sm:h-9">
        <Skeleton height={48} containerClassName="w-3/5 max-sm:hidden" />
        <Skeleton height={36} containerClassName="hidden w-4/5 max-sm:block" />
      </Center>

      <Stack className="w-full items-center gap-4">
        <Center className="h-14 w-full max-w-[1000px] gap-2">
          <Skeleton height={20} containerClassName="w-full" />
          <Skeleton height={20} containerClassName="w-4/5" />
        </Center>

        <HStack className="w-full max-w-[600px] flex-wrap justify-center gap-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} circle width={36} height={36} />
          ))}
        </HStack>
      </Stack>
    </Stack>

    <Stack className="w-full items-center gap-8">
      <Stack className="items-center gap-2">
        <Skeleton width={120} height={24} />
        <Skeleton height={40} containerClassName="w-[398px] max-sm:w-[280px]" />
      </Stack>

      <Stack className="w-full max-w-[1000px] items-center gap-4">
        <Skeleton height={16} containerClassName="w-full" />
        <Skeleton height={16} containerClassName="w-11/12" />
        <Skeleton height={16} containerClassName="w-3/4" />
      </Stack>
    </Stack>
  </Stack>
)
