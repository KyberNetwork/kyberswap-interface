import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'

import { ReactComponent as IconTrending } from 'assets/svg/earn/ic_pool_high_apr.svg'
import { AprText, PoolApr, PoolAprWrapper, PoolWrapper, TrendingWrapper } from 'components/EarnBanner/styles'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'

let indexInterval: NodeJS.Timeout

export default function TrendingPoolBanner() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { mixpanelHandler } = useMixpanel()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(false)

  const pool = useMemo(() => data?.data.highlightedPools[index] || null, [data, index])

  const handleClickBanner = () => {
    mixpanelHandler(MIXPANEL_TYPE.EARN_BANNER_CLICK, {
      banner_name: 'HomePage_Earn_Banner',
      page: 'HomePage',
      destination_url: '/earn',
    })
    navigate({ pathname: APP_PATHS.EARN })
  }

  const handleClickBannerPool = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pool) return
    e.stopPropagation()
    mixpanelHandler(MIXPANEL_TYPE.EARN_BANNER_POOL_CLICK, {
      banner_name: 'HomePage_Pool_Banner',
      page: 'HomePage',
      pool_pair: `${pool.tokens[0].symbol}-${pool.tokens[1].symbol}`,
      destination_url: `/pools/${pool.tokens[0].symbol}-${pool.tokens[1].symbol}`,
    })
    navigate({ pathname: APP_PATHS.EARN, search: `?openPool=${index}&type=highlighted` })
  }

  useEffect(() => {
    const handleIndexChange = () => {
      setAnimate(true)
      setTimeout(() => setIndex(prev => (prev >= 9 ? 0 : prev + 1)), 200)
      setTimeout(() => setAnimate(false), 1000)
    }
    indexInterval = setInterval(handleIndexChange, 4_000)

    return () => indexInterval && clearInterval(indexInterval)
  }, [])

  return (
    <TrendingWrapper onClick={handleClickBanner}>
      <Flex alignItems="center" sx={{ gap: '8px' }}>
        <IconTrending width={24} height={24} color={theme.primary} />
        <Text color={theme.primary}>{t`TRENDING POOLS`}</Text>
      </Flex>
      {!!pool ? (
        <PoolWrapper animate={animate} onClick={handleClickBannerPool}>
          <Flex alignItems="center">
            <TokenLogo src={pool.tokens[0].logoURI} boxShadowColor="#0b2e24" />
            <TokenLogo src={pool.tokens[1].logoURI} boxShadowColor="#0b2e24" />
            <Text marginLeft={2}>
              {pool.tokens[0].symbol}/{pool.tokens[1].symbol}
            </Text>
          </Flex>
          <PoolAprWrapper>
            <PoolApr>
              {formatAprNumber(pool.apr + pool.kemApr)}% <AprText>APR</AprText>
            </PoolApr>
          </PoolAprWrapper>
        </PoolWrapper>
      ) : null}
    </TrendingWrapper>
  )
}
