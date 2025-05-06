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
import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import { Flex, Text } from 'rebass'
import { t } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks'
import { useExplorerLandingQuery } from 'services/zapEarn'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatAprNumber } from 'pages/Earns/utils'
import { useMedia } from 'react-use'
import { MEDIA_WIDTHS } from 'theme'

let indexInterval: NodeJS.Timeout

export default function FarmingPoolBanner() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animateMoveForward, setAnimateMoveForward] = useState(false)
  const [animateMoveBack, setAnimateMoveBack] = useState(false)

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = containerRef.current?.clientWidth || 0

  const totalPools = useMemo(() => data?.data.highlightedPools || [], [data])

  const pools = useMemo(() => {
    const numberPoolsToShow = upToExtraSmall ? 3 : 4
    if (totalPools.length < numberPoolsToShow) return []

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
    indexInterval = setInterval(handleMoveForward, 10_000)

    return () => indexInterval && clearInterval(indexInterval)
  }, [handleMoveForward])

  return pools.length > 0 ? (
    <FarmingWrapper>
      <Flex alignItems="center" sx={{ gap: '6px' }}>
        <IconKem width={26} height={26} color={theme.primary} />
        <Text color={'#FCD884'}>{t`FARMING POOLS`}</Text>
      </Flex>
      <Flex
        justifyContent="center"
        alignItems="center"
        sx={{ gap: '8px', width: '102%', position: 'relative', left: '-1%' }}
      >
        {pools.length > 0 && (
          <>
            {containerWidth > 0 && <MoveBackIcon onClick={handleMoveBack} />}
            <FarmingPoolContainer ref={containerRef}>
              {containerWidth > 0 && (
                <FarmingPoolWrapper
                  animateMoveForward={animateMoveForward}
                  animateMoveBack={animateMoveBack}
                  style={{ width: containerWidth * (!upToExtraSmall ? 2 : 3) }}
                >
                  {pools.map(pool => (
                    <FarmingPool
                      key={pool.address}
                      className="farming-pool"
                      style={{ width: !upToExtraSmall ? containerWidth / 2 : containerWidth }}
                    >
                      <PoolPairText>
                        {pool.tokens[0].symbol}/{pool.tokens[1].symbol}
                      </PoolPairText>
                      <FarmingAprBadge>{formatAprNumber(pool.apr)}%</FarmingAprBadge>
                    </FarmingPool>
                  ))}
                </FarmingPoolWrapper>
              )}
            </FarmingPoolContainer>
            {containerWidth > 0 && <MoveForwardIcon onClick={handleMoveForward} />}
          </>
        )}
      </Flex>
    </FarmingWrapper>
  ) : null
}
