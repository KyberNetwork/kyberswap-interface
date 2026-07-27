import Skeleton from 'components/Skeleton'

const CampaignSkeleton = () => (
  <div className="flex w-full max-w-screen-md flex-col gap-6 p-4">
    <Skeleton height={180} />
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton width={240} height={28} />
        <Skeleton width={130} height={48} />
      </div>
      <div className="flex flex-wrap gap-3">
        {[100, 100, 100].map((w, i) => (
          <Skeleton key={i} width={w} height={36} />
        ))}
      </div>
      <div className="rounded-2xl bg-background p-5">
        <div className="flex gap-5 border-b border-tableHeader/50 pb-4">
          <Skeleton width={40} height={14} />
          <div className="flex-1">
            <Skeleton width={70} height={14} />
          </div>
          <Skeleton width={60} height={14} />
          <Skeleton width={60} height={14} />
        </div>
        {Array.from({ length: 8 }, (_, r) => (
          <div key={r} className="flex items-center gap-5 py-4">
            <Skeleton width={28} height={16} />
            <div className="flex-1">
              <Skeleton width={200} height={16} />
            </div>
            <Skeleton width={56} height={16} />
            <Skeleton width={56} height={16} />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default CampaignSkeleton
