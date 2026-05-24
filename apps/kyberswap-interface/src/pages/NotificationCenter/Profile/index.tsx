import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { LogOut, Save } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia, usePrevious } from 'react-use'
import { useUpdateProfileMutation } from 'services/identity'

import { AddressInput } from 'components/AddressInputPanel'
import { NotificationType } from 'components/Announcement/type'
import CheckBox from 'components/CheckBox'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Input from 'components/Input'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useUploadImageToCloud } from 'hooks/social'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { useValidateEmail } from 'pages/NotificationCenter/NotificationPreference'
import InputEmailWithVerification from 'pages/NotificationCenter/NotificationPreference/InputEmail'
import AvatarEdit from 'pages/NotificationCenter/Profile/AvatarEdit'
import ExportAccountButton from 'pages/NotificationCenter/Profile/ExportAccountButton'
import WarningSignMessage from 'pages/NotificationCenter/Profile/WarningSignMessage'
import { ButtonLogout, ButtonSave } from 'pages/NotificationCenter/Profile/buttons'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsKeepCurrentProfile, useProfileInfo, useRefreshProfile, useSignedAccountInfo } from 'state/profile/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

const AVATAR_SIZE = isMobile ? '90px' : '120px'

const leftColumnClass = 'gap-7 w-[420px] max-sm:w-full'
const formGroupClass = 'flex flex-col gap-3'
const labelClass = 'text-sm text-subText'

const getCacheDataDefault = () =>
  JSON.parse(
    JSON.stringify({
      nickname: '',
      file: undefined,
      avatar: '',
      email: '',
    }),
  )

export default function Profile() {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { chainId } = useActiveWeb3React()
  const { userInfo } = useSessionInfo()

  const { inputEmail, onChangeEmail, errorInput } = useValidateEmail(userInfo?.email)
  const [isShowVerify, setIsShowVerify] = useState(false)
  const showVerifyModal = () => {
    setIsShowVerify(true)
  }
  const onDismissVerifyModal = () => {
    setIsShowVerify(false)
  }

  const [nickname, setNickName] = useState('')
  const { signOut } = useLogin()
  const navigate = useNavigate()
  const { isSignInEth, signedAccount, isSigInGuest, isSignInEmail } = useSignedAccountInfo()
  const { totalGuest } = useProfileInfo()
  const canSignOut = !isSigInGuest || (isSigInGuest && totalGuest > 1)

  const [file, setFile] = useState<File>()
  const [previewImage, setPreviewImage] = useState<string>()
  const cacheData = useRef<{ nickname: string; file: File | undefined; avatar: string; email: string }>(
    getCacheDataDefault(),
  )

  const onChangeNickname = useCallback((value: string) => {
    setNickName(value)
    cacheData.current.nickname = value
  }, [])

  const onChangeEmailWrapp = useCallback(
    (value: string) => {
      onChangeEmail(value)
      cacheData.current.email = value
    },
    [onChangeEmail],
  )

  const prevIdentity = usePrevious(userInfo?.identityId)
  useEffect(() => {
    if (prevIdentity && prevIdentity !== userInfo?.identityId) {
      cacheData.current = getCacheDataDefault()
    }
    const { file, nickname, avatar, email } = cacheData.current
    onChangeEmail(email || userInfo?.email || '')
    setNickName(nickname || userInfo?.nickname || '')
    setPreviewImage(avatar || userInfo?.avatarUrl)
    file && setFile(file)
  }, [userInfo, onChangeEmail, prevIdentity])

  const handleFileChange = (imgUrl: string, file: File) => {
    setFile(file)
    setPreviewImage(imgUrl)
    cacheData.current.file = file
    cacheData.current.avatar = imgUrl
  }

  const [requestSaveProfile] = useUpdateProfileMutation()
  const refreshProfile = useRefreshProfile()
  const notify = useNotify()
  const uploadFile = useUploadImageToCloud()
  const [loading, setLoading] = useState(false)
  const saveProfile = async () => {
    if (loading) return
    try {
      setLoading(true)
      let avatarURL
      if (file) {
        avatarURL = await uploadFile(file)
      }
      await requestSaveProfile({
        nickname,
        avatarURL,
      }).unwrap()
      await refreshProfile()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Profile updated`,
        summary: t`Your profile has been successfully updated`,
      })
      cacheData.current.file = undefined
      cacheData.current.avatar = ''
      setFile(undefined)
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Profile updated failed`,
        summary: t`Error occur, please try again`,
      })
    }
    setLoading(false)
  }

  const displayAvatar = previewImage || userInfo?.avatarUrl
  const isVerifiedEmail = userInfo?.email && inputEmail === userInfo?.email

  const hasChangeProfile = file || (userInfo?.nickname && !nickname ? false : nickname !== userInfo?.nickname)
  const disableBtnSave = loading || !hasChangeProfile

  const [isKeepCurrentProfile, toggleKeepCurrentProfile] = useIsKeepCurrentProfile()

  return (
    <div className="flex flex-col gap-5 px-6 py-[30px] max-sm:max-w-full max-sm:items-center">
      {!isMobile && (
        <span className="text-2xl font-medium">
          <Trans>Profile Details</Trans>
        </span>
      )}
      <div className="flex w-full flex-col items-start justify-between gap-[30px] max-sm:items-center max-sm:gap-5">
        <WarningSignMessage />
        {signedAccount && isSignInEth && (
          <Column className={leftColumnClass}>
            <div className={formGroupClass}>
              <label className={labelClass}>
                <Trans>Wallet Address</Trans>
              </label>
              <AddressInput
                className="h-[42px] rounded-[20px] border border-border"
                style={{ color: theme.subText, cursor: 'pointer' }}
                disabled
                value={shortenAddress(chainId, signedAccount, 17, false)}
                icon={<CopyHelper toCopy={signedAccount} className="text-subText" />}
              />
            </div>

            <div className={formGroupClass}>
              <div className="flex items-start gap-1.5">
                <CheckBox
                  id="keep-profile"
                  borderStyle
                  style={{ width: 15, height: 15 }}
                  onChange={toggleKeepCurrentProfile}
                  checked={isKeepCurrentProfile}
                />
                <Column gap="6px">
                  <label htmlFor="keep-profile" className="text-sm font-medium text-text">
                    <Trans>Keep Current Profile</Trans>
                  </label>
                  <span className="text-xs text-subText">
                    <Trans>Keep this profile active whenever you switch wallets.</Trans>
                  </span>
                </Column>
              </div>
            </div>
          </Column>
        )}

        <div className="w-full border-b border-border" />

        <div className="flex justify-start gap-5 max-sm:w-full max-sm:flex-col-reverse max-sm:items-center max-sm:gap-3">
          <Column className={leftColumnClass}>
            <div className={formGroupClass}>
              <label className={labelClass}>
                <Trans>Username (Optional)</Trans>
              </label>
              <Input
                className="text-text"
                maxLength={50}
                value={nickname}
                onChange={e => onChangeNickname(e.target.value)}
                placeholder={t`Your nickname`}
              />
            </div>

            <div className={formGroupClass}>
              <label className={`${labelClass} w-fit border-b border-dotted`}>
                <MouseoverTooltip
                  text={t`If you wish to receive notifications from KyberSwap on your trades, liquidity positions and more, you can provide your email!`}
                  placement="top"
                >
                  <Trans>Email Address (Optional)</Trans>
                </MouseoverTooltip>
              </label>
              <InputEmailWithVerification
                style={{ color: theme.text }}
                hasError={!!errorInput}
                showVerifyModal={showVerifyModal}
                onChange={onChangeEmailWrapp}
                value={inputEmail}
                isVerifiedEmail={!!isVerifiedEmail}
                isShowVerify={isShowVerify}
                onDismissVerifyModal={onDismissVerifyModal}
                disabled={isSignInEmail}
              />
            </div>
          </Column>

          <div className={formGroupClass} style={{ width: isMobile ? '120px' : AVATAR_SIZE, alignItems: 'center' }}>
            <label className={`${labelClass} text-center`}>
              <Trans>Profile Picture</Trans>
            </label>
            <AvatarEdit avatar={displayAvatar} handleFileChange={handleFileChange} size={AVATAR_SIZE} />
          </div>
        </div>

        <div className="flex gap-5 max-sm:justify-between max-sm:gap-3">
          <ButtonSave onClick={saveProfile} disabled={disableBtnSave}>
            <Save size={16} style={{ marginRight: '4px' }} />
            {loading ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
          </ButtonSave>
          {isSigInGuest && <ExportAccountButton />}
          {canSignOut && (
            <ButtonLogout
              onClick={() => {
                signOut(signedAccount, isSigInGuest)
                navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PROFILE}`)
              }}
            >
              <LogOut size={16} style={{ marginRight: '4px' }} />
              <Trans>Sign Out</Trans>
            </ButtonLogout>
          )}
        </div>
      </div>
    </div>
  )
}
