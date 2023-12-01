import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Text } from 'rebass'
import { useGetMyPortfoliosQuery } from 'services/portfolio'
import styled, { CSSProperties } from 'styled-components'

import tutorial1 from 'assets/images/truesight-v2/tutorial_1.png'
import tutorial2 from 'assets/images/truesight-v2/tutorial_2.png'
import tutorial3 from 'assets/images/truesight-v2/tutorial_3.png'
import tutorial4 from 'assets/images/truesight-v2/tutorial_4.png'
import tutorial5 from 'assets/images/truesight-v2/tutorial_5.png'
import LocalLoader from 'components/LocalLoader'
import { TutorialKeys } from 'components/Tutorial/TutorialSwap'
import TutorialModal from 'components/TutorialModal'
import { useActiveWeb3React } from 'hooks'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import DisclaimerPortfolio from 'pages/NotificationCenter/Portfolio/Modals/Disclaimer'
import Overview from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Overview'
import PortfolioStat from 'pages/NotificationCenter/Portfolio/PortfolioDetail/PortfolioStat'
import { useNavigateToMyFirstPortfolio, useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/helpers'

import Header from './Header'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px 36px;
  gap: 24px;
  width: 100%;
  max-width: 1464px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
    padding: 20px 16px;
`};
`

const textStyle: CSSProperties = {
  height: '168px',
}
// todo update image
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
        <li>Access KyberAI with supported tokens.</li>
      </ul>
      If you wish to view this guide again, you can enable it from the settings. Maximize your returns and minimize your
      risks with KyberSwap smart portfolio management!
    </Trans>
  )
}

const steps = [
  {
    text: <Step1 />,
    image: tutorial1,
    textStyle,
    title: t`Welcome to My Portfolio`,
  },
  {
    text: t`Make sure to connect and sign in with your wallet to get the full experience on Portfolio Management. In this section, we will go through the steps to set up your portfolio. We will cover the basics of creating a portfolio and bundle multiple wallets together`,
    image: tutorial2,
    textStyle,
    title: t`Setting up your Portfolio`,
  },
  {
    text: t`Click on the dropdown box to switch between portfolios. Share your portfolio with your friends by selecting the Share icon. Choose from different visual charts and send it as a thumbnail`,
    image: tutorial3,
    textStyle,
    title: t`Switch between Portfolios`,
  },
  {
    text: t`Track and manage all your assets in one place with the Portfolio Management Dashboard on KyberSwap. The Dashboard’s Visual Charts offers a comprehensive overview of your holdings and defi-related activities, along with advanced filter and analytics options for selected wallets and portfolio across various protocols and chains supported by KyberSwap. You can now easily keep track of your assets and stay informed about your portfolio's performance`,
    image: tutorial4,
    textStyle,
    title: t`Explore (Dashboard, Visual Charts, Wallet)`,
  },
  { text: <Step4 />, image: tutorial5, textStyle, title: t`Tutorial - Tips` },
]

export default function PortfolioDetail() {
  const { account } = useActiveWeb3React()
  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const showOverview = !wallet && !portfolioId

  const { isLoading: loading, data } = useGetMyPortfoliosQuery()
  const isLoading = useShowLoadingAtLeastTime(loading, 300)
  const navigate = useNavigateToMyFirstPortfolio()
  const navigateToMyPortfolio = useCallback(() => navigate(data), [data, navigate])

  const [showTutorialState, setShowTutorial] = useState(!localStorage.getItem(TutorialKeys.SHOWED_PORTFOLIO_GUIDE))
  const showTutorial = showTutorialState && account
  const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem(TutorialKeys.SHOWED_PORTFOLIO_DISCLAIMER))

  const onDismissTutorial = useCallback(() => {
    setShowTutorial(false)
    localStorage.setItem(TutorialKeys.SHOWED_PORTFOLIO_GUIDE, '1')
    navigateToMyPortfolio()
  }, [navigateToMyPortfolio])

  const onConfirmDisclaimer = () => {
    setShowDisclaimer(false)
    localStorage.setItem(TutorialKeys.SHOWED_PORTFOLIO_DISCLAIMER, '1')
  }

  useEffect(() => {
    if (!showDisclaimer && !showTutorial && showOverview) navigateToMyPortfolio()
  }, [showDisclaimer, showTutorial, showOverview, navigateToMyPortfolio])

  return (
    <PageWrapper>
      <Header />
      {isLoading ? (
        <LocalLoader />
      ) : showOverview ? (
        <Overview />
      ) : (
        <PortfolioStat navigateToMyPortfolio={navigateToMyPortfolio} />
      )}
      {showDisclaimer ? (
        <DisclaimerPortfolio onConfirm={onConfirmDisclaimer} />
      ) : (
        <TutorialModal isOpen={!!showTutorial} onDismiss={onDismissTutorial} steps={steps} />
      )}
    </PageWrapper>
  )
}
