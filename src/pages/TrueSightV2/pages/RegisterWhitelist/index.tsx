import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useRequestWhiteListMutation } from 'services/kyberAISubscription'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import SubscribeForm from 'pages/TrueSightV2/pages/RegisterWhitelist/SubscribeForm'
import WaitListForm from 'pages/TrueSightV2/pages/RegisterWhitelist/WaitListForm'
import VerifyCodeModal from 'pages/Verify/VerifyCodeModal'
import { useWalletModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

const ConnectWalletButton = styled(ButtonPrimary)`
  height: 36px;
  width: 236px;
`

export default function RegisterWhitelist({ showForm = true }: { showForm?: boolean }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { isLogin } = useSessionInfo()

  const { isWhiteList, isWaitList } = useIsWhiteListKyberAI()

  const [verifyModalState, setVerifyModalState] = useState({
    isOpen: false,
    email: '',
    referredByCode: '',
    showVerifySuccess: false,
  })

  const showVerify = (email: string, referredByCode: string, showVerifySuccess: boolean) => {
    setVerifyModalState({ isOpen: true, referredByCode, email, showVerifySuccess })
  }

  const onDismiss = () => setVerifyModalState(state => ({ ...state, isOpen: false }))
  const [requestWaitList] = useRequestWhiteListMutation()

  const onVerifySuccess = async () => {
    return requestWaitList({ referredByCode: verifyModalState.referredByCode }).unwrap()
  }

  const renderVerifyModal = () => (
    <VerifyCodeModal
      {...verifyModalState}
      verifySuccessTitle={t`Successful Registered`}
      onVerifySuccess={onVerifySuccess}
      verifySuccessContent={
        <>
          <WaitListForm
            labelColor={theme.text}
            style={{ maxWidth: '100%' }}
            desc={
              <Text fontSize={14} color={theme.text} lineHeight={'16px'} style={{ lineHeight: '18px' }}>
                <Trans>
                  Thank you for registering your interest in the KyberAI Beta Program. Follow us on our social channels
                  to get regular updates on KyberAI
                </Trans>
              </Text>
            }
          />
          <ButtonPrimary height={'36px'} onClick={onDismiss}>
            <Trans>Awesome</Trans>
          </ButtonPrimary>
        </>
      }
      onDismiss={onDismiss}
    />
  )

  if (!account)
    return (
      <ConnectWalletButton onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ConnectWalletButton>
    )

  if (!isLogin)
    return (
      <ConnectWalletButton onClick={() => KyberOauth2.authenticate({ wallet_address: account ?? '' })}>
        <Trans>Sign-In to Continue</Trans>
      </ConnectWalletButton>
    )

  const btnGetStart = (
    <ConnectWalletButton onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}>
      <Trans>Get Started</Trans>
    </ConnectWalletButton>
  )

  if (!showForm) {
    if (isWhiteList) return btnGetStart
    return (
      <ConnectWalletButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <Trans>Join KyberAI Waitlist</Trans>
      </ConnectWalletButton>
    )
  }

  if (isWhiteList)
    return (
      <>
        {btnGetStart}
        <div style={{ width: '100%', border: `1px solid ${theme.border}` }} />
        <WaitListForm
          showRanking={false}
          desc={
            <Text fontSize={20} color={theme.text} fontWeight={'500'}>
              <Trans>Spread the word, and get rewarded for it! </Trans>
            </Text>
          }
          style={{ width: 'min(500px,100%)' }}
        />
      </>
    )
  if (isWaitList)
    return (
      <>
        <WaitListForm
          desc={
            <Text fontSize={12} color={theme.subText} lineHeight={'16px'}>
              <Trans>
                Hey! You&apos;re on our waitlist but your slot hasn&apos;t opened up yet. Jump the queue by referring
                others to KyberAI.
              </Trans>
            </Text>
          }
        />
        {renderVerifyModal()}
      </>
    )

  return (
    <>
      <SubscribeForm showVerify={showVerify} />
      {renderVerifyModal()}
    </>
  )
}
