import { Trans } from '@lingui/macro'
import { ChevronUp } from 'react-feather'
import { useDispatch } from 'react-redux'
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
import { useAppSelector } from 'state/hooks'
import { collapseAllPools, expandAllPools } from 'state/myEarnings/actions'
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

const ExpandCollapseAll = () => {
  const dispatch = useDispatch()
  const shouldExpandAllPools = useAppSelector(state => state.myEarnings.shouldExpandAllPools)
  const theme = useTheme()

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
        userSelect: 'none',
      }}
      role="button"
      onClick={() => {
        if (shouldExpandAllPools) {
          dispatch(collapseAllPools())
        } else {
          dispatch(expandAllPools())
        }
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
        <ChevronUp
          size={12}
          strokeWidth={2}
          color={theme.buttonBlack}
          style={{
            transition: 'all 150ms linear',
            transform: shouldExpandAllPools ? undefined : 'rotate(180deg)',
          }}
        />
      </Flex>
      <Text
        sx={{
          whiteSpace: 'nowrap',
        }}
      >
        {shouldExpandAllPools ? <Trans>Collapse All</Trans> : <Trans>Expand All</Trans>}
      </Text>
    </Flex>
  )
}

const PoolFilteringBar = () => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

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
          <ExpandCollapseAll />
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
      <ExpandCollapseAll />
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
