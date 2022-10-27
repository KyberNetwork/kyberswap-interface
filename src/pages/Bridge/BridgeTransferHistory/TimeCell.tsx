import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

import { FULL_DATE_FORMAT, ONLY_DATE_FORMAT } from '../consts'

type Props = {
  timestamp?: number | ''
}

const TimeCell: React.FC<Props> = ({ timestamp }) => {
  const timeString = timestamp ? dayjs.utc(timestamp).local().format(FULL_DATE_FORMAT) : ''
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
              {timeString.slice(0, ONLY_DATE_FORMAT.length)}
            </Text>
          </Text>

          <Text as="span">{timeString.slice(ONLY_DATE_FORMAT.length + 1)}</Text>
        </>
      ) : (
        <Text as="span">{t`Unknown`}</Text>
      )}
    </Flex>
  )
}

export default TimeCell
