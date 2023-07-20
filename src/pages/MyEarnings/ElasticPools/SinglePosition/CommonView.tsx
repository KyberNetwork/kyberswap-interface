import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Flex } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import PositionId from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionId'
import { NFTPosition } from 'state/farms/elastic/types'

export const ViewWrapper = styled.div<{ viewEarning: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  width: 100%;
  height: 100%;
  background: ${({ theme, viewEarning }) =>
    !viewEarning
      ? `linear-gradient(225deg, rgba(21, 190, 176, 0.08) 27.6%, rgba(44, 158, 196, 0.08) 91.67%),
    linear-gradient(135deg, rgba(49, 203, 158, 0.08) 35.94%, rgba(143, 146, 255, 0.08) 100%),
    ${theme.buttonBlack}`
      : theme.buttonBlack};
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
    <ViewWrapper viewEarning={isEarningView}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '12px',
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
