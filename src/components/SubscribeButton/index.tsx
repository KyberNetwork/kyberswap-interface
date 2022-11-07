import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode } from 'react'
import { BellOff } from 'react-feather'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { Spinner } from 'components/Header/Polling'
import NotificationIcon from 'components/Icons/NotificationIcon'
import NotificationModal from 'components/SubscribeButton/NotificationModal'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { NOTIFICATION_TOPICS } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { useNotificationModalToggle } from 'state/application/hooks'
import { checkChrome } from 'utils/checkChrome'

import { ButtonOutlined, ButtonPrimary } from '../Button'
import { MouseoverTooltipDesktopOnly } from '../Tooltip'

const cssSubscribeBtnSmall = (isDisabled: boolean, theme: DefaultTheme) => css`
  width: 36px;
  min-width: 36px;
  padding: 6px;
  background: ${isDisabled ? theme.buttonGray : rgba(theme.primary, 0.2)};
  color: ${isDisabled ? theme.border : theme.primary};
`
const SubscribeBtn = styled(ButtonPrimary)<{ isDisabled: boolean; iconOnly?: boolean }>`
  overflow: hidden;
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  background: ${({ theme, isDisabled }) => (isDisabled ? theme.buttonGray : theme.primary)};
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.border : theme.textReverse)};
  ${({ iconOnly, isDisabled, theme }) => iconOnly && cssSubscribeBtnSmall(isDisabled, theme)};
  ${({ theme, isDisabled }) => theme.mediaWidth.upToExtraSmall`
   ${cssSubscribeBtnSmall(isDisabled, theme)}
  `}
`

const cssUnsubscribeBtnSmall = css`
  width: 36px;
  min-width: 36px;
  padding: 6px;
`
const UnSubscribeButton = styled(ButtonOutlined)<{ iconOnly?: boolean }>`
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  ${({ iconOnly }) => iconOnly && cssUnsubscribeBtnSmall};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
   ${cssUnsubscribeBtnSmall}
  `}
`

const StyledSpinner = styled(Spinner)<{ color: string }>`
  border-left: ${({ color }) => `1px solid  ${color}`};
  width: 16px;
  height: 16px;
  top: 0px;
  left: 0px;
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
  unsubscribeTooltip,
  subscribeModalContent,
  unsubscribeModalContent,
  topicId,
  iconOnly = false,
}: {
  subscribeTooltip?: ReactNode
  unsubscribeTooltip?: ReactNode
  subscribeModalContent?: ReactNode
  unsubscribeModalContent?: ReactNode
  topicId: number
  iconOnly?: boolean
}) {
  const theme = useTheme()
  const isChrome = checkChrome()
  const toggleSubscribeModal = useNotificationModalToggle()
  const { isLoading, hasSubscribedEmail } = useNotification(topicId)
  const { mixpanelHandler } = useMixpanel()

  const trackingSubScribe = () => {
    switch (topicId) {
      case NOTIFICATION_TOPICS.TRENDING_SOON:
        mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON)
        break
    }
  }

  const trackingUnSubScribe = () => {
    switch (topicId) {
      case NOTIFICATION_TOPICS.TRENDING_SOON:
        mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_UNSUBSCRIBE_TRENDING_SOON)
        break
    }
  }

  const onClickBtn = () => {
    hasSubscribedEmail ? trackingUnSubScribe() : trackingSubScribe()
    toggleSubscribeModal()
  }

  return (
    <>
      {hasSubscribedEmail ? (
        <MouseoverTooltipDesktopOnly text={unsubscribeTooltip} width="400px">
          <UnSubscribeButton disabled={!isChrome || isLoading} onClick={onClickBtn} iconOnly={iconOnly}>
            {isLoading ? <StyledSpinner color={theme.primary} /> : <BellOff color={theme.subText} size={18} />}

            <ButtonText color="primary" iconOnly={iconOnly}>
              <Trans>Unsubscribe</Trans>
            </ButtonText>
          </UnSubscribeButton>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <MouseoverTooltipDesktopOnly text={subscribeTooltip} width="400px">
          <SubscribeBtn isDisabled={!isChrome || isLoading} onClick={onClickBtn} iconOnly={iconOnly}>
            {isLoading ? <StyledSpinner color={theme.primary} /> : <NotificationIcon />}

            <ButtonText iconOnly={iconOnly}>
              <Trans>Subscribe</Trans>
            </ButtonText>
          </SubscribeBtn>
        </MouseoverTooltipDesktopOnly>
      )}
      <NotificationModal
        topicId={topicId}
        subscribeContent={subscribeModalContent}
        unsubscribeContent={unsubscribeModalContent}
      />
    </>
  )
}
