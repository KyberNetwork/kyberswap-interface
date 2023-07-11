import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import Avatar from 'components/Avatar'
import ModalConfirmProfile from 'components/Header/web3/SignWallet/ConfirmModal'
import ProfileContent from 'components/Header/web3/SignWallet/ProfileContent'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useProfileInfo } from 'state/profile/hooks'
import { MEDIA_WIDTHS } from 'theme'

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const browserCustomStyle = css`
  padding: 0;
  border-radius: 20px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

export default function SelectWallet() {
  const { profile } = useProfileInfo()
  const { pendingAuthentication } = useSessionInfo()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const isOpen = useModalOpen(ApplicationModal.SWITCH_PROFILE_POPUP)
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)
  const theme = useTheme()
  const profileIcon = (
    <Flex alignItems={'center'}>
      <Avatar
        url={profile?.avatarUrl}
        size={34}
        onClick={toggleModal}
        color={theme.subText}
        style={{ cursor: 'pointer' }}
      />
    </Flex>
  )

  const onClickProfile = () => {
    if (!isOpen && pendingAuthentication) return
    toggleModal()
  }
  return (
    <StyledMenu>
      {isMobile ? (
        <>
          {profileIcon}
          <Modal isOpen={isOpen} onDismiss={onClickProfile}>
            <ProfileContent toggleModal={toggleModal} />
          </Modal>
        </>
      ) : (
        <MenuFlyout trigger={profileIcon} customStyle={browserCustomStyle} isOpen={isOpen} toggle={onClickProfile}>
          <ProfileContent scroll toggleModal={toggleModal} />
        </MenuFlyout>
      )}
      <ModalConfirmProfile />
    </StyledMenu>
  )
}
