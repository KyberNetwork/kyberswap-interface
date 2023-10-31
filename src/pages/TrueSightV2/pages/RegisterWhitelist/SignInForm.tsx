import { LoginMethod } from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import DownloadWalletModal from 'components/DownloadWalletModal'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { useValidateEmail } from 'pages/NotificationCenter/NotificationPreference'
import { InputEmail } from 'pages/NotificationCenter/NotificationPreference/InputEmail'
import { OrDivider } from 'pages/Oauth/AuthForm'
import { ApplicationModal } from 'state/application/actions'
import { useOpenModal } from 'state/application/hooks'

const Wrapper = styled(Column)`
  width: 340px;
  gap: 16px;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   width: 100%;
  `};
`

export default function SignInForm() {
  const { signIn } = useLogin()
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const openDownloadWalletModal = useOpenModal(ApplicationModal.DOWNLOAD_WALLET)
  const { inputEmail, errorInput, onChangeEmail } = useValidateEmail('')
  return (
    <Wrapper style={{ flexDirection: account ? 'column-reverse' : 'column' }}>
      <Column gap="16px" width={'100%'}>
        <InputEmail
          value={inputEmail}
          hasError={!!errorInput}
          onChange={onChangeEmail}
          style={{ height: 36, width: '100%' }}
          isVerifiedEmail
        />
        <ButtonPrimary
          onClick={() => inputEmail && !errorInput && signIn({ loginMethod: LoginMethod.EMAIL, account: inputEmail })}
          height={'36px'}
        >
          <Trans>Sign-In with Email</Trans>
        </ButtonPrimary>
      </Column>
      <OrDivider />
      <Column gap="16px" width={'100%'} alignItems={'center'}>
        <ButtonLight onClick={() => signIn()} height={'36px'}>
          <Trans>Sign-In with Wallet</Trans>
        </ButtonLight>
        <Text color={theme.subText} fontSize={'12px'}>
          <Trans>
            Don&apos;t have a wallet?{' '}
            <Text as="span" sx={{ cursor: 'pointer' }} color={theme.primary} onClick={openDownloadWalletModal}>
              Get started here
            </Text>
          </Trans>
        </Text>
      </Column>
      <DownloadWalletModal />
    </Wrapper>
  )
}
