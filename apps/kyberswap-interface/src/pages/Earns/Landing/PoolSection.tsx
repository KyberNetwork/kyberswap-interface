import { Link, LinkProps } from 'react-router-dom'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import PoolItem from 'pages/Earns/Landing/PoolItem'
import {
  FarmingPoolsList,
  HighlightedPoolsGrid,
  InnerListContainer,
  InnerSectionTitle,
  SimpleSectionHeader,
} from 'pages/Earns/Landing/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EarnPool } from 'pages/Earns/types'

type Variant = 'inner' | 'inner-stable' | 'highlighted' | 'farming'

const SmallSkeleton = () => (
  <div className="flex items-center justify-between px-4 py-3" data-testid="earn-overview-pool-item-skeleton">
    <div className="flex items-center gap-1">
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%', marginLeft: '-8px' }} />
      <PositionSkeleton width={100} height={16} />
      <PositionSkeleton width={40} height={20} />
    </div>
    <PositionSkeleton width={60} height={16} />
  </div>
)

const LargeSkeleton = () => (
  <div className="rounded-xl bg-white-04 p-4" data-testid="earn-overview-pool-item-skeleton">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%', marginLeft: '-8px' }} />
        <PositionSkeleton width={100} height={20} />
        <PositionSkeleton width={40} height={20} />
      </div>
      <PositionSkeleton width={80} height={20} />
    </div>
    <div className="flex items-center justify-between">
      <PositionSkeleton width={80} height={20} />
      <PositionSkeleton width={80} height={20} />
    </div>
  </div>
)

const SectionLink = ({ to, testId, children }: { to: LinkProps['to']; testId?: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="w-fit text-xl font-medium text-text no-underline hover:text-primary hover:underline"
    data-testid={testId ? `${testId}-title` : undefined}
  >
    {children}
  </Link>
)

const PoolSection = ({
  title,
  tooltip,
  icon,
  tag,
  isLoading,
  listPools,
  variant,
  skeletonCount,
  onPoolClick,
}: {
  title: string
  tooltip?: string
  icon?: string | React.ReactNode
  tag?: string
  isLoading: boolean
  listPools: EarnPool[]
  variant: Variant
  skeletonCount?: number
  onPoolClick: (pool: EarnPool) => void
}) => {
  // e2e selectors are keyed off the section's filter tag, so they stay stable
  // regardless of how the section is laid out.
  const testId = tag ? `earn-overview-section-${tag}` : undefined

  const renderIcon = () => {
    if (!icon) return null
    if (typeof icon === 'string') return <img src={icon} alt={title} width={20} height={20} />
    return icon
  }

  const titleText = tag ? (
    <SectionLink to={{ pathname: APP_PATHS.EARN_POOLS, search: `tag=${tag}` }} testId={testId}>
      {title}
    </SectionLink>
  ) : (
    <span className="text-xl font-medium" data-testid={testId ? `${testId}-title` : undefined}>
      {title}
    </span>
  )

  const renderTitle = () =>
    tooltip ? (
      <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
        {titleText}
      </MouseoverTooltipDesktopOnly>
    ) : (
      titleText
    )

  if (variant === 'highlighted' || variant === 'farming') {
    const isFarming = variant === 'farming'
    const ItemContainer = isFarming ? FarmingPoolsList : HighlightedPoolsGrid
    const count = skeletonCount ?? (isFarming ? 3 : 6)

    return (
      <div data-testid={testId} data-tag={tag}>
        <SimpleSectionHeader>
          {renderIcon()}
          {renderTitle()}
        </SimpleSectionHeader>
        <ItemContainer data-testid={testId ? `${testId}-list` : undefined}>
          {isLoading
            ? Array.from({ length: count }).map((_, i) => <LargeSkeleton key={i} />)
            : listPools.map(pool => (
                <PoolItem
                  key={pool.address}
                  pool={pool}
                  variant={isFarming ? 'large-farming' : 'large'}
                  onClick={onPoolClick}
                />
              ))}
        </ItemContainer>
      </div>
    )
  }

  const innerVariant = variant === 'inner-stable' ? 'small-stable' : 'small'
  const count = skeletonCount ?? 4

  return (
    <div data-testid={testId} data-tag={tag}>
      <InnerSectionTitle>{renderTitle()}</InnerSectionTitle>
      <InnerListContainer data-testid={testId ? `${testId}-list` : undefined}>
        {isLoading
          ? Array.from({ length: count }).map((_, i) => <SmallSkeleton key={i} />)
          : listPools.map(pool => (
              <PoolItem key={pool.address} pool={pool} variant={innerVariant} onClick={onPoolClick} />
            ))}
      </InnerListContainer>
    </div>
  )
}

export default PoolSection
