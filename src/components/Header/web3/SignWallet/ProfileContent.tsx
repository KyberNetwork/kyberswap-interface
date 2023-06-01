import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { LogOut, UserPlus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Avatar from 'components/Avatar'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween } from 'components/Row'
import CardBackground from 'components/WalletPopup/AccountInfo/CardBackground'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ConnectedProfile, useAllProfileInfo, useSignedWalletInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { shortString } from 'utils/string'

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 320px;
  padding: 16px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 14px;
      gap: 8px;
  `}
`

const ListProfile = styled.div<{ hasData: boolean }>`
  padding: ${({ hasData }) => hasData && `12px 0`};
`

const ActionItem = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
  width: 100%;
  padding: 12px;
  :hover {
    background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  }
`

const ActionWrapper = styled.div<{ hasBorder: boolean }>`
  display: flex;
  padding: 12px 0px 0px 0px;
  flex-direction: column;
  justify-content: space-between;
  border-top: ${({ theme, hasBorder }) => hasBorder && `1px solid ${theme.border}`};
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 10px 14px;
  `}
`

const ProfileItemWrapper = styled(RowBetween)<{ active: boolean }>`
  position: relative;
  cursor: pointer;
  ${({ active }) =>
    active
      ? css`
          padding: 14px;
          flex-direction: column;
          gap: 16px;
          border-radius: 20px;
        `
      : css`
          padding: 10px 0px;
          border-bottom: none;
          border-radius: 8px;
          :hover {
            background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
          }
        `}
  ${({ theme, active }) => theme.mediaWidth.upToMedium`
     ${
       active
         ? css`
             padding: 16px 20px;
           `
         : css`
             padding: 10px 20px;
           `
     }}
      
  `}
`

const ProfileItem = ({
  data: { active, guest, address: account, profile },
  refreshProfile,
}: {
  data: ConnectedProfile
  refreshProfile: () => void
}) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)
  const { signIn, signInAnonymous, signOut } = useLogin()
  const { isSignedWallet, isGuest } = useSignedWalletInfo()

  const onClick = () => {
    if (active) return
    guest ? signInAnonymous() : signIn(account, true)
    toggleModal()
  }

  const signOutBtn = !guest ? (
    <LogOut
      style={{ marginRight: active || upToMedium ? 0 : '10px' }}
      color={active ? theme.text : theme.subText}
      size={16}
      onClick={e => {
        e?.stopPropagation()
        signOut(account)
        refreshProfile()
      }}
    />
  ) : null

  return (
    <ProfileItemWrapper active={active} onClick={onClick}>
      {active && <CardBackground noLogo />}
      <Row width={'100%'} style={{ zIndex: 1 }}>
        <Row gap={active ? '16px' : '12px'} align="center">
          <Flex style={{ width: 54, minWidth: 54 }} justifyContent="center">
            <Avatar url={profile?.avatarUrl} size={active ? 54 : 40} color={active ? theme.text : theme.subText} />
          </Flex>
          <Column gap="8px" minWidth={'unset'} flex={1}>
            {profile?.nickname && (
              <Text fontWeight={'bold'} fontSize={active ? '20px' : '16px'} color={active ? theme.text : theme.subText}>
                {shortString(profile?.nickname ?? '', 18)}
              </Text>
            )}
            <Text
              fontWeight={'500'}
              fontSize={active ? '16px' : profile?.nickname ? '12px' : '16px'}
              color={active ? theme.subText : theme.subText}
            >
              {guest ? account : getShortenAddress(account)}
            </Text>
          </Column>
          {active && signOutBtn}
        </Row>
        {!active && signOutBtn}
      </Row>
      {(isSignedWallet(account) || (guest && isGuest)) && (
        <Row width={'100%'}>
          <ButtonLight
            height={'36px'}
            style={{ flex: 1 }}
            onClick={e => {
              e?.stopPropagation()
              navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}`)
              toggleModal()
            }}
          >
            <TransactionSettingsIcon size={20} fill={theme.primary} />
            &nbsp;
            <Trans>Edit current account</Trans>
          </ButtonLight>
        </Row>
      )}
    </ProfileItemWrapper>
  )
}
const ProfileContent = () => {
  const { signIn, signOutAll } = useLogin()
  const { canSignInEth } = useSignedWalletInfo()
  const { profiles, refresh } = useAllProfileInfo()
  const { account: connectedWallet } = useActiveWeb3React()
  const totalSignedAccount = profiles.filter(e => !e.guest).length
  const listNotActive = profiles.slice(1)

  return (
    <ContentWrapper>
      <Column>
        <ProfileItem data={profiles[0]} refreshProfile={refresh} />
        <ListProfile hasData={!!listNotActive.length}>
          {listNotActive.map(data => (
            <ProfileItem key={data.address} data={data} refreshProfile={refresh} />
          ))}
        </ListProfile>
      </Column>
      <ActionWrapper hasBorder={profiles.length > 1}>
        {canSignInEth && !KyberOauth2.getConnectedEthAccounts().includes(connectedWallet?.toLowerCase() ?? '') && (
          <ActionItem onClick={() => signIn()}>
            <UserPlus size={18} /> <Trans>Add Account with current wallet</Trans>
          </ActionItem>
        )}
        {totalSignedAccount > 0 && (
          <ActionItem onClick={signOutAll}>
            <LogOut size={18} /> <Trans>Sign out of all accounts</Trans>
          </ActionItem>
        )}
      </ActionWrapper>
    </ContentWrapper>
  )
}
export default ProfileContent
