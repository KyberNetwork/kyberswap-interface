import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { BridgeTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'

import StatusBadge from './StatusBadge'

type Props = {
  dateString: string // should be in YYYY/MM/DD format
  status: BridgeTransferStatus
}
const TimeStatusCell: React.FC<Props> = ({ dateString, status }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        color: theme.subText,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {dateString ? (
        <Text
          as="span"
          sx={{
            display: 'inline-block',
            marginRight: '6px',
          }}
        >
          {dateString.slice(0, 10)}
        </Text>
      ) : (
        <Text as="span">{t`Unknown`}</Text>
      )}

      <StatusBadge status={status} iconOnly />
    </Flex>
  )
}

export default TimeStatusCell
