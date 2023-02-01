import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import CenterPopup from 'components/Popups/CenterPopup'
import SnippetPopup from 'components/Popups/SnippetPopup'
import { Z_INDEXS } from 'constants/styles'
import { PopupType } from 'state/application/actions'
import {
  NotificationType,
  useActivePopups,
  useNotify,
  useRemoveAllPopup,
  useToggleNotificationCenter,
} from 'state/application/hooks'
import { PopupItemType } from 'state/application/reducer'
import { MEDIA_WIDTHS } from 'theme'

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
  const topRightPopups = useActivePopups()
  const clearAll = useRemoveAllPopup()
  const toggleNotificationCenter = useToggleNotificationCenter()
  const notify = useNotify()

  const [bottomLeftPopups, setBottomLeftPopups] = useState<PopupItemType[]>([])
  const [centerPopup, setCenterPopup] = useState<PopupItemType>()

  useEffect(() => {
    notify({ title: 'test', type: NotificationType.WARNING }, null)
  }, [])

  // todo check mobile, dark mode, check noti thuong hay noti kia

  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const totalTopRightPopup = topRightPopups.length
  // todo xem may thong baso chung chung slice roi sao nua ???
  return (
    <>
      {topRightPopups.length > 0 && (
        <FixedPopupColumn>
          <ActionWrapper>
            {totalTopRightPopup >= MAX_NOTIFICATION && (
              <ActionButton onClick={toggleNotificationCenter}>
                <Trans>See All</Trans>
              </ActionButton>
            )}
            {totalTopRightPopup > 1 && (
              <ActionButton onClick={clearAll}>
                <Trans>Clear All</Trans>
              </ActionButton>
            )}
          </ActionWrapper>

          {topRightPopups.slice(0, MAX_NOTIFICATION).map(item => (
            <PopupItem
              key={item.key}
              popupType={item.popupType}
              content={item.content}
              popKey={item.key}
              removeAfterMs={item.removeAfterMs}
            />
          ))}

          {totalTopRightPopup >= MAX_NOTIFICATION && <Overlay />}
        </FixedPopupColumn>
      )}
      {bottomLeftPopups.length > 0 && <SnippetPopup announcements={bottomLeftPopups} />}
      {centerPopup && <CenterPopup />}
    </>
  )
}
