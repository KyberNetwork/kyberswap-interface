import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import SignInForm from 'pages/TrueSightV2/pages/RegisterWhitelist/SignInForm'
import SubscribeForm from 'pages/TrueSightV2/pages/RegisterWhitelist/SubscribeForm'
import WaitListForm from 'pages/TrueSightV2/pages/RegisterWhitelist/WaitListForm'
import { useSessionInfo } from 'state/authen/hooks'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

const ConnectWalletButton = styled(ButtonLight)`
  height: 36px;
  width: 236px;
`

export default function RegisterWhitelist({ showForm = true }: { showForm?: boolean }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const { isLogin } = useSessionInfo()

  const { isWhiteList, isWaitList, loading: isCheckingPermission } = useIsWhiteListKyberAI()

  if (isCheckingPermission)
    return (
      <ConnectWalletButton disabled>
        <Trans>Checking data...</Trans>
      </ConnectWalletButton>
    )

  if (!isLogin) return <SignInForm />

  const btnGetStart = (
    <ConnectWalletButton
      onClick={() => {
        mixpanelHandler(MIXPANEL_TYPE.KYBERAI_GET_STARTED_CLICK)
        navigate(APP_PATHS.KYBERAI_RANKINGS)
      }}
    >
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
    )

  return <SubscribeForm />
}
