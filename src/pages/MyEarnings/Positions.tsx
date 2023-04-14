import { ChainId } from '@kyberswap/ks-sdk-core'
import { Pool } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'

import { ReactComponent as ZigZag } from 'assets/svg/zigzag.svg'
import { ButtonLight } from 'components/Button'
import useTheme from 'hooks/useTheme'
import SinglePosition from 'pages/MyEarnings/SinglePosition'

type Props = {
  chainId: ChainId
  positionEarnings: PositionEarningWithDetails[]
  pool: Pool | undefined
}
const Positions: React.FC<Props> = ({ positionEarnings, chainId, pool }) => {
  const theme = useTheme()
  const [numberOfVisiblePositions, setNumberOfVisiblePositions] = useState(3)
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '24px',
          }}
        >
          My Liquidity ({positionEarnings.length} active positions)
        </Text>

        <Flex
          role="button"
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            gap: '4px',
            alignItems: 'center',
            color: theme.subText,
            userSelect: 'none',
            cursor: 'pointer',
          }}
        >
          <ZigZag /> <Trans>Price Ranges Chart</Trans>
        </Flex>
      </Flex>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
        {positionEarnings.slice(0, numberOfVisiblePositions).map(positionEarning => (
          <SinglePosition chainId={chainId} key={positionEarning.id} positionEarning={positionEarning} pool={pool} />
        ))}
      </Box>

      {numberOfVisiblePositions < positionEarnings.length && (
        <ButtonLight
          onClick={() => {
            setNumberOfVisiblePositions(n => n + 3)
          }}
        >
          View more ({positionEarnings.length - numberOfVisiblePositions})
        </ButtonLight>
      )}
    </Flex>
  )
}

export default Positions
