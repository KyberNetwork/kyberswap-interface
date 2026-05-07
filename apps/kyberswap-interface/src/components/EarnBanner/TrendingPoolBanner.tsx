import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'

import { ReactComponent as IconTrending } from 'assets/svg/earn/ic_pool_high_apr.svg'
import {
  AprText,
  BannerHeaderLink,
  PoolApr,
  PoolAprWrapper,
  PoolWrapper,
  TrendingWrapper,
} from 'components/EarnBanner/styles'
import Skeleton from 'components/Skeleton'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { type EarnPool } from 'pages/Earns/types/pool'

let indexInterval: NodeJS.Timeout

export default function TrendingPoolBanner() {
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [isSlideHovered, setIsSlideHovered] = useState(false)

  const pool = useMemo(() => data?.data.highlightedPools[index] || null, [data, index])

  const handleBannerTracking = () => {
    trackingHandler(TRACKING_EVENT_TYPE.EARN_BANNER_CLICK, {
      banner_name: 'HomePage_Earn_Banner',
      page: 'HomePage',
      destination_url: APP_PATHS.EARN,
    })
  }

  const getPoolDetailHref = (pool: EarnPool) => {
    const poolChainId = pool.chain?.id ?? pool.chainId
    if (!poolChainId) return APP_PATHS.EARN_POOLS

    return `${APP_PATHS.ADD_LIQUIDITY}?${new URLSearchParams({
      exchange: pool.exchange,
      poolAddress: pool.address,
      poolChainId: String(poolChainId),
    }).toString()}`
  }

  const handlePoolClickTracking = (pool: EarnPool) => {
    const destinationUrl = getPoolDetailHref(pool)

    trackingHandler(TRACKING_EVENT_TYPE.EARN_BANNER_POOL_CLICK, {
      banner_name: 'HomePage_Pool_Banner',
      page: 'HomePage',
      pool_pair: `${pool.tokens[0].symbol}-${pool.tokens[1].symbol}`,
      destination_url: destinationUrl,
    })
    trackingHandler(TRACKING_EVENT_TYPE.TRENDING_POOL_CLICKED, {
      pool_pair: `${pool.tokens[0].symbol}/${pool.tokens[1].symbol}`,
      pool_apr: pool.allApr,
      pool_type: 'trending',
      chain: pool.chain?.name || '',
    })
  }

  useEffect(() => {
    const handleIndexChange = () => {
      if (isSlideHovered) return

      setAnimate(true)
      setTimeout(() => setIndex(prev => (prev >= 9 ? 0 : prev + 1)), 200)
      setTimeout(() => setAnimate(false), 1000)
    }
    indexInterval = setInterval(handleIndexChange, 4_000)

    return () => indexInterval && clearInterval(indexInterval)
  }, [isSlideHovered])

  const poolSymbol = `${pool?.tokens[0].symbol}/${pool?.tokens[1].symbol}`

  return (
    <TrendingWrapper>
      <BannerHeaderLink onClick={handleBannerTracking} to={APP_PATHS.EARN}>
        <IconTrending width={24} height={24} color={theme.primary} />
        <Text color={theme.primary} fontWeight={500}>{t`TRENDING POOLS`}</Text>
      </BannerHeaderLink>
      {!!pool ? (
        <PoolWrapper
          animate={animate}
          onClick={() => handlePoolClickTracking(pool)}
          onMouseEnter={() => setIsSlideHovered(true)}
          onMouseLeave={() => setIsSlideHovered(false)}
          to={getPoolDetailHref(pool)}
        >
          <Flex alignItems="center">
            <TokenLogo src={pool.tokens[0].logoURI} boxShadowColor="#0b2e24" />
            <TokenLogo src={pool.tokens[1].logoURI} boxShadowColor="#0b2e24" translateLeft />
            <Text
              marginLeft={2}
              sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              title={poolSymbol}
            >
              {poolSymbol}
            </Text>
          </Flex>
          <PoolAprWrapper>
            <PoolApr>
              {formatAprNumber(pool.allApr)}% <AprText>{t`APR`}</AprText>
            </PoolApr>
          </PoolAprWrapper>
        </PoolWrapper>
      ) : (
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center">
            <Skeleton circle height={24} variant="darkSubtle" width={24} />
            <Skeleton circle height={24} style={{ marginLeft: -8 }} variant="darkSubtle" width={24} />
            <Skeleton height={18} style={{ marginLeft: 8 }} variant="darkSubtle" width={88} />
          </Flex>
          <Skeleton height={28} borderRadius={16} variant="darkSubtle" width={120} />
        </Flex>
      )}
    </TrendingWrapper>
  )
}
