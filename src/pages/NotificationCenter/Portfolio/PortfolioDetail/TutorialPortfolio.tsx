import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import { CSSProperties } from 'styled-components'

import { TutorialKeys } from 'components/Tutorial/TutorialSwap'
import TutorialModal from 'components/TutorialModal'
import useTheme from 'hooks/useTheme'

const textStyle: CSSProperties = {
  height: isMobile ? '35vh' : '168px',
}

const Step1 = () => {
  const theme = useTheme()
  return (
    <Trans>
      We are thrilled to introduce you to{' '}
      <Text as="span" color={theme.text}>
        My Portfolio
      </Text>{' '}
      feature, designed to help you track your investments and stay on top of your financial goals. With this tool, you
      can easily monitor your portfolio&apos;s performance and make informed decisions about your investments.
      <br /> To help you get started, we recommend watching our tutorial, which will guide you through the process of
      setting up and using our portfolio feature. This tutorial will provide you with all the information you need to
      get the most out of this powerful tool.
    </Trans>
  )
}

const Step4 = () => {
  return (
    <Trans>
      Here are some useful pointers to optimize your portfolio management:
      <ul>
        <li>Use the search bar to search for address you&apos;d like to explore and add to create a portfolio.</li>
        <li>Share your portfolio with different visual charts!</li>
        <li>Manage your portfolio by keeping track of token prices by setting up price alerts.</li>
        <li>.Access KyberAI with supported tokens</li>
      </ul>
      If you wish to view this guide again, you can enable it from the settings. Maximize your returns and minimize your
      risks with KyberSwap smart portfolio management!
    </Trans>
  )
}

const steps = [
  {
    text: <Step1 />,
    image: '',
    textStyle,
  },
  {
    text: t`Make sure to connect and sign in with your wallet to get the full experience on Portfolio Management. In this section, we will go through the steps to set up your portfolio. We will cover the basics of creating a portfolio and bundle multiple wallets together`,
    image: '',
    textStyle,
  },
  {
    text: t`Click on the dropdown box to switch between portfolios. Share your portfolio with your friends by selecting the Share icon. Choose from different visual charts and send it as a thumbnail`,
    image: '',
    textStyle,
  },
  {
    text: t`Track and manage all your assets in one place with the Portfolio Management Dashboard on KyberSwap. The Dashboard’s Visual Charts offers a comprehensive overview of your holdings and defi-related activities, along with advanced filter and analytics options for selected wallets and portfolio across various protocols and chains supported by KyberSwap. You can now easily keep track of your assets and stay informed about your portfolio's performance`,
    image: '',
    textStyle,
  },
  { text: <Step4 />, image: '', textStyle },
]

export default function TutorialPortfolio() {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen(v => !v), [])

  useEffect(() => {
    if (!localStorage.getItem(TutorialKeys.SHOWED_PORTFOLIO_GUIDE)) {
      // auto show for first time all user
      toggle()
      localStorage.setItem(TutorialKeys.SHOWED_PORTFOLIO_GUIDE, '1')
    }
  }, [toggle])

  return <TutorialModal isOpen={isOpen} toggle={toggle} steps={steps} title={t`Welcome to My Portfolio`} />
}
