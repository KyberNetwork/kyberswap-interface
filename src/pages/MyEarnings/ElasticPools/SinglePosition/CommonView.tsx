import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Flex } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import Background from 'assets/images/card-background2.png'
import useTheme from 'hooks/useTheme'
import PositionId from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionId'
import { NFTPosition } from 'state/farms/elastic/types'

export const ViewWrapper = styled.div`
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

export type CommonProps = {
  onFlipView: () => void
  positionEarning: ElasticPositionEarningWithDetails
  position: Position
  chainId: ChainId
  pendingFee: [string, string]
  tokenPrices: { [id: string]: number }
  myPoolAPR: string
  myFarmAPR: string
  farmAddress: string
  currency0: Currency
  currency1: Currency
  nft: NFTPosition | undefined
}

type Props = {
  isEarningView: boolean
  children: React.ReactNode
} & CommonProps

const CommonView: React.FC<Props> = ({ onFlipView, positionEarning, isEarningView, position, children }) => {
  const theme = useTheme()

  const isClosed = position.liquidity.toString() === '0'
  const isActive =
    Number(position.tickLower) <= Number(position.pool.tickCurrent) &&
    Number(position.pool.tickCurrent) < Number(position.tickUpper)

  return (
    <ViewWrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
        }}
      >
        <PositionId nftId={positionEarning.id} isActive={isActive} isClosed={isClosed} />

        {children}
      </Flex>

      <Flex
        role="button"
        onClick={onFlipView}
        justifyContent="center"
        alignItems="center"
        sx={{
          flex: '0 0 fit-content',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
          gap: '4px',
          cursor: 'pointer',
        }}
      >
        <Repeat size={12} />
        {isEarningView ? <Trans>View Positions</Trans> : <Trans>View Earnings</Trans>}
      </Flex>
    </ViewWrapper>
  )
}

export default CommonView
