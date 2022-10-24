import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Flex, Text } from 'rebass'

import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'

import StatusBadge from './StatusBadge'

dayjs.extend(utc)

type Props = {
  timestamp?: number | ''
  status: MultichainTransferStatus
}
const TimeStatusCell: React.FC<Props> = ({ timestamp, status }) => {
  const dateString = timestamp ? dayjs.utc(timestamp).local().format('DD MMM YYYY') : ''
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
      <Text
        as="span"
        sx={{
          whiteSpace: 'nowrap',
        }}
      >
        {dateString || t`Unknown`}
      </Text>
      <StatusBadge status={status} iconOnly />
    </Flex>
  )
}

export default TimeStatusCell
