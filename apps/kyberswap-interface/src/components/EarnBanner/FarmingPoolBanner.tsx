import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { useExplorerLandingQuery } from 'services/earn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { FarmingPoolContentSkeleton } from 'components/EarnBanner/Skeletons'
import {
  BannerHeaderLink,
  FarmingAprBadge,
  FarmingPool,
  FarmingPoolContainer,
  FarmingPoolWrapper,
  FarmingWrapper,
  MoveBackIcon,
  MoveForwardIcon,
  PoolPairText,
} from 'components/EarnBanner/styles'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { type EarnPool } from 'pages/Earns/types/pool'
import { getPoolDetailUrl } from 'pages/Earns/utils/url'
import { MEDIA_WIDTHS } from 'theme'

let indexInterval: NodeJS.Timeout

export default function FarmingPoolBanner() {
  const { trackingHandler } = useTracking()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animateMoveForward, setAnimateMoveForward] = useState(false)
  const [animateMoveBack, setAnimateMoveBack] = useState(false)
  const [isSlideHovered, setIsSlideHovered] = useState(false)

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const WrapperRef = useRef<HTMLDivElement>(null)
  const containerWidth = WrapperRef.current?.clientWidth ? WrapperRef.current.clientWidth - 36 * 2 : 0

  const totalPools = useMemo(() => data?.data.farmingPools || [], [data])

  const pools = useMemo(() => {
    const numberPoolsToShow = upToExtraSmall ? 3 : 4
    if (totalPools.length < 2) return []

    const getWrappedIndex = (i: number) => {
      if (i < 0) return totalPools.length + i
      if (i >= totalPools.length) return i % totalPools.length
      return i
    }

    const startIndex = getWrappedIndex(index - 1)
    const result = []

    for (let i = 0; i < numberPoolsToShow; i++) {
      result.push(totalPools[getWrappedIndex(startIndex + i)])
    }

    return result
  }, [totalPools, index, upToExtraSmall])

  const getPoolDetailHref = (pool: EarnPool) => {
    const poolChainId = pool.chain?.id ?? pool.chainId
    if (!poolChainId) return `${APP_PATHS.EARN_POOLS}?tag=${FilterTag.FARMING_POOL}`

    return getPoolDetailUrl(poolChainId, pool.exchange, pool.address)
  }

  const handlePoolClickTracking = (pool: EarnPool) => {
    trackingHandler(TRACKING_EVENT_TYPE.FARMING_POOL_CLICKED, {
      pool_pair: `${pool.tokens[0].symbol}/${pool.tokens[1].symbol}`,
      pool_apr: pool.allApr,
      pool_type: 'farming',
      chain: pool.chain?.name || '',
    })
  }

  const handleMoveBack = () => {
    setAnimateMoveBack(true)
    setTimeout(() => {
      setIndex(prev => (prev === 0 ? totalPools.length - 1 : prev - 1))
      setAnimateMoveBack(false)
    }, 700)
  }

  const handleMoveForward = useCallback(() => {
    if (animateMoveForward || animateMoveBack || isSlideHovered) return
    setAnimateMoveForward(true)
    setTimeout(() => {
      setIndex(prev => (prev === totalPools.length - 1 ? 0 : prev + 1))
      setAnimateMoveForward(false)
    }, 700)
  }, [animateMoveBack, animateMoveForward, isSlideHovered, totalPools.length])

  useEffect(() => {
    indexInterval = setInterval(handleMoveForward, 4_000)

    return () => indexInterval && clearInterval(indexInterval)
  }, [handleMoveForward])

  return (
    <FarmingWrapper>
      <BannerHeaderLink to={`${APP_PATHS.EARN_POOLS}?tag=${FilterTag.FARMING_POOL}`}>
        <FarmingIcon width={24} height={24} className="text-primary" />
        <span className="font-medium" style={{ color: '#FCD884' }}>{t`FARMING POOLS`}</span>
      </BannerHeaderLink>
      {pools.length > 0 ? (
        <div
          className="relative flex items-center justify-center gap-2"
          style={{ width: 'calc(100% + 8px)', left: '-4px' }}
          ref={WrapperRef}
        >
          <MoveBackIcon onClick={handleMoveBack} />
          <FarmingPoolContainer
            onMouseEnter={() => setIsSlideHovered(true)}
            onMouseLeave={() => setIsSlideHovered(false)}
          >
            <FarmingPoolWrapper
              animateMoveForward={animateMoveForward}
              animateMoveBack={animateMoveBack}
              style={{ width: containerWidth * (!upToExtraSmall ? 2 : 3) }}
            >
              {pools.map((pool, index) => {
                const poolSymbol = `${pool.tokens[0].symbol}/${pool.tokens[1].symbol}`
                return (
                  <FarmingPool
                    key={`${pool.address}-${index}`}
                    className="farming-pool"
                    onClick={() => handlePoolClickTracking(pool)}
                    to={getPoolDetailHref(pool)}
                    style={{ width: !upToExtraSmall ? containerWidth / 2 : containerWidth }}
                  >
                    <PoolPairText title={poolSymbol}>{poolSymbol}</PoolPairText>
                    <FarmingAprBadge>{formatAprNumber(pool.allApr)}%</FarmingAprBadge>
                  </FarmingPool>
                )
              })}
            </FarmingPoolWrapper>
          </FarmingPoolContainer>
          <MoveForwardIcon onClick={handleMoveForward} />
        </div>
      ) : (
        <FarmingPoolContentSkeleton />
      )}
    </FarmingWrapper>
  )
}
