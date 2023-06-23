import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { ElasticPositionEarningWithDetails } from 'services/earning/types'

import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

type Props = {
  positionEarning: ElasticPositionEarningWithDetails
}
const PositionId: React.FC<Props> = ({ positionEarning }) => {
  const theme = useTheme()
  const isClosed = !positionEarning.liquidity || positionEarning.liquidity === '0'
  const isActive =
    Number(positionEarning.tickLower) <= Number(positionEarning.pool.tick) &&
    Number(positionEarning.pool.tick) < Number(positionEarning.tickUpper)

  const color = isClosed ? theme.red : isActive ? theme.primary : theme.warning

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Text
        sx={{
          color,
          fontWeight: 500,
          fontSize: '16px',
          lineHeight: '20px',
        }}
      >
        #{positionEarning.id}
      </Text>

      <MouseoverTooltip
        text={
          isClosed ? (
            <Trans>Your position has 0 liquidity, and is not earning fees</Trans>
          ) : isActive ? (
            <Trans>The price of this pool is within your selected range. Your position is currently earning fees</Trans>
          ) : (
            <Trans>The price of this pool is out of your selected range. Your position is not earning fees</Trans>
          )
        }
        placement="top"
      >
        <Flex
          sx={{
            width: '24px',
            height: '24px',
            borderRadius: '999px',
            justifyContent: 'center',
            alignItems: 'center',
            background: rgba(color, 0.3),
          }}
        >
          <Info size={16} color={color} />
        </Flex>
      </MouseoverTooltip>
    </Flex>
  )
}

export default PositionId
