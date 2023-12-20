import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { CSSProperties } from 'styled-components'

import tutorial1 from 'assets/images/truesight-v2/tutorial_1.png'
import tutorial2 from 'assets/images/truesight-v2/tutorial_2.png'
import tutorial3 from 'assets/images/truesight-v2/tutorial_3.png'
import tutorial4 from 'assets/images/truesight-v2/tutorial_4.png'
import tutorial6 from 'assets/images/truesight-v2/tutorial_6.png'
import ApeIcon from 'components/Icons/ApeIcon'
import TutorialModal from 'components/TutorialModal'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

const Step1 = () => {
  const theme = useTheme()
  return (
    <Trans>
      We&apos;re thrilled to have you onboard and can&apos;t wait for you to start exploring the world of trading
      powered by <span style={{ color: theme.text }}>KyberAI</span>. We&apos;ve created this short tutorial for you to
      highlight KyberAI&apos;s main features. Ready?
    </Trans>
  )
}

const textStyle: CSSProperties = {
  height: isMobile ? '35vh' : '202px',
}

const steps = [
  { image: tutorial1, text: <Step1 />, textStyle: { ...textStyle, height: 'auto' } },
  {
    image: tutorial2,
    textStyle,
    text: (
      <Trans>
        <p>
          Whether you&apos;re looking to identify new tokens to trade, or get alpha on a specific token, KyberAI has it
          all! KyberAI currently provides trading insights on <b>4000+ tokens</b> across <b>7 blockchains!</b>
        </p>{' '}
        <p>
          For traders who are in discovery mode, start with the Rankings section. Here you will see top tokens under
          each of the 7 categories -{' '}
          <b>Bullish, Bearish, Top CEX Inflow, Top CEX Outflow, Top Traded, Trending Soon, Currently Trending.</b> We
          update the token rankings multiple times a day!
        </p>{' '}
        <p>
          For traders looking to spot alpha on specific tokens, start with the Explore section. You will find a number
          of On-Chain and Technical insights on your token that you can look at to make an informed trading decision.
        </p>
      </Trans>
    ),
  },
  {
    image: tutorial3,
    textStyle,
    text: (
      <Trans>
        <p>
          A unique trading insight offered by KyberAI is the <b>KyberScore</b>. KyberScore uses <b>AI</b> to measure the
          upcoming trend (bullish or bearish) of a token by taking into account multiple on-chain and off-chain
          indicators. The score ranges from 0 to 100. Higher the score, more bullish the token in the <b>short-term</b>.
        </p>{' '}
        <p>
          Each token supported by KyberAI is assigned a KyberScore. It refreshes multiple times a day as we collect more
          data on the token. You can find the KyberScore of a token in the <b>Rankings</b> or <b>Explore</b> section.
          Read more about the calculation here.
        </p>{' '}
        <p>
          <i>Note: KyberScore should not be considered as financial advice</i>
        </p>
      </Trans>
    ),
  },
  {
    image: tutorial4,
    textStyle,
    text: (
      <Trans>
        <p>
          For traders, analyzing & interpreting on-chain data can be very powerful. It helps us see what whales, smart
          money and other traders are up to. And so, KyberAI has cherry picked the best on-chain indicators to help
          traders like you spot alpha on your tokens. Check out the <b>On-Chain Analysis</b> tab of the <b>Explore</b>{' '}
          section!
        </p>
        <p>
          The best traders combine on-chain analysis with technical analysis (TA). TA is used to identify trading
          opportunities by evaluating price charts, price trends, patterns etc. KyberAI makes TA easy for traders. Check
          out the <b>Technical Analysis</b> tab of the Explore section!
        </p>
      </Trans>
    ),
  },
  {
    image: tutorial6,
    textStyle,
    text: (
      <Trans>
        <p>That&apos;s not all! Here are a few handy tips so you can get the most out of KyberAI:</p>{' '}
        <ul>
          <li>
            Use the search bar to <b>search</b> for any token you&apos;d like to explore. KyberAI supports 4000+ tokens!
          </li>
          <li>
            <b>Subscribe</b> to receive daily emails on the top tokens as recommended by KyberAI!
          </li>
          <li>
            Monitoring the price of a token? Set a <b>price alert</b>, sit back, and we&apos;ll notify you!
          </li>
          <li>
            Create a <b>watchlist</b> of your favorite tokens, and access it quickly!
          </li>
        </ul>{' '}
        <p>If you wish to view this guide again, you can enable it from the settings. </p>
        <p>
          <b>Ape Smart with KyberAI.</b>
        </p>
      </Trans>
    ),
  },
]

const TutorialModalKyberAI = () => {
  const isOpen = useModalOpen(ApplicationModal.KYBERAI_TUTORIAL)
  const toggle = useToggleModal(ApplicationModal.KYBERAI_TUTORIAL)
  const theme = useTheme()

  useEffect(() => {
    if (!localStorage.getItem('showedKyberAITutorial')) {
      // auto show for first time all user
      toggle()
      localStorage.setItem('showedKyberAITutorial', '1')
    }
  }, [toggle])

  return (
    <TutorialModal
      steps={steps}
      isOpen={isOpen}
      onDismiss={toggle}
      title={
        <>
          <Trans>
            Welcome to <ApeIcon />
            KyberAI
          </Trans>
          <div
            style={{
              padding: '4px 8px',
              background: theme.subText + '32',
              fontSize: '12px',
              lineHeight: '16px',
              borderRadius: '20px',
              color: theme.subText,
            }}
          >
            beta
          </div>
        </>
      }
    />
  )
}
export default TutorialModalKyberAI
