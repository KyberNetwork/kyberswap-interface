import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useMemo, useState } from 'react'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import EarningView from 'pages/MyEarnings/ElasticPools/SinglePosition/EarningView'
import PositionView from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionView'
import { calculateMyFarmAPR, calculateMyPoolAPR } from 'pages/MyEarnings/utils'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { formattedNum } from 'utils'

const FlipCard = styled.div`
  overflow: hidden;
  border-radius: 20px;
  width: 100%;
  max-width: 360px;
  height: 582px;
  perspective: 1000px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    max-width: 100%;
  `};
`

const FlipCardInner = styled.div<{ flip: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  transform: rotateY(${({ flip }) => (flip ? '-180deg' : '0')});
`

const FlipCardFront = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
`

const FlipCardBack = styled(FlipCardFront)`
  transform: rotateY(-180deg);
`

const defaultPendingFee = ['0', '0'] as [string, string]

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
  pendingFee = defaultPendingFee,
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

  const { userFarmInfo = {} } = useElasticFarms(chainId)

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
    myPoolAPR: myPoolAPR ? `${formattedNum(myPoolAPR, false, 2)}%` : '--',
    myFarmAPR: myFarmAPR ? `${formattedNum(myFarmAPR, false, 2)}%` : '--',
    farmAddress,
    currency0,
    currency1,
    nft,
  }

  return (
    <FlipCard>
      <FlipCardInner flip={!isViewEarnings}>
        <FlipCardFront>
          <EarningView {...props} />
        </FlipCardFront>
        <FlipCardBack>
          <PositionView {...props} />
        </FlipCardBack>
      </FlipCardInner>
    </FlipCard>
  )
}

export default SinglePosition
