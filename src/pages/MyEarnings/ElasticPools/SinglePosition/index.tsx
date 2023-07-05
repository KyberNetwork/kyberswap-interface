import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useMemo, useState } from 'react'
import { Flex } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import EarningView from 'pages/MyEarnings/ElasticPools/SinglePosition/EarningView'
import PositionView from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionView'
import { calculateMyFarmAPR, calculateMyPoolAPR } from 'pages/MyEarnings/utils'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { formattedNum } from 'utils'

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
  currency0: Currency
  currency1: Currency
}
const SinglePosition: React.FC<Props> = ({
  positionEarning,
  chainId,
  pool,
  pendingFee,
  tokenPrices,
  isInitiallyViewEarnings,
  currency0,
  currency1,
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

  const { userFarmInfo = {} } = useElasticFarms()

  const myPoolAPR = useMemo(() => {
    if (!position || !currency0 || !currency1) {
      return undefined
    }

    return calculateMyPoolAPR(positionEarning, position, tokenPrices, currency0, currency1, pendingFee)
  }, [pendingFee, position, positionEarning, tokenPrices, currency0, currency1])

  const farmAddress = useMemo(() => {
    let farmAddress = ''
    Object.entries(userFarmInfo).forEach(([address, info]) => {
      Object.keys(info.rewardByNft).forEach(key => {
        if (key.split('_')[1] === positionEarning.id) {
          farmAddress = address
        }
      })
    })

    return farmAddress
  }, [positionEarning.id, userFarmInfo])

  const myFarmAPR = useMemo(() => {
    if (!position || !currency0 || !currency1) {
      return undefined
    }

    return calculateMyFarmAPR(positionEarning, position, tokenPrices, currency0, currency1, userFarmInfo)
  }, [position, positionEarning, tokenPrices, userFarmInfo, currency0, currency1])

  const nft = useMemo(() => {
    return Object.values(userFarmInfo)
      .map(info => Object.values(info.joinedPositions).flat())
      .flat()
      .find(item => item.nftId.toString() === positionEarning.id)
  }, [positionEarning.id, userFarmInfo])

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

  if (!position || !currency0 || !currency1) {
    return null
  }

  const props: CommonProps = {
    chainId: chainId,
    positionEarning: positionEarning,
    onFlipView: toggleFlipped,
    position,
    pendingFee,
    tokenPrices,
    myPoolAPR: myPoolAPR ? `${formattedNum(myPoolAPR, false, 4)}%` : '--',
    myFarmAPR: myFarmAPR ? `${formattedNum(myFarmAPR, false, 4)}%` : '--',
    farmAddress,
    currency0,
    currency1,
    nft,
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
