import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useCreateWatchWalletMutation } from 'services/identity'
import styled, { css } from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'

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
  watchWallet = false,
}: {
  subscribeTooltip?: ReactNode
  iconOnly?: boolean
  watchWallet?: boolean
  trackingEvent?: MIXPANEL_TYPE
}) {
  const theme = useTheme()

  const { mixpanelHandler } = useMixpanel()
  const [requestWatchWallet] = useCreateWatchWalletMutation()
  const { account } = useActiveWeb3React()
  const notify = useNotify()

  const navigate = useNavigate()
  // const { showNotificationModal } = useNotification()
  const showNotificationModal = useCallback(() => {
    navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PREFERENCE}`)
  }, [navigate]) // todo remove content popup subscribe topic if unused

  const addToWatchList = useCallback(async () => {
    if (!account) return
    try {
      await requestWatchWallet({ walletAddress: account }).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Add to Watch List Success`,
        summary: t`You have successfully added this wallet to Watch List`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Add to Watch List Failed`,
        summary: t`Error occur, please try again`,
      })
    }
  }, [requestWatchWallet, account, notify])

  const onClickBtn = () => {
    watchWallet ? addToWatchList() : showNotificationModal()
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
          {watchWallet ? <Trans>Add to Watch List</Trans> : <Trans>Subscribe</Trans>}
        </ButtonText>
      </SubscribeBtn>
    </MouseoverTooltipDesktopOnly>
  )
}
