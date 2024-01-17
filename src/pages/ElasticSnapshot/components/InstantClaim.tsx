import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

export default function InstantClaim() {
  const theme = useTheme()
  return (
    <Flex flexDirection="column">
      <Text fontSize={20} fontWeight="500">
        <Trans>Available assets for claiming</Trans>
      </Text>

      <Flex
        flexDirection="column"
        padding="12px 20px"
        justifyContent="space-between"
        marginTop="1rem"
        width="180px"
        sx={{ gap: '16px', borderRadius: '12px' }}
        backgroundColor="rgba(0,0,0,0.64)"
      >
        <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
          <Trans>Total Amount (USD)</Trans>
        </Text>
        <Flex sx={{ gap: '1rem' }} alignItems="flex-end">
          <Text fontWeight="500" fontSize={20}>
            {format(10000000)}
          </Text>
          <Text
            sx={{ fontSize: '14px', cursor: 'pointer' }}
            fontWeight="500"
            role="button"
            color={theme.primary}
            mb="2px"
          >
            <Trans>Details</Trans>
          </Text>
        </Flex>
      </Flex>

      <Text marginTop="1rem" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>Total Amount includes assets that KyberSwap has recovered or rescued under Category 3 & 5</Trans>
      </Text>
      <Text marginTop="8px" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>
          Your assets are spread across various networks. Kindly choose the relevant network and proceed with the
          claiming process.
        </Trans>
      </Text>
    </Flex>
  )
}
