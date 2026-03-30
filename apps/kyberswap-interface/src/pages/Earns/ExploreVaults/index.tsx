import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

const ExploreVaults = () => {
  const theme = useTheme()

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px" style={{ gap: '16px' }}>
      <Text fontSize={28} fontWeight={500}>
        {t`Explore Partner Vaults`}
      </Text>
      <Text fontSize={16} color={theme.subText}>
        {t`Coming soon...`}
      </Text>
    </Flex>
  )
}

export default ExploreVaults
