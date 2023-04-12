import { ChainId } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { useMemo, useState } from 'react'
import { Flex } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import EarningView from 'pages/MyEarnings/SinglePosition/EarningView'
import PositionView from 'pages/MyEarnings/SinglePosition/PositionView'
import { useAppSelector } from 'state/hooks'
import { isAddress } from 'utils'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  width: 100%;
  height: 100%;
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
}
const SinglePosition: React.FC<Props> = ({ positionEarning, chainId }) => {
  const theme = useTheme()
  const [isFlipped, setFlipped] = useState(false)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const feeAmount = Number(positionEarning.pool.feeTier) as FeeAmount

  const [currency0, currency1] = useMemo(() => {
    const tokenAddress0 = isAddress(chainId, positionEarning.token0)
    const tokenAddress1 = isAddress(chainId, positionEarning.token1)

    if (!tokenAddress0 || !tokenAddress1) {
      return []
    }

    const currency0 = tokensByChainId[chainId][tokenAddress0]
    const currency1 = tokensByChainId[chainId][tokenAddress1]

    return [currency0, currency1]
  }, [chainId, positionEarning.token0, positionEarning.token1, tokensByChainId])

  const [, pool] = usePool(currency0 || undefined, currency1 || undefined, feeAmount)

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
