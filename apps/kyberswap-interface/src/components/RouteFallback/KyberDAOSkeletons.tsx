import Skeleton from 'components/Skeleton'

export const StakeKncSkeleton = () => (
  <div className="flex w-[1224px] items-start gap-10 px-4 pb-40 pt-[60px] max-lg:w-full max-lg:flex-col max-lg:items-center">
    <div className="flex w-[772px] flex-col gap-4 max-lg:max-w-full max-sm:w-full">
      <div className="flex items-center justify-between">
        <Skeleton width={160} height={28} />
        <Skeleton width={110} height={20} />
      </div>
      <Skeleton width={420} height={16} />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-[20px] border border-border/40 px-4 py-6">
          <Skeleton circle width={40} height={40} />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton width={160} height={16} />
            <Skeleton width={280} height={12} />
          </div>
          <Skeleton width={90} height={36} />
        </div>
      ))}
    </div>
    <div className="flex w-[400px] shrink-0 flex-col gap-4 max-lg:w-[412px] max-sm:w-full">
      <Skeleton height={200} />
      <div className="flex flex-col gap-4 rounded-[20px] border border-border/40 p-4">
        <div className="flex gap-2">
          {[70, 70, 70].map((w, i) => (
            <Skeleton key={i} width={w} height={28} />
          ))}
        </div>
        <Skeleton height={64} />
        <Skeleton height={44} />
      </div>
      <Skeleton height={48} />
    </div>
  </div>
)

export const VoteSkeleton = () => (
  <div className="flex w-[1224px] flex-col gap-6 py-12 max-lg:w-full max-lg:px-4">
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={28} />
        <Skeleton width={110} height={20} />
      </div>
      <div className="flex gap-6 max-md:flex-col">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-1 flex-col gap-3 rounded-[20px] bg-buttonGray/70 px-6 py-5">
            <Skeleton width={130} height={14} />
            <Skeleton width={170} height={24} />
          </div>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton width={260} height={20} />
        <Skeleton width={220} height={36} />
      </div>
      <Skeleton width={60} height={20} />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center justify-between rounded-[20px] bg-background px-5 py-4">
          <Skeleton width={360} height={16} />
          <div className="flex items-center gap-3">
            <Skeleton width={70} height={22} />
            <Skeleton circle width={20} height={20} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const KncUtilitySkeleton = () => (
  <div className="flex w-full max-w-[1224px] flex-col gap-8 px-12 py-6 max-md:p-4">
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton width={160} height={28} />
        <Skeleton height={48} />
        <Skeleton width={520} height={16} />
      </div>
      <div className="max-md:hidden">
        <Skeleton width={220} height={150} />
      </div>
    </div>
    <div className="flex justify-between gap-12 max-md:flex-col">
      <div className="flex flex-1 flex-col gap-4 rounded-[20px] bg-buttonGray/40 p-5">
        <div className="flex gap-4">
          {[90, 70, 70].map((w, i) => (
            <Skeleton key={i} width={w} height={16} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton width={120} height={36} />
          <Skeleton width={120} height={36} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton width={150} height={20} />
        <Skeleton width={420} height={14} />
        <Skeleton width={380} height={14} />
        <Skeleton height={120} />
      </div>
    </div>
  </div>
)
