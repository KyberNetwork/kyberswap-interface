import { FarmingWrapper, TrendingWrapper } from 'components/EarnBanner/styles'
import Skeleton from 'components/Skeleton'

/** @deprecated Used only by the deprecated pool banners. */
export const TrendingPoolContentSkeleton = () => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <Skeleton circle height={24} variant="darkSubtle" width={24} />
      <Skeleton circle height={24} style={{ marginLeft: -8 }} variant="darkSubtle" width={24} />
      <Skeleton height={18} style={{ marginLeft: 8 }} variant="darkSubtle" width={88} />
    </div>
    <Skeleton height={28} rounded variant="darkSubtle" width={120} />
  </div>
)

/** @deprecated Used only by the deprecated pool banners. */
export const FarmingPoolContentSkeleton = () => (
  <div className="relative flex items-center justify-center gap-2" style={{ width: 'calc(100% + 8px)', left: '-4px' }}>
    <Skeleton circle height={20} variant="darkSubtle" width={20} />
    <div className="flex flex-1 items-center justify-around">
      {[0, 1].map(index => (
        <div key={index} className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Skeleton height={18} variant="darkSubtle" width={88} />
          <Skeleton height={28} rounded variant="darkSubtle" width={80} />
        </div>
      ))}
    </div>
    <Skeleton circle height={20} variant="darkSubtle" width={20} />
  </div>
)

/** @deprecated Pool banners are no longer displayed in the trade layout. */
export const TrendingPoolBannerSkeleton = () => (
  <TrendingWrapper>
    <div className="inline-flex items-center gap-2">
      <Skeleton circle height={24} variant="darkSubtle" width={24} />
      <Skeleton height={18} variant="darkSubtle" width={128} />
    </div>
    <TrendingPoolContentSkeleton />
  </TrendingWrapper>
)

/** @deprecated Pool banners are no longer displayed in the trade layout. */
export const FarmingPoolBannerSkeleton = () => (
  <FarmingWrapper>
    <div className="inline-flex items-center gap-2">
      <Skeleton circle height={24} variant="darkSubtle" width={24} />
      <Skeleton height={18} variant="darkSubtle" width={120} />
    </div>
    <FarmingPoolContentSkeleton />
  </FarmingWrapper>
)
