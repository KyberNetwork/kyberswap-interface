import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'

import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import {
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
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

let indexInterval: NodeJS.Timeout

export default function FarmingPoolBanner() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animateMoveForward, setAnimateMoveForward] = useState(false)
  const [animateMoveBack, setAnimateMoveBack] = useState(false)

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

  const handleClickBannerPool = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!index && index !== 0) return
    e.stopPropagation()
    navigate({ pathname: APP_PATHS.EARN, search: `?openPool=${index}&type=farming` })
  }

  const handleMoveBack = () => {
    setAnimateMoveBack(true)
    setTimeout(() => {
      setIndex(prev => (prev === 0 ? totalPools.length - 1 : prev - 1))
      setAnimateMoveBack(false)
    }, 700)
  }

  const handleMoveForward = useCallback(() => {
    setAnimateMoveForward(true)
    setTimeout(() => {
      setIndex(prev => (prev === totalPools.length - 1 ? 0 : prev + 1))
      setAnimateMoveForward(false)
    }, 700)
  }, [totalPools])

  useEffect(() => {
    indexInterval = setInterval(handleMoveForward, 6_000)

    return () => indexInterval && clearInterval(indexInterval)
  }, [handleMoveForward])

  return (
    <FarmingWrapper>
      <Flex alignItems="center" sx={{ gap: '6px' }}>
        <IconKem width={26} height={26} color={theme.primary} />
        <Text color={'#FCD884'}>{t`FARMING POOLS`}</Text>
      </Flex>
      {pools.length > 0 ? (
        <Flex
          justifyContent="center"
          alignItems="center"
          sx={{ gap: '8px', width: '102%', position: 'relative', left: '-1%' }}
          ref={WrapperRef}
        >
          {containerWidth > 0 && (
            <>
              <MoveBackIcon onClick={handleMoveBack} />
              <FarmingPoolContainer>
                <FarmingPoolWrapper
                  animateMoveForward={animateMoveForward}
                  animateMoveBack={animateMoveBack}
                  style={{ width: containerWidth * (!upToExtraSmall ? 2 : 3) }}
                >
                  {pools.map((pool, index) => (
                    <FarmingPool
                      key={`${pool.address}-${index}`}
                      className="farming-pool"
                      style={{ width: !upToExtraSmall ? containerWidth / 2 : containerWidth }}
                      onClick={handleClickBannerPool}
                    >
                      <PoolPairText>
                        {pool.tokens[0].symbol}/{pool.tokens[1].symbol}
                      </PoolPairText>
                      <FarmingAprBadge>{formatAprNumber(pool.apr + pool.kemApr)}%</FarmingAprBadge>
                    </FarmingPool>
                  ))}
                </FarmingPoolWrapper>
              </FarmingPoolContainer>
              <MoveForwardIcon onClick={handleMoveForward} />
            </>
          )}
        </Flex>
      ) : null}
    </FarmingWrapper>
  )
}
