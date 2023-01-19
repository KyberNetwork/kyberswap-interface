import { Trans } from '@lingui/macro'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Row from 'components/Row'
import SubscribeNotificationButton from 'components/SubscribeButton'
import { Z_INDEXS } from 'constants/styles'
import { ApplicationModal } from 'state/application/actions'
import {
  useActivePopups,
  useRemoveAllPopup,
  useRemovePopup,
  useToggleModal,
  useToggleNotificationCenter,
} from 'state/application/hooks'

import PopupItem from './PopupItem'

const FixedPopupColumn = styled.div`
  position: fixed;
  top: 108px;
  right: 1rem;
  z-index: ${Z_INDEXS.POPUP_NOTIFICATION};
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    left: 0;
    right: 0;
    top: 80px;
    align-items: center;
  `};
`

const ActionWrapper = styled.div`
  gap: 10px;
  justify-content: flex-end;
  display: flex;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-right: 16px;
  `};
`

const ActionButton = styled(ButtonEmpty)`
  background-color: ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  border-radius: 30px;
  padding: 4px 10px;
  width: fit-content;
  border-radius: 30px;
  font-size: 10px;
`

const Overlay = styled.div`
  /* background-color: ${({ theme }) => theme.background}; */
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: red;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 40.1%, rgba(0, 0, 0, 0.8) 100%);
`

const MAX_NOTIFICATION = 4

export default function Popups() {
  const activePopups = useActivePopups()
  const clearAll = useRemoveAllPopup()
  const toggleNotificationCenter = useToggleNotificationCenter()

  // todo check mobile, dark mode, check noti thuong hay noti kia
  const totalNotification = activePopups.length
  if (!totalNotification) return null
  return (
    <FixedPopupColumn>
      <ActionWrapper>
        {totalNotification >= MAX_NOTIFICATION && (
          <ActionButton onClick={toggleNotificationCenter}>
            <Trans>See All</Trans>
          </ActionButton>
        )}
        {totalNotification > 1 && (
          <ActionButton onClick={clearAll}>
            <Trans>Clear All</Trans>
          </ActionButton>
        )}
      </ActionWrapper>

      {activePopups.slice(0, MAX_NOTIFICATION).map(item => (
        <PopupItem
          key={item.key}
          popupType={item.popupType}
          content={item.content}
          popKey={item.key}
          removeAfterMs={item.removeAfterMs}
        />
      ))}

      {totalNotification >= MAX_NOTIFICATION && <Overlay />}
    </FixedPopupColumn>
  )
}
