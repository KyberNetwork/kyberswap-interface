import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import EarnLayout from 'pages/Earns/components/EarnLayout'

const MyVaults = () => {
  const theme = useTheme()

  return (
    <EarnLayout>
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        style={{ gap: '16px' }}
      >
        <Text fontSize={28} fontWeight={500}>
          {t`My Vaults`}
        </Text>
        <Text fontSize={16} color={theme.subText}>
          {t`Coming soon...`}
        </Text>
      </Flex>
    </EarnLayout>
  )
}

export default MyVaults
