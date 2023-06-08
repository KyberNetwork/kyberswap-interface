import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { formatTimeBridge } from 'pages/Bridge/BridgeTransferHistory/TimeStatusCell'

type Props = {
  timestamp?: number | ''
}

const TimeCell: React.FC<Props> = ({ timestamp }) => {
  const dateString = formatTimeBridge(timestamp)

  const theme = useTheme()
  return (
    <Flex
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        color: theme.subText,
        justifyContent: 'space-between',
      }}
    >
      {dateString ? (
        <Text as="span">
          <Text
            as="span"
            sx={{
              display: 'inline-block',
              width: '70px',
              marginRight: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {dateString}
          </Text>
        </Text>
      ) : (
        <Text as="span">
          <Trans>Unknown</Trans>
        </Text>
      )}
    </Flex>
  )
}

export default TimeCell
