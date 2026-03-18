import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

const AnalyticsTab = () => {
  const theme = useTheme()

  return (
    <Text as="div" color={theme.subText} fontSize={14}>
      Analytics content will be updated when the final data and design are ready.
    </Text>
  )
}

export default AnalyticsTab
