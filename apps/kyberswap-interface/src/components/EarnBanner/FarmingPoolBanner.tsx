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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatAprNumber } from 'pages/Earns/utils'

let indexInterval: NodeJS.Timeout

export default function FarmingPoolBanner() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animateMoveForward, setAnimateMoveForward] = useState(false)
  const [animateMoveBack, setAnimateMoveBack] = useState(false)

  const totalPools = useMemo(() => data?.data.highlightedPools || [], [data])

  const pools = useMemo(() => {
    if (totalPools.length < 4) return []

    const getWrappedIndex = (i: number) => {
      if (i < 0) return totalPools.length + i
      if (i >= totalPools.length) return i % totalPools.length
      return i
    }

    const startIndex = getWrappedIndex(index - 1)
    const result = []

    for (let i = 0; i < 4; i++) {
      result.push(totalPools[getWrappedIndex(startIndex + i)])
    }

    return result
  }, [totalPools, index])

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
    indexInterval = setInterval(handleMoveForward, 4000)

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
        <MoveBackIcon onClick={handleMoveBack} />
        <FarmingPoolContainer>
          <FarmingPoolWrapper animateMoveForward={animateMoveForward} animateMoveBack={animateMoveBack}>
            {pools.map(pool => (
              <FarmingPool key={pool.address} className="farming-pool">
                <PoolPairText>
                  {pool.tokens[0].symbol}/{pool.tokens[1].symbol}
                </PoolPairText>
                <FarmingAprBadge>{formatAprNumber(pool.apr)}%</FarmingAprBadge>
              </FarmingPool>
            ))}
          </FarmingPoolWrapper>
        </FarmingPoolContainer>
        <MoveForwardIcon onClick={handleMoveForward} />
      </Flex>
    </FarmingWrapper>
  ) : null
}
