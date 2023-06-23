import { Trans } from '@lingui/macro'
import { ChevronUp } from 'react-feather'
import { useDispatch } from 'react-redux'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import SubscribeNotificationButton from 'components/SubscribeButton'
import useTheme from 'hooks/useTheme'
import ClosedPositionsToggle from 'pages/MyEarnings/PoolFilteringBar/ClosedPositionsToggle'
import SearchInput from 'pages/MyEarnings/PoolFilteringBar/SearchInput'
import ViewEarningOrPositionButton from 'pages/MyEarnings/PoolFilteringBar/ViewEarningOrPositionButton'
import { useAppSelector } from 'state/hooks'
import { collapseAllPools, expandAllPools } from 'state/myEarnings/actions'
import { MEDIA_WIDTHS } from 'theme'

const ViewEarningOrPositionButtonForSmallScreens = styled(ViewEarningOrPositionButton)`
  flex: 1 1 100%;
`

const ExpandCollapseAll: React.FC<{ iconOnly?: boolean }> = ({ iconOnly = false }) => {
  const dispatch = useDispatch()
  const shouldExpandAllPools = useAppSelector(state => state.myEarnings.shouldExpandAllPools)
  const theme = useTheme()

  if (iconOnly) {
    return (
      <ButtonOutlined
        style={{
          flex: '0 0 36px',
          height: '36px',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          borderRadius: '12px',
        }}
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
            flex: '0 0 20px',
            height: '20px',
            transition: 'all 150ms linear',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ChevronUp
            size={20}
            strokeWidth={2}
            color={theme.subText}
            style={{
              transition: 'all 150ms linear',
              transform: shouldExpandAllPools ? undefined : 'rotate(180deg)',
            }}
          />
        </Flex>
      </ButtonOutlined>
    )
  }

  return (
    <ButtonOutlined
      style={{
        flex: '0 0 130px',
        height: '36px',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '4px',
      }}
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
          flex: '0 0 20px',
          height: '20px',
          transition: 'all 150ms linear',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ChevronUp
          size={20}
          strokeWidth={2}
          color={theme.subText}
          style={{
            transition: 'all 150ms linear',
            transform: shouldExpandAllPools ? undefined : 'rotate(180deg)',
          }}
        />
      </Flex>
      {iconOnly || (
        <Text
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          {shouldExpandAllPools ? <Trans>Collapse All</Trans> : <Trans>Expand All</Trans>}
        </Text>
      )}
    </ButtonOutlined>
  )
}

const PoolFilteringBar = () => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Flex
          alignItems="center"
          justifyContent="space-between"
          sx={{
            gap: '16px',
          }}
        >
          <ExpandCollapseAll iconOnly />
          <ViewEarningOrPositionButtonForSmallScreens />
        </Flex>

        <Flex alignItems="center" justifyContent="space-between">
          <ClosedPositionsToggle />
          <SubscribeNotificationButton iconOnly={false} trackingEvent={undefined} />
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
      <Flex
        sx={{
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <ExpandCollapseAll />
        <ViewEarningOrPositionButton />
      </Flex>
      <Flex
        sx={{
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <ClosedPositionsToggle />

        <SearchInput />

        <SubscribeNotificationButton iconOnly={false} trackingEvent={undefined} />
      </Flex>
    </Flex>
  )
}

export default PoolFilteringBar
