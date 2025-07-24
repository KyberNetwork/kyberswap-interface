import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import LocalLoader from 'components/LocalLoader'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import Icon from 'pages/Earns/Landing/Icon'
import PoolItem from 'pages/Earns/Landing/PoolItem'
import { ListPoolWrapper, PoolWrapper } from 'pages/Earns/Landing/styles'
import { MEDIA_WIDTHS } from 'theme'

const PoolSection = ({
  title,
  tooltip,
  icon,
  tag,
  isLoading,
  size = 'small',
  listPools,
  isFarming = false,
  styles,
}: {
  title: string
  tooltip: string
  icon: string | React.ReactNode
  tag: string
  isLoading: boolean
  size?: 'small' | 'large'
  listPools: any[]
  isFarming?: boolean
  styles?: React.CSSProperties
}) => {
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const poolItemContainerStyles = {
    ...(size === 'small'
      ? {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }
      : {
          display: 'grid',
          gridTemplateColumns: upToSmall ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem',
        }),
  }

  return (
    <PoolWrapper style={styles}>
      <ListPoolWrapper
        role="button"
        onClick={() => {
          navigate({
            pathname: APP_PATHS.EARN_POOLS,
            search: `tag=${tag}`,
          })
        }}
      >
        <Flex alignItems="center" sx={{ gap: '12px' }}>
          <Icon icon={icon} size="small" />
          <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
            <Text fontSize={20}>{title}</Text>
          </MouseoverTooltipDesktopOnly>
        </Flex>
        <Box
          sx={{
            height: '1px',
            margin: '16px',
            width: '100%',
            background: 'linear-gradient(90deg, #161A1C 0%, #49287F 29%, #111413 100%)',
          }}
        />
        {isLoading ? (
          <LocalLoader />
        ) : (
          <Box sx={poolItemContainerStyles}>
            {listPools.map(pool => (
              <PoolItem pool={pool} key={pool.address} isFarming={isFarming} />
            ))}
          </Box>
        )}
      </ListPoolWrapper>
    </PoolWrapper>
  )
}

export default PoolSection
