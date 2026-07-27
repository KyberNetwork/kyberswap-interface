import Skeleton from 'components/Skeleton'

export const ContentPageSkeleton = () => (
  <div className="flex w-full max-w-[1200px] flex-col items-center gap-12 px-6 py-12 max-sm:px-4">
    <div className="flex flex-col items-center gap-6">
      <Skeleton width={480} height={40} />
      <div className="flex flex-col items-center gap-3">
        <Skeleton width={680} height={16} />
        <Skeleton width={600} height={16} />
        <Skeleton width={520} height={16} />
      </div>
    </div>
    <div className="grid w-full grid-cols-3 gap-5 max-sm:grid-cols-1">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} height={200} />
      ))}
    </div>
  </div>
)

export const AboutKyberSwapSkeleton = () => (
  <div className="flex w-full max-w-[1228px] flex-col items-center gap-10 px-3 py-40 max-sm:py-[100px]">
    <div className="flex flex-col items-center gap-8">
      <div className="hidden sm:block">
        <Skeleton width={700} height={44} />
      </div>
      <div className="flex flex-col items-center gap-2 sm:hidden">
        <Skeleton width={300} height={26} />
        <Skeleton width={220} height={26} />
      </div>

      <div className="flex max-w-[1000px] flex-wrap justify-center gap-5">
        {Array.from({ length: 17 }, (_, index) => (
          <Skeleton key={index} circle width={36} height={36} />
        ))}
      </div>

      <div className="hidden flex-col items-center gap-2 sm:flex">
        <Skeleton width={700} height={16} />
        <Skeleton width={560} height={16} />
      </div>
      <div className="flex flex-col items-center gap-2 sm:hidden">
        {[300, 300, 290, 200].map((width, index) => (
          <Skeleton key={index} width={width} height={13} />
        ))}
      </div>

      <Skeleton width={216} height={42} />
    </div>

    <div className="flex w-full max-w-[900px] gap-4">
      <Skeleton height={102} containerClassName="flex-1" />
      <Skeleton height={102} containerClassName="flex-1" />
    </div>
  </div>
)

export const AboutKncSkeleton = () => (
  <div className="flex w-full max-w-[1228px] flex-col items-center gap-8 px-3 py-40 max-sm:py-[100px]">
    <div className="flex flex-col items-center gap-12">
      <div className="flex flex-col items-center gap-6">
        <div className="hidden sm:block">
          <Skeleton width={640} height={44} />
        </div>
        <div className="flex flex-col items-center gap-2 sm:hidden">
          <Skeleton width={300} height={26} />
          <Skeleton width={240} height={26} />
        </div>

        <div className="hidden flex-col items-center gap-2 sm:flex">
          <Skeleton width={700} height={18} />
          <Skeleton width={580} height={18} />
        </div>
        <div className="flex flex-col items-center gap-2 sm:hidden">
          {[320, 300, 300, 200].map((width, index) => (
            <Skeleton key={index} width={width} height={13} />
          ))}
        </div>

        <div className="flex max-w-[600px] flex-wrap justify-center gap-5">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} circle width={36} height={36} />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Skeleton width={120} height={20} />
        <div className="hidden sm:block">
          <Skeleton width={398} height={32} />
        </div>
        <div className="sm:hidden">
          <Skeleton width={280} height={26} />
        </div>
      </div>
    </div>

    <div className="grid w-full grid-cols-2 gap-5 max-sm:grid-cols-1">
      <Skeleton height={160} />
      <Skeleton height={160} />
    </div>
  </div>
)
