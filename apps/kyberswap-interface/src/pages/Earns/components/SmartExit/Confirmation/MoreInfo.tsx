import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { FOREVER_EXPIRE_TIME } from 'pages/Earns/components/SmartExit/constants'
import { formatDisplayNumber } from 'utils/numbers'

export default function MoreInfo({
  deadline,
  protocolFee,
  maxGas,
}: {
  deadline: number
  protocolFee: number
  maxGas: number
}) {
  const theme = useTheme()
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const remainingSeconds = deadline - nowInSeconds
  // Consider "Forever" if remaining time is close to FOREVER_EXPIRE_TIME (within 1 day tolerance)
  const isForever = remainingSeconds >= FOREVER_EXPIRE_TIME - TIMES_IN_SECS.ONE_DAY
  const displayTime = isForever ? 'Forever' : dayjs(deadline * 1000).format('DD/MM/YYYY HH:mm:ss')

  return (
    <>
      <Flex justifyContent={'space-between'} mt="1rem">
        <Text color={theme.subText} fontSize={14}>
          <Trans>Platform Fee</Trans>
        </Text>
        <Text color={theme.text} fontSize={14}>
          {protocolFee}%
        </Text>
      </Flex>

      <Flex justifyContent={'space-between'} mt="1rem">
        <TextDashed
          color={theme.subText}
          fontSize={14}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 'fit-content',
          }}
        >
          <MouseoverTooltip
            placement="right"
            text={t`The actual gas cost will be deducted from your outputs when the order executes.`}
          >
            <Trans>Max Execution Gas</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <Text color={theme.text} fontSize={14}>
          {formatDisplayNumber(maxGas, { significantDigits: 4 })}%
        </Text>
      </Flex>

      <Flex justifyContent={'space-between'} mt="1rem">
        <TextDashed
          color={theme.subText}
          fontSize={14}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 'fit-content',
          }}
        >
          <MouseoverTooltip
            placement="right"
            text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
          >
            <Trans>Expires in</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <Text color={theme.text} fontSize={14}>
          {displayTime}
        </Text>
      </Flex>
    </>
  )
}
