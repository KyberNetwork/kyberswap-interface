import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import LocalLoader from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'

export default function NoData({ isLoading, isEmpty, text }: { isLoading: boolean; isEmpty: boolean; text?: string }) {
  const theme = useTheme()
  // toast error
  if (isLoading) {
    return <LocalLoader />
  }

  if (isEmpty) {
    return (
      <Flex
        sx={{
          width: '100%',
          height: '180px', // to match the Loader's height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: theme.subText,
          gap: '16px',
        }}
      >
        <Info size={48} />
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
          }}
        >
          {text || <Trans>You haven&apos;t made any transfers yet</Trans>}
        </Text>
      </Flex>
    )
  }
  return null
}
