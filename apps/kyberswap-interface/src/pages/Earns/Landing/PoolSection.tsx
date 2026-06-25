import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'

import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import Icon from 'pages/Earns/Landing/Icon'
import PoolItem from 'pages/Earns/Landing/PoolItem'
import PoolItemSkeleton from 'pages/Earns/Landing/PoolItemSkeleton'
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
  styles,
}: {
  title: string
  tooltip: string
  icon: string | React.ReactNode
  tag: string
  isLoading: boolean
  size?: 'small' | 'large'
  listPools: any[]
  styles?: React.CSSProperties
}) => {
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const poolItemContainerClass = size === 'small' ? 'flex flex-col gap-4' : 'grid gap-4'
  const poolItemContainerStyle: React.CSSProperties =
    size === 'large' ? { gridTemplateColumns: upToSmall ? '1fr' : 'repeat(3, 1fr)' } : {}

  // Match the real slice counts (Landing index): large = 9 / 5 (mobile), small = 5.
  const skeletonCount = size === 'large' ? (upToSmall ? 5 : 9) : 5

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
        <div className="flex items-center gap-3">
          <Icon icon={icon} size="small" />
          <MouseoverTooltipDesktopOnly text={tooltip} placement="top">
            <h2 className="text-xl">{title}</h2>
          </MouseoverTooltipDesktopOnly>
        </div>
        <div
          className="m-4 h-px w-full"
          style={{ background: 'linear-gradient(90deg, #161A1C 0%, #49287F 29%, #111413 100%)' }}
        />
        {isLoading ? (
          <div className={poolItemContainerClass} style={poolItemContainerStyle}>
            {Array.from({ length: skeletonCount }, (_, i) => (
              <PoolItemSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className={poolItemContainerClass} style={poolItemContainerStyle}>
            {listPools.map((pool, index) => (
              <PoolItem pool={pool} key={pool.address} rowIndex={index} />
            ))}
          </div>
        )}
      </ListPoolWrapper>
    </PoolWrapper>
  )
}

export default PoolSection
