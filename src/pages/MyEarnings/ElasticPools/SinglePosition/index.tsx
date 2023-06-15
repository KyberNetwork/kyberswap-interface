import { ChainId } from '@kyberswap/ks-sdk-core'
import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useMemo, useState } from 'react'
import { Flex } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import Background from 'assets/images/card-background2.png'
import { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import EarningView from 'pages/MyEarnings/ElasticPools/SinglePosition/EarningView'
import PositionView from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionView'

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
  pendingFee: [string, string]
  tokenPrices: { [key: string]: number }
}
const SinglePosition: React.FC<Props> = ({ positionEarning, chainId, pool, pendingFee, tokenPrices }) => {
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

  if (!position) {
    return null
  }

  const props: CommonProps = {
    chainId: chainId,
    positionEarning: positionEarning,
    onFlipView: toggleFlipped,
    position,
    pendingFee,
    tokenPrices
  }

  return (
    <FlipCard flip={isFlipped}>
      {isFlipped && (
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

      {!isFlipped && <PositionView {...props} />}
    </FlipCard>
  )
}

export default SinglePosition
