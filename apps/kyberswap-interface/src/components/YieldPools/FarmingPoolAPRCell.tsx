import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const APRTooltipContent = ({
  poolAPR,
  farmAPR,
  farmV2APR = 0,
}: {
  poolAPR: number
  farmAPR: number
  farmV2APR?: number
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const maxFarmAPR = farmAPR > farmV2APR ? farmAPR : farmV2APR
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        background: theme.tableHeader,
        gap: '8px',
        width: upToSmall ? '300px' : 'fit-content',
      }}
    >
      {(!!farmAPR || !!farmV2APR) && (
        <>
          <Text as="span" fontSize={'14px'}>
            Total APR:{' '}
            <Text as="span" color={theme.text} fontWeight={500}>
              {formatDisplayNumber((poolAPR + maxFarmAPR) / 100, { style: 'percent', fractionDigits: 2 })}
            </Text>
          </Text>
          <Box
            sx={{
              width: '100%',
              borderBottom: `1px solid ${theme.border}`,
            }}
          ></Box>
        </>
      )}

      <Flex
        sx={{
          flexDirection: 'column',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        <Text as="span">
          Pool APR:{' '}
          <Text as="span" color={theme.text} fontWeight={500}>
            {formatDisplayNumber(poolAPR / 100, { style: 'percent', fractionDigits: 2 })}
          </Text>
        </Text>
        <Text
          as="span"
          fontStyle="italic"
          sx={{
            whiteSpace: upToSmall ? 'wrap' : 'nowrap',
          }}
        >
          <Trans>Estimated return from trading fees if you participate in the pool.</Trans>
        </Text>
      </Flex>

      {!!maxFarmAPR && (
        <Flex
          sx={{
            flexDirection: 'column',
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          <Text as="span" color={theme.warning}>
            Farm APR:{' '}
            <Text as="span" fontWeight={500}>
              {formatDisplayNumber(maxFarmAPR / 100, { style: 'percent', fractionDigits: 2 })}
            </Text>
          </Text>
          <Text
            as="span"
            fontStyle="italic"
            sx={{
              whiteSpace: upToSmall ? 'wrap' : 'nowrap',
            }}
          >
            <Trans>Estimated return from additional rewards if you also participate in the farm.</Trans>
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

export const ClassicFarmingPoolAPRCell = ({ poolAPR }: { poolAPR: number }) => {
  const theme = useTheme()
  const farmAPR = 0

  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      <Text as="span">{formatDisplayNumber((poolAPR + farmAPR) / 100, { style: 'percent', fractionDigits: 2 })}</Text>
      <MouseoverTooltip width="fit-content" text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPR} />}>
        <MoneyBag size={16} color={theme.apr} />
      </MouseoverTooltip>
    </Flex>
  )
}
