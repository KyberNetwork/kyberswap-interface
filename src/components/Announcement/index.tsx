import { useCallback, useEffect, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import styled, { css } from 'styled-components'

import AnnouncementView from 'components/Announcement/AnnoucementView'
import { formatNumberOfUnread, getListAnnouncement, getListInbox } from 'components/Announcement/helper'
import { Announcement } from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal, useToggleNotificationCenter } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  position: relative;
  outline: none;
  background-color: transparent;
  :hover {
    cursor: pointer;
  }

  ${({ active }) =>
    active
      ? css`
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const Badge = styled.div`
  border-radius: 16px;
  position: absolute;
  top: -6px;
  right: -16px;
  background-color: ${({ theme }) => theme.primary};
  padding: 2px 4px 1px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
`

const browserCustomStyle = css`
  padding: 0;
`

export default function Annoucement() {
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
  const node = useRef<HTMLDivElement>(null)

  const open = useModalOpen(ApplicationModal.NOTIFICATION_CENTER)
  const toggle = useToggleNotificationCenter()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [inboxes, setInbox] = useState<Announcement[]>([])
  const [numberOfUnreadInbox, setNumberOfUnreadInbox] = useState(0)
  const [numberOfUnreadGeneral, setNumberOfUnreadGeneral] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      await Promise.allSettled([getListAnnouncement(), account ? getListInbox() : Promise.resolve([])])
      setNumberOfUnreadGeneral(0)
      setAnnouncements(
        Array.from({ length: 10 }, (x, y) => ({
          isRead: Math.random() < 0.5,
          id: y,
          title: Math.random() + '',
          time: Date.now(),
        })),
      )
      setNumberOfUnreadInbox(0)
      setInbox(
        Array.from({ length: 10 }, (x, y) => ({
          isRead: Math.random() < 0.5,
          id: y,
          title: Math.random() + '',
          time: Date.now(),
        })),
      )
    } catch (e) {
      console.error('get Announcement Error', e)
    }
  }, [account])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const props = {
    numberOfUnreadInbox,
    numberOfUnreadGeneral,
    announcements,
    inboxes,
    refreshAnnouncement: fetchData,
  }

  const numberOfUnread = numberOfUnreadInbox + numberOfUnreadGeneral

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton active={open || numberOfUnread > 0} onClick={toggle} aria-label="Notifications">
        <NotificationIcon />
        {numberOfUnread > 0 && <Badge>{formatNumberOfUnread(numberOfUnread)}</Badge>}
      </StyledMenuButton>

      {isMobile ? (
        <Modal isOpen={open} onDismiss={toggle} minHeight={80}>
          <AnnouncementView {...props} />
        </Modal>
      ) : (
        <MenuFlyout browserCustomStyle={browserCustomStyle} node={node} isOpen={open} toggle={toggle}>
          <AnnouncementView {...props} />
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
