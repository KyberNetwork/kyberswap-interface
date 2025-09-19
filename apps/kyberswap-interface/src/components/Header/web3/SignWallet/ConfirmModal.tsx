import { LoginMethod } from '@kyberswap/oauth2'
import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { LogIn, X } from 'react-feather'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Loader from 'components/Loader'
import { ModalCenter } from 'components/Modal'
import { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { AppState } from 'state'
import { useSessionInfo, useSetConfirmChangeProfile } from 'state/authen/hooks'
import { useIsKeepCurrentProfile, useProfileInfo, useSignedAccountInfo } from 'state/profile/hooks'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'

const Wrapper = styled.div`
  padding: 24px;
  width: 100%;
  display: flex;
  gap: 20px;
  flex-direction: column;
`

const Highlight = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const ModalConfirmProfile: React.FC = () => {
  const theme = useTheme()

  const setConfirm = useSetConfirmChangeProfile()

  const [connectSuccess, setConnectSuccess] = useState(false)
  const { signIn } = useLogin()
  const { account } = useActiveWeb3React()
  const { pendingAuthentication } = useSessionInfo()
  const { signedAccount } = useSignedAccountInfo()
  const [, setKeepCurrentProfile] = useIsKeepCurrentProfile()
  const { getCacheProfile } = useProfileInfo()
  const navigate = useNavigate()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const isOpen =
    useSelector((state: AppState) => state.authen.showConfirmProfile) &&
    signedAccount?.toLowerCase?.() !== account?.toLowerCase?.()

  useEffect(() => {
    if (!isOpen)
      setTimeout(() => {
        setConnectSuccess(false)
      }, 300)
  }, [isOpen])

  const desiredProfile = getCacheProfile(account ?? '', false)
  const currentProfile = getCacheProfile(signedAccount ?? '', false)

  const desiredAccountExist = !!desiredProfile
  const desiredProfileName = desiredProfile?.nickname
  const currentProfileName = currentProfile?.nickname

  const hideModal = () => {
    setConfirm(false)
  }

  const onCancel = async () => {
    const isGuest = !desiredAccountExist
    await signIn({
      account: isGuest ? undefined : account,
      loginMethod: isGuest ? LoginMethod.ANONYMOUS : LoginMethod.ETH,
    })
    hideModal()
  }

  const onConfirm = (force?: boolean) => {
    if (connectSuccess || force) {
      hideModal()
      setKeepCurrentProfile()
    } else setConnectSuccess(true)
  }

  const onDismiss = () => onConfirm(true)
  const renderContent = () => {
    return (
      <Column gap="12px">
        <Text as="p" lineHeight={'20px'}>
          <Trans>
            You are connected to KyberSwap with wallet <Highlight>{getShortenAddress(account ?? '')}</Highlight> while
            your current profile <Highlight>{currentProfileName}</Highlight> was created by wallet{' '}
            <Highlight>{getShortenAddress(signedAccount ?? '')}</Highlight>. Do you wish to keep using
          </Trans>
          &nbsp;
          {currentProfileName ? (
            <Trans>
              profile <Highlight>{currentProfileName}</Highlight>
            </Trans>
          ) : (
            <Trans> this profile</Trans>
          )}
          &nbsp;
          <Trans>or switch to </Trans>{' '}
          {desiredAccountExist ? (
            <Trans>
              profile <Highlight> {desiredProfileName || getShortenAddress(account ?? '')}</Highlight>
            </Trans>
          ) : (
            <Trans>a guest profile</Trans>
          )}{' '}
          <Trans>instead?</Trans>
        </Text>
        {!desiredAccountExist && (
          <Text as="p" lineHeight={'20px'}>
            <Trans>
              Alternatively, you can sign-into a new profile using your wallet{' '}
              <Highlight>{getShortenAddress(account ?? '')}</Highlight>
            </Trans>
          </Text>
        )}
      </Column>
    )
  }

  const renderContentSuccess = () => {
    return (
      <Text as="p" lineHeight={'20px'}>
        <Trans>
          Since you have chosen to keep your current profile connected, we will keep it active whenever you switch
          wallets. If you ever wish to modify this setting, you can do so in your{' '}
          <Text
            as="span"
            sx={{ cursor: 'pointer' }}
            color={theme.primary}
            onClick={() => {
              navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PROFILE}`)
              onConfirm(true)
            }}
          >
            user profile
          </Text>
          .
        </Trans>
      </Text>
    )
  }

  return (
    <ModalCenter isOpen={isOpen} minHeight={false} maxWidth={isMobile ? '95vw' : 420} onDismiss={onDismiss}>
      <Wrapper>
        <RowBetween>
          <Text fontSize={20} fontWeight={400}>
            {!connectSuccess ? <Trans>Switch Profile?</Trans> : <Trans>Note</Trans>}
          </Text>
          <X cursor={'pointer'} color={theme.subText} onClick={onDismiss} />
        </RowBetween>

        <Text as="span" fontSize="14px" color={theme.subText}>
          {connectSuccess ? renderContentSuccess() : renderContent()}
        </Text>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {connectSuccess ? (
            <ButtonPrimary height={'36px'} onClick={() => onConfirm(true)}>
              <Trans>Awesome</Trans>
            </ButtonPrimary>
          ) : (
            <>
              <ButtonOutlined
                disabled={pendingAuthentication}
                borderRadius="24px"
                height="36px"
                flex="1 1 100%"
                onClick={onCancel}
              >
                {pendingAuthentication ? (
                  <>
                    <Loader size={'14px'} />
                    &nbsp; <Trans>Signing in...</Trans>
                  </>
                ) : desiredAccountExist ? (
                  <Trans>Switch Profile</Trans>
                ) : (
                  <Trans>Use Guest Profile</Trans>
                )}
              </ButtonOutlined>
              <ButtonPrimary
                disabled={pendingAuthentication}
                borderRadius="24px"
                height="36px"
                flex="1 1 100%"
                onClick={() => onConfirm(false)}
              >
                {isMobile ? <Trans>Keep Profile</Trans> : <Trans>Keep Current Profile</Trans>}
              </ButtonPrimary>
            </>
          )}
        </Flex>
        {!desiredAccountExist && !connectSuccess && (
          <ButtonEmpty
            disabled={pendingAuthentication}
            onClick={() => signIn({ account })}
            style={{
              color: theme.subText,
              display: 'flex',
              gap: '6px',
              padding: 0,
            }}
          >
            <LogIn size={16} />
            <Trans>Sign in with the connected wallet</Trans>
          </ButtonEmpty>
        )}
      </Wrapper>
    </ModalCenter>
  )
}
export default ModalConfirmProfile
