import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

export default function MoreInfo({ deadline, protocolFee }: { deadline: number; protocolFee: number }) {
  const theme = useTheme()
  const displayTime = dayjs(deadline * 1000).format('DD/MM/YYYY HH:mm:ss')

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
