import { t } from '@lingui/macro'
import { darken, lighten } from 'polished'
import { useMedia } from 'react-use'
import styled, { css } from 'styled-components'

import Avatar from 'components/Avatar'
import ProfileContent from 'components/Header/web3/SignWallet/ProfileContent'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

const Web3StatusGeneric = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.primary : theme.buttonGray)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.primary : theme.buttonGray)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.subText)};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ pending, theme }) =>
      pending ? darken(0.05, theme.primary) : lighten(0.05, theme.buttonGray)};
    border: 1px solid ${({ theme }) => theme.primary};
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.25rem 0 0.5rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`

const AccountElement = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 999px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  pointer-events: auto;
  height: 42px;
`

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
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

export default function SelectWallet() {
  const { chainId, account } = useActiveWeb3React()
  const { isLogin, formatUserInfo } = useSessionInfo()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const isOpen = useModalOpen(ApplicationModal.SWITCH_PROFILE_POPUP)
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)

  const profileIcon = (
    <Web3StatusConnected onClick={toggleModal}>
      <Avatar url={formatUserInfo?.avatarUrl} size={18} />
      {!isMobile && <Text>{isLogin ? shortenAddress(chainId, account ?? '') : t`Guest`}</Text>}
    </Web3StatusConnected>
  )
  if (!account) return null
  return (
    <AccountElement>
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
    </AccountElement>
  )
}
