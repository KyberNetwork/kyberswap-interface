import { ChainId } from '@kyberswap/ks-sdk-core'
import { Pool } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { Eye, Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import useTheme from 'hooks/useTheme'
import SinglePosition from 'pages/MyEarnings/ElasticPools/SinglePosition'
import ViewEarningOrPositionButton from 'pages/MyEarnings/PoolFilteringBar/ViewEarningOrPositionButton'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'

const TitleWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    align-items: initial;
    justify-content: initial;
  `}
`

const ListPositions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, 360px);
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  `}
`

type Props = {
  chainId: ChainId
  positionEarnings: ElasticPositionEarningWithDetails[]
  pool: Pool | undefined
  pendingFees: { [id: string]: [string, string] }
  tokenPrices: { [id: string]: number }
}
const Positions: React.FC<Props> = ({ positionEarnings, chainId, pool, pendingFees, tokenPrices }) => {
  const [isViewEarnings, setViewEarnings] = useState(false)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToXXL = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXL}px)`)

  const [numberOfVisiblePositions, setNumberOfVisiblePositions] = useState(1)

  const [numOfActivePositions, numOfInactivePositions, numOfClosedPositions] = useMemo(() => {
    const nClosed = positionEarnings.filter(pos => !pos.liquidity || pos.liquidity === '0').length
    const nActive = positionEarnings.filter(pos => {
      const isNotClosed = pos.liquidity && pos.liquidity !== '0'
      const isActive = Number(pos.tickLower) <= Number(pos.pool.tick) && Number(pos.pool.tick) < Number(pos.tickUpper)

      return isNotClosed && isActive
    }).length

    return [nActive, positionEarnings.length - nClosed - nActive, nClosed]
  }, [positionEarnings])

  useEffect(() => {
    let newNumberOfVisiblePositions = 1
    if (upToMedium) {
      newNumberOfVisiblePositions = 3
    }

    if (upToXXL) {
      newNumberOfVisiblePositions = 4
    }

    setNumberOfVisiblePositions(existingValue => {
      if (existingValue < newNumberOfVisiblePositions) {
        return newNumberOfVisiblePositions
      }

      return existingValue
    })
  }, [upToMedium, upToXXL])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <TitleWrapper>
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
            alignItems: 'center',
            gap: '12px 16px',
            flex: '1 0 auto',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <ViewEarningOrPositionButton isViewEarnings={isViewEarnings} setViewEarnings={setViewEarnings} />
          <PositionStats
            numOfActivePositions={numOfActivePositions}
            numOfInactivePositions={numOfInactivePositions}
            numOfClosedPositions={numOfClosedPositions}
          />
        </Flex>
      </TitleWrapper>

      <ListPositions>
        {positionEarnings.slice(0, numberOfVisiblePositions).map(positionEarning => (
          <SinglePosition
            chainId={chainId}
            key={positionEarning.id}
            positionEarning={positionEarning}
            pool={pool}
            pendingFee={pendingFees[positionEarning.id]}
            tokenPrices={tokenPrices}
            isInitiallyViewEarnings={isViewEarnings}
          />
        ))}
      </ListPositions>

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

function PositionStats({
  numOfActivePositions,
  numOfInactivePositions,
  numOfClosedPositions,
}: {
  numOfActivePositions: number
  numOfInactivePositions: number
  numOfClosedPositions: number
}) {
  const theme = useTheme()
  const shouldShowClosedPositions = useAppSelector(state => state.myEarnings.shouldShowClosedPositions)

  return (
    <Flex
      sx={{
        gap: '12px',
      }}
    >
      <Flex
        sx={{
          gap: '4px',
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
          <Info size={10} color={theme.primary} style={{ minWidth: '24px' }} />
        </Flex>
        <Text
          fontSize={14}
          fontWeight="500"
          width="max-content"
          as="span"
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          {numOfActivePositions} Active
        </Text>
      </Flex>

      {numOfInactivePositions ? (
        <Flex
          sx={{
            gap: '4px',
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
            fontSize={14}
            fontWeight="500"
            width="max-content"
            sx={{
              whiteSpace: 'nowrap',
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
              flex: '0 0 16px',
              height: '16px',
              borderRadius: '999px',
              justifyContent: 'center',
              alignItems: 'center',
              background: rgba(theme.red, 0.3),
            }}
          >
            <Info size={10} color={theme.red} />
          </Flex>

          <Flex
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              flex: '1 0 auto',
            }}
          >
            {numOfClosedPositions} Closed
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

export default Positions
