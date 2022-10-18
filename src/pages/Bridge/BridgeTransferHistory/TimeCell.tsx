import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

dayjs.extend(utc)

type Props = {
  timestamp?: number | ''
}

const fullFormat = 'DD MMM YYYY HH:mm'
const dateFormat = 'DD MMM YYYY'

const TimeCell: React.FC<Props> = ({ timestamp }) => {
  const timeString = timestamp ? dayjs.utc(timestamp).local().format(fullFormat) : ''
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
      {timeString ? (
        <>
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
              {timeString.slice(0, dateFormat.length)}
            </Text>
          </Text>

          <Text as="span">{timeString.slice(dateFormat.length + 1)}</Text>
        </>
      ) : (
        <Text as="span">{t`Unknown`}</Text>
      )}
    </Flex>
  )
}

export default TimeCell
