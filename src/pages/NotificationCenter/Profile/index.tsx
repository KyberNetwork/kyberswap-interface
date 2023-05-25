import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { LogOut, Save } from 'react-feather'
import { useParams } from 'react-router'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useUpdateProfileMutation } from 'services/identity'
import styled, { css } from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { NotificationType } from 'components/Announcement/type'
import Avatar from 'components/Avatar'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import FileInput from 'components/FileInput'
import { Input } from 'components/Input'
import { useValidateEmail } from 'components/SubscribeButton/NotificationPreference'
import InputEmail from 'components/SubscribeButton/NotificationPreference/InputEmail'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useUploadImageToCloud } from 'hooks/social'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import WarningSignMessage from 'pages/NotificationCenter/Profile/WarningSignMessage'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import VerifyCodeModal from 'pages/Verify/VerifyCodeModal'
import { useNotify } from 'state/application/hooks'
import {
  KEY_GUEST_DEFAULT,
  useCacheProfile,
  useRefreshProfile,
  useSessionInfo,
  useSignedWallet,
} from 'state/authen/hooks'
import { shortenAddress } from 'utils'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px 24px;
  gap: 20px;
  max-width: 630px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: center;
    max-width: 100%;
  `}
`

const Label = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
`

const AVATAR_SIZE = '120px'
const AvatarWrapper = styled.div`
  border-radius: 100%;
  padding: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  width: ${AVATAR_SIZE};
  height: ${AVATAR_SIZE};
  display: flex;
  align-items: center;
  justify-content: center;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const LeftColum = styled(Column)`
  gap: 20px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

const StyledAddressInput = styled(AddressInput)`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  height: 42px;
`

const FormWrapper = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column-reverse;
    align-items: center;
    width: 100%; 
    gap: 0px;
  `}
`
const ActionsWrapper = styled.div`
  display: flex;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
  `}
`

const shareButtonStyle = css`
  width: 120px;
  height: 36px;
  font-size: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 45%;
    width: 164px;
  `}
`
const ButtonLogout = styled(ButtonOutlined)`
  ${shareButtonStyle}
`
const ButtonSave = styled(ButtonPrimary)`
  ${shareButtonStyle}
`

export default function Profile() {
  const theme = useTheme()
  const { walletAddress: walletParam } = useParams()
  const { chainId, account } = useActiveWeb3React()
  const { formatUserInfo, isLogin } = useSessionInfo()
  const { inputEmail, onChangeEmail, errorColor, hasErrorInput } = useValidateEmail(formatUserInfo?.email)
  const [nickname, setNickName] = useState('')
  const { signOut } = useLogin()
  const [signedWallet] = useSignedWallet()
  const { getCacheProfile } = useCacheProfile()
  const navigate = useNavigate()

  const [file, setFile] = useState<File>()
  const [previewImage, setPreviewImage] = useState<string>()

  const isCurrentWallet = signedWallet && signedWallet?.toLowerCase() === walletParam?.toLowerCase()
  const selectedProfile = useMemo(() => {
    if (isCurrentWallet) {
      return formatUserInfo
    }
    return getCacheProfile(walletParam || KEY_GUEST_DEFAULT, !walletParam)
  }, [isCurrentWallet, formatUserInfo, getCacheProfile, walletParam])

  useEffect(() => {
    onChangeEmail(selectedProfile?.email ?? '')
    setNickName(selectedProfile?.nickname || '')
    setPreviewImage(selectedProfile?.avatarUrl)
  }, [selectedProfile?.email, selectedProfile?.nickname, selectedProfile?.avatarUrl, onChangeEmail])

  // todo
  // useEffect(() => {
  //   if (!isLogin) {
  //     navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.GUEST_PROFILE}`)
  //     return
  //   }
  //   if (walletParam && walletParam.toLowerCase() !== account?.toLowerCase())
  //     navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}/${account}`)
  // }, [formatUserInfo?.identityId, account, navigate, walletParam, isLogin])

  const [isShowVerify, setIsShowVerify] = useState(false)
  const showVerifyModal = () => {
    setIsShowVerify(true)
  }
  const onDismissVerifyModal = () => {
    setIsShowVerify(false)
  }

  const handleFileChange = (imgUrl: string, file: File) => {
    setFile(file)
    setPreviewImage(imgUrl)
  }

  const [requestSaveProfile] = useUpdateProfileMutation()
  const refreshProfile = useRefreshProfile()
  const notify = useNotify()
  const uploadFile = useUploadImageToCloud()
  const saveProfile = async () => {
    try {
      let avatarURL
      if (file) {
        avatarURL = await uploadFile(file)
      }
      await requestSaveProfile({
        nickname,
        avatarURL,
      }).unwrap()
      await refreshProfile(!isLogin)
      notify({
        type: NotificationType.SUCCESS,
        title: t`Profile updated`,
        summary: t`Your profile have been successfully updated`,
      })
      setFile(undefined)
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Profile updated failed`,
        summary: t`Error occur, please try again`,
      })
    }
  }

  const displayAvatar = previewImage || selectedProfile?.avatarUrl
  const isVerifiedEmail = isCurrentWallet ? selectedProfile?.email && inputEmail === selectedProfile?.email : true
  const displayWallet = (walletParam ? walletParam : '') || account || '' // todo combine all var to 1 hook
  const isNeedSignIn = Boolean(
    !walletParam
      ? signedWallet
      : (signedWallet && signedWallet?.toLowerCase() !== walletParam?.toLowerCase()) || (walletParam && !signedWallet),
  )
  const hasChangeProfile = inputEmail !== selectedProfile?.email || file || nickname !== selectedProfile?.nickname

  return (
    <Wrapper>
      <Text fontSize={'24px'} fontWeight={'500'}>
        <Trans>Profile Details</Trans>
      </Text>
      {isNeedSignIn && <WarningSignMessage walletAddress={walletParam} guest={!walletParam} />}
      <FormWrapper>
        <LeftColum>
          <FormGroup>
            <Label>
              <Trans>User Name</Trans>
            </Label>
            <Input
              disabled={isNeedSignIn}
              maxLength={50}
              value={nickname}
              onChange={e => setNickName(e.target.value)}
              placeholder="Your nickname"
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <Trans>Email Address</Trans>
            </Label>
            <InputEmail
              hasError={hasErrorInput}
              disabled={isNeedSignIn}
              showVerifyModal={showVerifyModal}
              errorColor={errorColor}
              onChange={onChangeEmail}
              value={inputEmail}
              isVerifiedEmail={!!isVerifiedEmail}
            />
          </FormGroup>

          {displayWallet && (
            <FormGroup>
              <Label>
                <Trans>Wallet Address</Trans>
              </Label>
              <StyledAddressInput
                style={{ color: theme.subText, cursor: 'pointer' }}
                disabled
                value={shortenAddress(chainId, displayWallet, 17, false)}
                icon={<CopyHelper toCopy={displayWallet} style={{ color: theme.subText }} />}
              />
            </FormGroup>
          )}

          <ActionsWrapper>
            {walletParam && (
              <ButtonLogout
                onClick={() => {
                  signOut(walletParam)
                  navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PROFILE}`)
                }}
              >
                <LogOut size={16} style={{ marginRight: '4px' }} />
                Log Out
              </ButtonLogout>
            )}
            <ButtonSave onClick={saveProfile} disabled={isNeedSignIn || !hasChangeProfile}>
              <Save size={16} style={{ marginRight: '4px' }} />
              Save
            </ButtonSave>
          </ActionsWrapper>
        </LeftColum>

        <FormGroup style={{ width: AVATAR_SIZE }}>
          <Label style={{ textAlign: 'center' }}>
            <Trans>Profile Picture</Trans>
          </Label>
          <FileInput onImgChange={handleFileChange} image>
            <AvatarWrapper>
              <Avatar url={displayAvatar} size={84} color={theme.subText} />
            </AvatarWrapper>
          </FileInput>
        </FormGroup>
      </FormWrapper>
      <VerifyCodeModal
        isOpen={isShowVerify}
        onDismiss={onDismissVerifyModal}
        email={inputEmail}
        onVerifySuccess={onDismissVerifyModal}
      />
    </Wrapper>
  )
}
