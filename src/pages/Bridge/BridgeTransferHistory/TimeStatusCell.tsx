import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { FULL_DATE_FORMAT } from 'pages/Bridge/consts'

export const formatTimeBridge = (timestamp: number | string | undefined) =>
  timestamp ? dayjs(timestamp).format(FULL_DATE_FORMAT) : ''

type Props = {
  timestamp?: number | ''
}
const TimeStatusCell: React.FC<Props> = ({ timestamp }) => {
  const dateString = formatTimeBridge(timestamp)
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
    </Flex>
  )
}

export default TimeStatusCell
