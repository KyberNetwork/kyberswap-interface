import { ChainId } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Flex } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import Background from 'assets/images/card-background2.png'
import useTheme from 'hooks/useTheme'
import PositionId from 'pages/MyEarnings/ElasticPools/SinglePosition/PositionId'

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
  positionEarning: PositionEarningWithDetails
  position: Position
  chainId: ChainId
  pendingFee: [string, string]
  tokenPrices: { [id: string]: number }
}

type Props = {
  isEarningView: boolean
  children: React.ReactNode
} & CommonProps

const CommonView: React.FC<Props> = ({ onFlipView, positionEarning, isEarningView, children }) => {
  const theme = useTheme()

  return (
    <ViewWrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
        }}
      >
        <PositionId positionEarning={positionEarning} />

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
        {isEarningView ? <Trans>View Position</Trans> : <Trans>View Earnings</Trans>}
      </Flex>
    </ViewWrapper>
  )
}

export default CommonView
