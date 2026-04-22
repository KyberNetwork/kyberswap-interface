import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'

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
  <Flex alignItems="center" justifyContent="space-between" sx={{ padding: '12px 16px' }}>
    <Flex alignItems="center" sx={{ gap: '4px' }}>
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%', marginLeft: '-8px' }} />
      <PositionSkeleton width={100} height={16} />
      <PositionSkeleton width={40} height={20} />
    </Flex>
    <PositionSkeleton width={60} height={16} />
  </Flex>
)

const LargeSkeleton = () => (
  <Box sx={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)' }}>
    <Flex alignItems="center" justifyContent="space-between" marginBottom="12px">
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%', marginLeft: '-8px' }} />
        <PositionSkeleton width={100} height={20} />
        <PositionSkeleton width={40} height={20} />
      </Flex>
      <PositionSkeleton width={80} height={20} />
    </Flex>
    <Flex alignItems="center" justifyContent="space-between">
      <PositionSkeleton width={80} height={20} />
      <PositionSkeleton width={80} height={20} />
    </Flex>
  </Box>
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

  if (variant === 'highlighted' || variant === 'farming') {
    const isFarming = variant === 'farming'
    const ItemContainer = isFarming ? FarmingPoolsList : HighlightedPoolsGrid
    const count = skeletonCount ?? (isFarming ? 3 : 6)

    return (
      <Box
        role={tag ? 'button' : undefined}
        tabIndex={tag ? 0 : undefined}
        onClick={handleSectionClick}
        onKeyDown={handleSectionKeyDown}
        sx={{ cursor: tag ? 'pointer' : 'default' }}
      >
        <SimpleSectionHeader>
          {renderIcon()}
          {tooltip ? (
            <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
              <Text fontSize={20} fontWeight={500}>
                {title}
              </Text>
            </MouseoverTooltipDesktopOnly>
          ) : (
            <Text fontSize={20} fontWeight={500}>
              {title}
            </Text>
          )}
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
      </Box>
    )
  }

  const innerVariant = variant === 'inner-stable' ? 'small-stable' : 'small'
  const count = skeletonCount ?? 4

  return (
    <Box
      role={tag ? 'button' : undefined}
      tabIndex={tag ? 0 : undefined}
      onClick={handleSectionClick}
      onKeyDown={handleSectionKeyDown}
      sx={{ cursor: tag ? 'pointer' : 'default' }}
    >
      <InnerSectionTitle>
        {tooltip ? (
          <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
            <Text fontSize={20} fontWeight={500}>
              {title}
            </Text>
          </MouseoverTooltipDesktopOnly>
        ) : (
          <Text fontSize={20} fontWeight={500}>
            {title}
          </Text>
        )}
      </InnerSectionTitle>
      <InnerListContainer>
        {isLoading
          ? Array.from({ length: count }).map((_, i) => <SmallSkeleton key={i} />)
          : listPools.map(pool => (
              <PoolItem key={pool.address} pool={pool} variant={innerVariant} onClick={onPoolClick} />
            ))}
      </InnerListContainer>
    </Box>
  )
}

export default PoolSection
