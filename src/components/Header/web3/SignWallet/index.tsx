import { useMedia } from 'react-use'
import styled, { css } from 'styled-components'

import Avatar from 'components/Avatar'
import ProfileContent from 'components/Header/web3/SignWallet/ProfileContent'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useCacheProfile } from 'state/authen/hooks'
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
  const { cacheProfile } = useCacheProfile()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const isOpen = useModalOpen(ApplicationModal.SWITCH_PROFILE_POPUP)
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)
  const profile = cacheProfile
  const theme = useTheme()
  const profileIcon = (
    <Avatar
      url={profile?.avatarUrl}
      size={34}
      onClick={toggleModal}
      color={theme.subText}
      style={{ cursor: 'pointer' }}
    />
  )
  return (
    <StyledMenu>
      {isMobile ? (
        <>
          {profileIcon}
          <Modal isOpen={isOpen} onDismiss={toggleModal}>
            <ProfileContent />
          </Modal>
        </>
      ) : (
        <MenuFlyout trigger={profileIcon} customStyle={browserCustomStyle} isOpen={isOpen} toggle={toggleModal}>
          <ProfileContent />
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
