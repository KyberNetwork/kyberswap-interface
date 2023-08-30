import { Trans } from '@lingui/macro'
import { ReactNode, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import NotificationIcon from 'components/Icons/NotificationIcon'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'

import { ButtonPrimary } from '../Button'
import { MouseoverTooltipDesktopOnly } from '../Tooltip'

const cssSubscribeBtnSmall = (bgColor: string) => css`
  width: 36px;
  min-width: 36px;
  padding: 6px;
  background: ${bgColor};
  &:hover {
    background: ${bgColor};
  }
`
const SubscribeBtn = styled(ButtonPrimary)<{
  isDisabled?: boolean
  iconOnly?: boolean
  bgColor: string
}>`
  overflow: hidden;
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  background: ${({ bgColor }) => bgColor};
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.border : theme.textReverse)};
  &:hover {
    background: ${({ bgColor }) => bgColor};
  }
  ${({ iconOnly, bgColor }) => iconOnly && cssSubscribeBtnSmall(bgColor)};
  ${({ theme, bgColor, iconOnly }) =>
    iconOnly !== false &&
    theme.mediaWidth.upToExtraSmall`
   ${cssSubscribeBtnSmall(bgColor)}
  `}
`

const ButtonText = styled(Text)<{ iconOnly?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  margin-left: 6px !important;
  ${({ iconOnly }) => iconOnly && `display: none`};
  ${({ theme, iconOnly }) =>
    iconOnly !== false &&
    theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`
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
  trackingEvent?: MIXPANEL_TYPE
  onClick?: () => void
  topicId?: string
  style?: CSSProperties
}) {
  const theme = useTheme()

  const { mixpanelHandler } = useMixpanel()
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
        mixpanelHandler(trackingEvent)
      }, 100)
  }

  return (
    <MouseoverTooltipDesktopOnly text={subscribeTooltip} width="400px">
      <SubscribeBtn bgColor={theme.primary} onClick={onClickBtn} iconOnly={iconOnly} style={style}>
        <NotificationIcon size={16} />
        <ButtonText iconOnly={iconOnly}>
          {hasSubscribe ? <Trans>Unsubscribe</Trans> : <Trans>Subscribe</Trans>}
        </ButtonText>
      </SubscribeBtn>
    </MouseoverTooltipDesktopOnly>
  )
}
