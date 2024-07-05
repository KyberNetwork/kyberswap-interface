import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'

export default function MyReferralDashboard() {
  const theme = useTheme()

  return (
    <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
      <Divider />

      <Flex padding="1rem" color={theme.subText} fontSize="12px" fontWeight="500">
        <Text flex={2}>TIME</Text>
        <Text flex={3}>REFEREES WALLET ADDRESSES</Text>
      </Flex>

      <Divider />
    </Box>
  )
}
