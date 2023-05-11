import { ChainId } from '@kyberswap/ks-sdk-core'
import { Pool } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Eye, Info } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'

import { ButtonLight } from 'components/Button'
import useTheme from 'hooks/useTheme'
import SinglePosition from 'pages/MyEarnings/SinglePosition'
import { useAppSelector } from 'state/hooks'

type Props = {
  chainId: ChainId
  positionEarnings: PositionEarningWithDetails[]
  pool: Pool | undefined
}
const Positions: React.FC<Props> = ({ positionEarnings, chainId, pool }) => {
  const theme = useTheme()
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)
  const [numberOfVisiblePositions, setNumberOfVisiblePositions] = useState(3)

  const [numOfActivePositions, numOfInactivePositions, numOfClosedPositions] = useMemo(() => {
    const nClosed = positionEarnings.filter(pos => !pos.liquidity || pos.liquidity === '0').length
    const nActive = positionEarnings.filter(pos => {
      const isNotClosed = pos.liquidity && pos.liquidity !== '0'
      const isActive = Number(pos.tickLower) <= Number(pos.pool.tick) && Number(pos.pool.tick) < Number(pos.tickUpper)

      return isNotClosed && isActive
    }).length

    return [nActive, positionEarnings.length - nClosed - nActive, nClosed]
  }, [positionEarnings])

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
          My Liquidity Positions
        </Text>

        <Flex
          sx={{
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <Flex
            sx={{
              gap: '4px',
              alignItems: 'center',
            }}
          >
            <Flex
              sx={{
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                justifyContent: 'center',
                alignItems: 'center',
                background: rgba(theme.primary, 0.3),
              }}
            >
              <Info size={10} color={theme.primary} />
            </Flex>

            <Text
              sx={{
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
              }}
            >
              {numOfActivePositions} Active
            </Text>
          </Flex>

          {numOfInactivePositions ? (
            <Flex
              sx={{
                gap: '4px',
                alignItems: 'center',
              }}
            >
              <Flex
                sx={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: rgba(theme.warning, 0.3),
                }}
              >
                <Info size={10} color={theme.warning} />
              </Flex>

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                }}
              >
                {numOfInactivePositions} Inactive
              </Text>
            </Flex>
          ) : null}

          {numOfClosedPositions || shouldShowClosedPositions ? (
            <Flex
              sx={{
                gap: '4px',
                alignItems: 'center',
              }}
            >
              <Flex
                sx={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: rgba(theme.red, 0.3),
                }}
              >
                <Info size={10} color={theme.red} />
              </Flex>

              <Text
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                }}
              >
                {numOfClosedPositions} Closed
              </Text>
            </Flex>
          ) : null}
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
            setNumberOfVisiblePositions(positionEarnings.length)
          }}
          style={{
            gap: '4px',
            alignItems: 'center',
            padding: 0,
            height: '36px',
          }}
        >
          <Eye size={16} />
          <span>
            <Trans>View All</Trans> ({positionEarnings.length - numberOfVisiblePositions})
          </span>
        </ButtonLight>
      )}
    </Flex>
  )
}

export default Positions
