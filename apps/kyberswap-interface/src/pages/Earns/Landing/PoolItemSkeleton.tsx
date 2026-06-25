import Skeleton from 'components/Skeleton'
import { PoolRow } from 'pages/Earns/Landing/styles'

// Mirrors PoolItem: overlapping token logos + chain badge + pair symbol + fee tag on the left, APR on
// the right. Rendered inside PoolSection's own container so it inherits the list/grid layout.
const PoolItemSkeleton = () => (
  <PoolRow className="justify-between hover:!bg-transparent">
    <div className="flex flex-1 items-center gap-1">
      <div className="flex items-center">
        <Skeleton circle width={24} height={24} />
        <Skeleton circle width={24} height={24} containerClassName="-ml-2" />
        <Skeleton circle width={12} height={12} containerClassName="-ml-1 self-end" />
      </div>
      <Skeleton width={84} height={16} containerClassName="ml-1" />
      <Skeleton width={36} height={20} borderRadius={999} />
    </div>
    <Skeleton width={40} height={16} />
  </PoolRow>
)

export default PoolItemSkeleton
