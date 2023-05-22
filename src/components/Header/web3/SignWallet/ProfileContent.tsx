import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans, t } from '@lingui/macro'
import { Download, Plus, Upload } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Column from 'components/Column'
import Profile from 'components/Icons/Profile'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useSignInETH } from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useNotify, useToggleModal } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import getShortenAddress from 'utils/getShortenAddress'

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const ActionWrapper = styled.div`
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  justify-content: space-between;
`

const ProfileItemWrapper = styled(RowBetween)<{ active: boolean }>`
  padding: 10px 20px;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

const ProfileItem = ({ account, guest, active }: { account: string; guest?: boolean; active: boolean }) => {
  const theme = useTheme()
  const { isLogin } = useSessionInfo()
  const { account: currentWallet } = useActiveWeb3React()
  const navigate = useNavigate()
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)
  const { signInEth } = useSignInETH()
  const notify = useNotify()

  const onClick = () => {
    if (guest && isLogin) {
      KyberOauth2.logout()
      toggleModal()
      return
    }
    if (account !== currentWallet?.toLowerCase()) {
      notify({
        type: NotificationType.WARNING,
        title: t`Warning`,
        summary: t`Please change your wallet to ${account} to sign-in`,
      })
      return
    }
    signInEth()
    toggleModal()
  }
  return (
    <ProfileItemWrapper active={active} onClick={onClick}>
      <Row gap="8px">
        <div>
          <Profile size={26} color={theme.primary} />
        </div>
        <Text fontWeight={'400'} fontSize={'14px'}>
          {guest ? account : getShortenAddress(account)}
        </Text>
      </Row>
      <Row justify="flex-end" gap="18px" align="center">
        {guest && (
          <MouseoverTooltip text={t`Export Profile`} width="fit-content" placement="top">
            <Download
              size={20}
              color={theme.subText}
              onClick={e => {
                e?.stopPropagation()
                alert('in dev')
                toggleModal()
              }}
            />
          </MouseoverTooltip>
        )}
        <MouseoverTooltip text={t`Edit Profile Details`} width="fit-content" placement="top">
          <TransactionSettingsIcon
            size={20}
            fill={theme.subText}
            onClick={e => {
              e?.stopPropagation()
              navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.GUEST_PROFILE}`)
              toggleModal()
            }}
          />
        </MouseoverTooltip>
      </Row>
    </ProfileItemWrapper>
  )
}
const ProfileContent = () => {
  const { isLogin } = useSessionInfo()
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const { signInEth } = useSignInETH()
  const toggleModal = useToggleModal(ApplicationModal.SWITCH_PROFILE_POPUP)

  const connectedAccounts = KyberOauth2.getConnectedEthAccounts()

  return (
    <ContentWrapper>
      <Column>
        {connectedAccounts.map(address => (
          <ProfileItem key={address} account={address} active={address === account?.toLowerCase()} />
        ))}
        <ProfileItem account={t`Guest`} guest active={!isLogin} />
      </Column>
      <ActionWrapper>
        <Flex
          color={theme.subText}
          alignItems={'center'}
          style={{ gap: '6px' }}
          onClick={signInEth}
          fontWeight={'400'}
          fontSize={'14px'}
        >
          <Plus size={20} /> <Trans>Add Account</Trans>
        </Flex>
        <Flex
          fontWeight={'400'}
          fontSize={'14px'}
          color={theme.subText}
          alignItems={'center'}
          style={{ gap: '6px' }}
          onClick={() => {
            alert('in dev')
            toggleModal()
          }}
        >
          <Upload size={19} /> <Trans>Import</Trans>
        </Flex>
      </ActionWrapper>
    </ContentWrapper>
  )
}
export default ProfileContent
