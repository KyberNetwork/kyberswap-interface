import { Trans, t } from '@lingui/macro'
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
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ConnectedProfile, useAllProfileInfo, useSignedWalletInfo } from 'state/authen/hooks'
import getShortenAddress from 'utils/getShortenAddress'

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 320px;
  padding: 14px 20px;
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
  border-top: 1px solid ${({ theme }) => theme.border};
  margin-top: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 14px 24px;
  `}
`

const ProfileItemWrapper = styled(RowBetween)<{ active: boolean }>`
  padding: 10px 0px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 14px 24px;
  `}
  ${({ active }) =>
    active
      ? css`
          margin-bottom: 10px;
          padding-top: 0;
        `
      : css`
          border-bottom: none;
          border-radius: 8px;
          :hover {
            background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
          }
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
    if (guest) signInAnonymous()
    else signInEth(account)
    toggleModal()
  }

  const signOutBtn = !guest ? (
    <MouseoverTooltip text={t`Sign-out this account`} width="fit-content" placement="top">
      <LogOut
        color={theme.subText}
        size={16}
        onClick={e => {
          e?.stopPropagation()
          signOut(account)
          refreshProfile()
        }}
      />
    </MouseoverTooltip>
  ) : null

  return (
    <ProfileItemWrapper active={active} onClick={onClick}>
      <Row gap="16px" align="center">
        <Flex style={{ width: 64, minWidth: 64 }} justifyContent="center">
          <Avatar url={profile?.avatarUrl} size={active ? 64 : 32} color={active ? theme.text : theme.subText} />
        </Flex>
        <Column gap="8px">
          <Flex
            fontWeight={'500'}
            fontSize={'14px'}
            alignItems={'center'}
            style={{ gap: '8px' }}
            color={active ? theme.text : theme.subText}
          >
            {profile?.nickname} {signOutBtn}
          </Flex>
          <Text fontWeight={'500'} fontSize={active ? '14px' : '12px'} color={active ? theme.text : theme.subText}>
            {guest ? account : getShortenAddress(account)}
          </Text>
        </Column>
      </Row>
      <Row justify="flex-end" gap="18px" align="center">
        {(isSignedWallet(account) || (guest && isGuest)) && (
          <MouseoverTooltip text={t`Edit Profile Details`} width="fit-content" placement="top">
            <ButtonOutlined
              height={'36px'}
              onClick={e => {
                e?.stopPropagation()
                navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}`)
                toggleModal()
              }}
            >
              <TransactionSettingsIcon size={20} fill={theme.subText} />
              &nbsp;
              <Trans>Edit</Trans>
            </ButtonOutlined>
          </MouseoverTooltip>
        )}
      </Row>
    </ProfileItemWrapper>
  )
}
const ProfileContent = () => {
  const { signInEth, signOutAll } = useLogin()
  const { canSignInEth } = useSignedWalletInfo()
  const { profiles, refresh } = useAllProfileInfo()
  const totalSignedAccount = profiles.filter(e => !e.guest).length

  return (
    <ContentWrapper>
      <Column>
        {profiles.map(data => (
          <ProfileItem key={data.address} data={data} refreshProfile={refresh} />
        ))}
      </Column>
      <ActionWrapper>
        {canSignInEth && (
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
