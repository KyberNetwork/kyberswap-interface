import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import PoolItem from 'pages/Earns/Landing/PoolItem'
import { RightColumnSection, SectionContainer } from 'pages/Earns/Landing/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EarnPool } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

const PoolItemSkeleton = () => (
  <Flex alignItems="center" justifyContent="space-between" style={{ padding: '8px 16px' }}>
    <Flex alignItems="center" sx={{ gap: '4px' }}>
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
      <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%', marginLeft: '-8px' }} />
      <PositionSkeleton width={100} height={16} />
      <PositionSkeleton width={40} height={20} />
    </Flex>
    <PositionSkeleton width={60} height={16} />
  </Flex>
)

const PoolSection = ({
  title,
  tooltip,
  icon,
  tag,
  isLoading,
  size = 'small',
  listPools,
  styles,
  variant = 'default',
  skeletonCount = 4,
}: {
  title: string
  tooltip: string
  icon: string | React.ReactNode
  tag: string
  isLoading: boolean
  size?: 'small' | 'large'
  listPools: EarnPool[]
  styles?: React.CSSProperties
  variant?: 'default' | 'grouped'
  skeletonCount?: number
}) => {
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const poolItemContainerStyles = {
    ...(size === 'small'
      ? {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }
      : {
          display: 'grid',
          gridTemplateColumns: upToSmall || upToLarge ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem',
        }),
  }

  const handleClick = () => {
    navigate({
      pathname: APP_PATHS.EARN_POOLS,
      search: `tag=${tag}`,
    })
  }

  const content = (
    <>
      <Flex alignItems="center" sx={{ gap: '8px', marginBottom: '16px' }}>
        {typeof icon === 'string' ? <img src={icon} alt={title} width={24} height={24} /> : icon}
        <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
          <Text fontSize={upToSmall ? 16 : 20} fontWeight={500}>
            {title}
          </Text>
        </MouseoverTooltipDesktopOnly>
      </Flex>

      {isLoading ? (
        <Box sx={poolItemContainerStyles}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <PoolItemSkeleton key={i} />
          ))}
        </Box>
      ) : (
        <Box sx={poolItemContainerStyles}>
          {listPools.map(pool => (
            <PoolItem pool={pool} key={pool.address} />
          ))}
        </Box>
      )}
    </>
  )

  if (variant === 'grouped') {
    return (
      <RightColumnSection role="button" onClick={handleClick}>
        {content}
      </RightColumnSection>
    )
  }

  return (
    <SectionContainer style={styles} role="button" onClick={handleClick}>
      {content}
    </SectionContainer>
  )
}

export default PoolSection
