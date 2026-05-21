import { Trans } from '@lingui/macro'
import { CSSProperties, ReactNode, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'

import NotificationIcon from 'components/Icons/NotificationIcon'
import { APP_PATHS } from 'constants/index'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { cn } from 'utils/cn'

import { ButtonPrimary } from '../Button'
import { MouseoverTooltipDesktopOnly } from '../Tooltip'

export default function SubscribeNotificationButton({
  subscribeTooltip,
  iconOnly,
  trackingEvent,
  onClick,
  topicId,
  style,
}: {
  subscribeTooltip?: ReactNode
  iconOnly?: boolean
  trackingEvent?: TRACKING_EVENT_TYPE
  onClick?: () => void
  topicId?: string
  style?: CSSProperties
}) {
  const theme = useTheme()

  const { trackingHandler } = useTracking()
  const { topicGroups } = useNotification()
  const hasSubscribe = useMemo(() => {
    return topicId
      ? topicGroups.some(group =>
          group.topics.some(topic => topic.isSubscribed && String(topic.id) === String(topicId)),
        )
      : false
  }, [topicGroups, topicId])

  const navigate = useNavigate()
  const showNotificationModal = useCallback(() => {
    navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PREFERENCE}`)
  }, [navigate])

  const onClickBtn = () => {
    showNotificationModal()
    onClick?.()
    if (trackingEvent)
      setTimeout(() => {
        trackingHandler(trackingEvent)
      }, 100)
  }

  // iconOnly !== false means: when iconOnly is true OR undefined, collapse to icon on extra-small screens.
  const collapseOnXs = iconOnly !== false

  return (
    <MouseoverTooltipDesktopOnly text={subscribeTooltip} width="400px">
      <ButtonPrimary
        backgroundColor={theme.primary}
        onClick={onClickBtn}
        style={style}
        className={cn(
          // Original was 32px tall (h-8) + px-3/py-2; collapse modes only override width + padding.
          'h-8 w-fit overflow-hidden !px-3 !py-2 !text-textReverse hover:!bg-primary',
          iconOnly && '!w-9 !min-w-9 !p-1.5',
          collapseOnXs && 'max-xs:!w-9 max-xs:!min-w-9 max-xs:!p-1.5',
        )}
      >
        <NotificationIcon size={16} />
        <Text className={cn('ml-1.5 text-sm font-medium', iconOnly && 'hidden', collapseOnXs && 'max-xs:hidden')}>
          {hasSubscribe ? <Trans>Unsubscribe</Trans> : <Trans>Subscribe</Trans>}
        </Text>
      </ButtonPrimary>
    </MouseoverTooltipDesktopOnly>
  )
}
