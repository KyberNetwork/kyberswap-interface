import { Trans } from '@lingui/macro'
import { Text } from 'rebass'

import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import Column from 'components/Column'
import useTheme from 'hooks/useTheme'

export default function NoData() {
  const theme = useTheme()
  return (
    <Column justifyContent="center" alignItems={'center'} color={theme.subText} fontSize={'12px'} gap="8px" flex={1}>
      <NoDataIcon />
      <Text fontSize={'14px'}>
        <Trans>No data found</Trans>
      </Text>
    </Column>
  )
}
