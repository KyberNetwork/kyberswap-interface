import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { LogOut, UserPlus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Avatar from 'components/Avatar'
import { ButtonOutlined } from 'components/Button'
import Column from 'components/Column'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ConnectedProfile, useAllProfileInfo, useSignedWalletInfo } from 'state/authen/hooks'
import getShortenAddress from 'utils/getShortenAddress'
import { shortString } from 'utils/string'

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 320px;
  padding: 14px 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 0;
  `}
`

const ListProfile = styled.div<{ hasData: boolean }>`
  padding: ${({ hasData }) => hasData && `10px 0`};
  border-top: ${({ theme }) => `1px solid ${theme.border}`};
  border-bottom: ${({ theme, hasData }) => hasData && `1px solid ${theme.border}`};
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 0px;
  `}
`

const ActionItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
  padding: 12px;
  :hover {
    background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  }
`

const ActionWrapper = styled.div`
  display: flex;
  padding: 12px 20px 0px 20px;
  flex-direction: column;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 10px 14px;
  `}
`

const ProfileItemWrapper = styled(RowBetween)<{ active: boolean }>`
  padding: 10px 0px;

  ${({ active }) =>
    active
      ? css`
          padding-top: 0;
          flex-direction: column;
          gap: 12px;
        `
      : css`
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
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)
  const { signInEth, signInAnonymous, signOut } = useLogin()
  const { isSignedWallet, isGuest } = useSignedWalletInfo()

  const onClick = () => {
    if (active) return
    if (guest) signInAnonymous()
    else signInEth(account)
    toggleModal()
  }

  const signOutBtn = !guest ? (
    <LogOut
      style={{ zIndex: 1, marginRight: '10px' }}
      color={theme.subText}
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
      <Row width={'100%'}>
        <Row gap="16px" align="center">
          <Flex style={{ width: 64, minWidth: 64 }} justifyContent="center">
            <Avatar url={profile?.avatarUrl} size={active ? 64 : 40} color={active ? theme.text : theme.subText} />
          </Flex>
          <Column gap="8px" minWidth={'unset'} flex={1}>
            {profile?.nickname && (
              <Text fontWeight={'bold'} fontSize={'14px'} color={active ? theme.primary : theme.subText}>
                {shortString(profile?.nickname ?? '', active ? 18 : 25)}
              </Text>
            )}
            <Text fontWeight={'500'} fontSize={active ? '14px' : '12px'} color={active ? theme.primary : theme.subText}>
              {guest ? account : getShortenAddress(account)}
            </Text>
          </Column>
          {active && <div>{signOutBtn}</div>}
        </Row>
        {!active && signOutBtn}
      </Row>
      {(isSignedWallet(account) || (guest && isGuest)) && (
        <Row width={'100%'}>
          <ButtonOutlined
            height={'36px'}
            style={{ flex: 1 }}
            onClick={e => {
              e?.stopPropagation()
              navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}`)
              toggleModal()
            }}
          >
            <TransactionSettingsIcon size={20} fill={theme.subText} />
            &nbsp;
            <Trans>Edit current account</Trans>
          </ButtonOutlined>
        </Row>
      )}
    </ProfileItemWrapper>
  )
}
const ProfileContent = () => {
  const { signInEth, signOutAll } = useLogin()
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
      <ActionWrapper>
        {canSignInEth && !KyberOauth2.getConnectedEthAccounts().includes(connectedWallet?.toLowerCase() ?? '') && (
          <ActionItem onClick={() => signInEth()}>
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
