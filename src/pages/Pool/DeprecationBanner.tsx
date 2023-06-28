import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { LinkStyledButton } from 'theme'

if (Date.now() > new Date('2023-08-12T00:00:00Z').getTime()) {
  console.warn('Remove DeprecationBanner')
}

const DeprecationBanner = () => {
  const theme = useTheme()
  return (
    <Flex
      width="100%"
      padding="12px 20px"
      flexDirection={'column'}
      sx={{
        border: `1px solid ${theme.border}`,
        background: theme.background,
        borderRadius: '24px',
        gap: '4px',
      }}
    >
      <Text
        sx={{
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        View your earnings & manage your liquidity positions through your new earnings dashboard! Access this dashboard
        anytime from<LinkStyledButton>My Earnings</LinkStyledButton>under the &apos;Earn&apos; section.
      </Text>
      <Text
        as="span"
        sx={{
          fontStyle: 'italic',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        Note: We will deprecate{' '}
        <Text
          as="span"
          sx={{
            color: theme.text,
          }}
        >
          My Pools
        </Text>{' '}
        by Aug 11.
      </Text>
    </Flex>
  )
}

export default DeprecationBanner
