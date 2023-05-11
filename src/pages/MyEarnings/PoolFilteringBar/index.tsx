import { Trans } from '@lingui/macro'
import { useRef } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import NotificationIcon from 'components/Icons/NotificationIcon'
import SubscribeNotificationButton from 'components/SubscribeButton'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import ClosedPositionsToggle from 'pages/MyEarnings/PoolFilteringBar/ClosedPositionsToggle'
import SearchInput from 'pages/MyEarnings/PoolFilteringBar/SearchInput'

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
  const inputRef = useRef<HTMLInputElement>(null)

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
      <Flex
        sx={{
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          flexWrap: 'nowrap',
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
      <Flex
        sx={{
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'nowrap',
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

        <ClosedPositionsToggle />

        <SearchInput />

        <SubscribeNotificationButton trackingEvent={undefined} />
      </Flex>
    </Flex>
  )
}

export default PoolFilteringBar
