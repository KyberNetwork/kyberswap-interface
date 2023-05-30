import { Trans } from '@lingui/macro'
import { ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import NotificationIcon from 'components/Icons/NotificationIcon'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

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
  ${({ theme, bgColor }) => theme.mediaWidth.upToExtraSmall`
   ${cssSubscribeBtnSmall(bgColor)}
  `}
`

const ButtonText = styled(Text)<{ iconOnly?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  margin-left: 6px !important;
  ${({ iconOnly }) => iconOnly && `display: none`};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`
export default function SubscribeNotificationButton({
  subscribeTooltip,
  iconOnly = false,
  trackingEvent,
}: {
  subscribeTooltip?: ReactNode
  iconOnly?: boolean
  trackingEvent?: MIXPANEL_TYPE
}) {
  const theme = useTheme()

  const { mixpanelHandler } = useMixpanel()

  const navigate = useNavigate()
  const showNotificationModal = useCallback(() => {
    navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PREFERENCE}`)
  }, [navigate])

  const onClickBtn = () => {
    showNotificationModal()
    if (trackingEvent)
      setTimeout(() => {
        mixpanelHandler(trackingEvent)
      }, 100)
  }

  return (
    <MouseoverTooltipDesktopOnly text={subscribeTooltip} width="400px">
      <SubscribeBtn bgColor={theme.primary} onClick={onClickBtn} iconOnly={iconOnly}>
        <NotificationIcon />
        <ButtonText iconOnly={iconOnly}>
          <Trans>Subscribe</Trans>
        </ButtonText>
      </SubscribeBtn>
    </MouseoverTooltipDesktopOnly>
  )
}
