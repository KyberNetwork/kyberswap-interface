import { ChainId } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useMemo, useState } from 'react'
import { Flex } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import EarningView from 'pages/MyEarnings/ElasticPools/SinglePosition/EarningView'
import PositionView from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionView'

const FlipCard = styled.div<{ flip: boolean; joined?: boolean }>`
  overflow: hidden;

  border-radius: 20px;
  width: 100%;
  max-width: 360px;
  height: 600px;
  background-color: ${({ theme }) => theme.buttonBlack};
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  transform: rotateY(${({ flip }) => (flip ? '-180deg' : '0')});
`

type Props = {
  isInitiallyViewEarnings: boolean
  chainId: ChainId
  positionEarning: ElasticPositionEarningWithDetails
  pool: Pool | undefined
  pendingFee: [string, string]
  tokenPrices: { [key: string]: number }
}
const SinglePosition: React.FC<Props> = ({
  positionEarning,
  chainId,
  pool,
  pendingFee,
  tokenPrices,
  isInitiallyViewEarnings,
}) => {
  const [isViewEarnings, setViewEarnings] = useState(isInitiallyViewEarnings)

  const position = useMemo(() => {
    if (pool) {
      return new Position({
        pool,
        liquidity: positionEarning.liquidity,
        tickLower: Number(positionEarning.tickLower),
        tickUpper: Number(positionEarning.tickUpper),
      })
    }

    return undefined
  }, [pool, positionEarning.liquidity, positionEarning.tickLower, positionEarning.tickUpper])

  const toggleFlipped = () => {
    setViewEarnings(v => !v)
  }

  useEffect(() => {
    if (isInitiallyViewEarnings) {
      setViewEarnings(true)
    } else {
      setViewEarnings(false)
    }
  }, [isInitiallyViewEarnings])

  if (!position) {
    return null
  }

  const props: CommonProps = {
    chainId: chainId,
    positionEarning: positionEarning,
    onFlipView: toggleFlipped,
    position,
    pendingFee,
    tokenPrices,
  }

  return (
    <FlipCard flip={isViewEarnings}>
      {isViewEarnings && (
        <Flex
          sx={{
            width: '100%',
            height: '100%',
            transform: 'scale(-1, 1)',
          }}
        >
          <EarningView {...props} />
        </Flex>
      )}

      {!isViewEarnings && <PositionView {...props} />}
    </FlipCard>
  )
}

export default SinglePosition
