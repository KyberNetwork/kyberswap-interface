import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

const EarningsTab = () => {
  const theme = useTheme()

  return (
    <Text as="div" color={theme.subText} fontSize={14}>
      Earnings content will be updated when the final data and design are ready.
    </Text>
  )
}

export default EarningsTab
