import { useNavigate } from 'react-router-dom'

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
import { cn } from 'utils/cn'

type Variant = 'inner' | 'inner-stable' | 'highlighted' | 'farming'

const SmallSkeleton = () => (
  <div className="flex items-center justify-between px-4 py-3">
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
  <div className="rounded-xl bg-white-04 p-4">
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
  const navigate = useNavigate()

  const handleSectionClick = (e?: React.MouseEvent) => {
    if (!tag) return
    e?.stopPropagation()
    navigate({
      pathname: APP_PATHS.EARN_POOLS,
      search: `tag=${tag}`,
    })
  }

  const handleSectionKeyDown = (e: React.KeyboardEvent) => {
    if (!tag) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      handleSectionClick()
    }
  }

  const renderIcon = () => {
    if (!icon) return null
    if (typeof icon === 'string') return <img src={icon} alt={title} width={20} height={20} />
    return icon
  }

  const renderTitle = () =>
    tooltip ? (
      <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
        <span className="text-xl font-medium">{title}</span>
      </MouseoverTooltipDesktopOnly>
    ) : (
      <span className="text-xl font-medium">{title}</span>
    )

  if (variant === 'highlighted' || variant === 'farming') {
    const isFarming = variant === 'farming'
    const ItemContainer = isFarming ? FarmingPoolsList : HighlightedPoolsGrid
    const count = skeletonCount ?? (isFarming ? 3 : 6)

    return (
      <div
        role={tag ? 'button' : undefined}
        tabIndex={tag ? 0 : undefined}
        onClick={handleSectionClick}
        onKeyDown={handleSectionKeyDown}
        className={cn(tag ? 'cursor-pointer' : 'cursor-default')}
      >
        <SimpleSectionHeader>
          {renderIcon()}
          {renderTitle()}
        </SimpleSectionHeader>
        <ItemContainer>
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
    <div
      role={tag ? 'button' : undefined}
      tabIndex={tag ? 0 : undefined}
      onClick={handleSectionClick}
      onKeyDown={handleSectionKeyDown}
      className={cn(tag ? 'cursor-pointer' : 'cursor-default')}
    >
      <InnerSectionTitle>{renderTitle()}</InnerSectionTitle>
      <InnerListContainer>
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
