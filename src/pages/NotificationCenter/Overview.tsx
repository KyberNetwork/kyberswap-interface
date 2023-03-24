import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import NotificationPreference from 'components/SubscribeButton/NotificationPreference'
import useTheme from 'hooks/useTheme'

const StyledPreference = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: unset;
  `}
`

export default function Overview() {
  const theme = useTheme()
  return (
    <StyledPreference>
      <NotificationPreference
        isInNotificationCenter
        isOpen={true}
        header={
          <Text fontWeight={'500'} color={theme.text} fontSize="14px">
            <Trans>Email Notification</Trans>
          </Text>
        }
      />
    </StyledPreference>
  )
}
