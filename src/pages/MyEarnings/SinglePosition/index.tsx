import { ChainId } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useMemo, useState } from 'react'
import { Flex } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import Background from 'assets/images/card-background2.png'
import EarningView from 'pages/MyEarnings/SinglePosition/EarningView'
import PositionView from 'pages/MyEarnings/SinglePosition/PositionView'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  width: 100%;
  height: 100%;
  background: url(${Background});
  background-size: cover;
  background-position: center;
`

const FlipCard = styled.div<{ flip: boolean; joined?: boolean }>`
  overflow: hidden;

  border-radius: 20px;
  width: 100%;
  height: 600px;
  background-color: ${({ theme }) => theme.buttonBlack};
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  transform: rotateY(${({ flip }) => (flip ? '-180deg' : '0')});
`

type Props = {
  chainId: ChainId
  positionEarning: PositionEarningWithDetails
  pool: Pool | undefined
}
const SinglePosition: React.FC<Props> = ({ positionEarning, chainId, pool }) => {
  const [isFlipped, setFlipped] = useState(false)

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
    setFlipped(v => !v)
  }

  const handleClick = () => {
    console.log({ positionEarning })
  }

  return (
    <FlipCard flip={isFlipped} onClick={handleClick}>
      {isFlipped && (
        <Flex
          sx={{
            width: '100%',
            height: '100%',
            transform: 'scale(-1, 1)',
          }}
        >
          <EarningView chainId={chainId} positionEarning={positionEarning} onFlipView={toggleFlipped} />
        </Flex>
      )}

      {!isFlipped && position && (
        <PositionView positionEarning={positionEarning} onFlipView={toggleFlipped} position={position} />
      )}
    </FlipCard>
  )
}

export default SinglePosition
