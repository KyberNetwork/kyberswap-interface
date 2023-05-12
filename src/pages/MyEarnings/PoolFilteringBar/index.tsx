import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import NotificationIcon from 'components/Icons/NotificationIcon'
import SubscribeNotificationButton from 'components/SubscribeButton'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import ClosedPositionsToggle from 'pages/MyEarnings/PoolFilteringBar/ClosedPositionsToggle'
import SearchInput from 'pages/MyEarnings/PoolFilteringBar/SearchInput'
import { MEDIA_WIDTHS } from 'theme'

const ExpandAllButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

const AnotherSubscribeButton = () => {
  const theme = useTheme()

  return (
    <ButtonPrimary
      style={{
        height: '36px',
        width: 'fit-content',
        flex: '0 0 fit-content',
        gap: '6px',
        flexWrap: 'nowrap',
      }}
    >
      <NotificationIcon size={16} color={theme.textReverse} />
      <Trans>Subscribe</Trans>
    </ButtonPrimary>
  )
}

const PoolFilteringBar = () => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const renderExpandAll = () => {
    return (
      <Flex
        sx={{
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'nowrap',
          cursor: 'pointer',
          color: theme.subText,
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        <Flex
          sx={{
            flex: '0 0 16px',
            height: '16px',
            transition: 'all 150ms linear',
            background: theme.subText,
            borderRadius: '999px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ChevronDown size={12} strokeWidth={2} color={theme.buttonBlack} />
        </Flex>
        <Text
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          <Trans>Expand All</Trans>
        </Text>
      </Flex>
    )
  }

  const renderViewEarningsToggle = () => {
    return (
      <Flex
        sx={{
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'nowrap',
          cursor: 'pointer',
          color: theme.subText,
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        <Text
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          View Earnings
        </Text>
        <Toggle id="toggle-view-earnings" isActive={true} toggle={() => false} />
      </Flex>
    )
  }

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Flex alignItems="center" justifyContent="space-between">
          {renderExpandAll()}
          {renderViewEarningsToggle()}
        </Flex>

        <Flex alignItems="center" justifyContent="space-between">
          <ClosedPositionsToggle />
          <SubscribeNotificationButton trackingEvent={undefined} />
        </Flex>

        <SearchInput />
      </Flex>
    )
  }

  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        fontWeight: 500,
        fontSize: '14px',
        lineHeight: '20px',
        color: theme.subText,
      }}
    >
      {renderExpandAll()}
      <Flex
        sx={{
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {renderViewEarningsToggle()}

        <ClosedPositionsToggle />

        <SearchInput />

        <SubscribeNotificationButton trackingEvent={undefined} />
      </Flex>
    </Flex>
  )
}

export default PoolFilteringBar
