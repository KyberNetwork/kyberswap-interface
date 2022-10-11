import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

type Props = {
  timeString: string // should be in YYYY/MM/DD HH:mm format
}
const TimeCell: React.FC<Props> = ({ timeString }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        color: theme.subText,
      }}
    >
      {timeString ? (
        <Text as="span">
          <Text
            as="span"
            sx={{
              display: 'inline-block',
              width: '70px',
              marginRight: '6px',
            }}
          >
            {timeString.slice(0, 10)}
          </Text>
          <span>{timeString.slice(11)}</span>
        </Text>
      ) : (
        <Text as="span">{t`Unknown`}</Text>
      )}
    </Flex>
  )
}

export default TimeCell
