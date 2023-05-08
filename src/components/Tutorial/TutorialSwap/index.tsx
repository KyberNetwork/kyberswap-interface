import { Trans } from '@lingui/macro'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { BrowserView } from 'react-device-detect'
import { ChevronUp } from 'react-feather'
import { Flex } from 'rebass'
import styled, { createGlobalStyle } from 'styled-components'
import { CardinalOrientation, Step, Walktour, WalktourLogic } from 'walktour'

import BtnSettingHeader from 'assets/images/tutorial_swap/btn_setting_header.png'
import ButtonSwapGuide from 'assets/images/tutorial_swap/btn_swap_guide.png'
import CampaignLink from 'assets/images/tutorial_swap/campaign_link.png'
import ConnectWalletImg from 'assets/images/tutorial_swap/connect_wallet.png'
import Step5 from 'assets/images/tutorial_swap/earn_link.png'
import Menu from 'assets/images/tutorial_swap/menu.png'
import SelectChainBtn from 'assets/images/tutorial_swap/select_network.png'
import SwapSetting from 'assets/images/tutorial_swap/swap_setting.png'
import SwapSettingBtn from 'assets/images/tutorial_swap/swap_setting_btn.png'
import WelcomeImage from 'assets/images/tutorial_swap/welcome.png'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ToggleItemType } from 'components/Collapse'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { filterTruthy } from 'utils'

import CustomMask from './CustomMask'
import CustomPopup from './CustomPopup'
import TutorialMobile from './TutorialMobile'
import { LIST_TITLE, StepTutorial, TutorialIds } from './constant'

const isMobile = window.innerWidth < 1200 // best resolution for this tutorial

export const Heading = styled.h5`
  color: ${({ theme }) => theme.text};
  user-select: none;
  margin: 5px 0px 10px 0px;
  display: flex;
  align-items: center;
  font-size: 16px;
`

const LayoutWrapper = styled.div`
  color: ${({ theme }) => theme.subText};
  text-align: left;
  font-size: 14px;
`

const Layout = ({ children, title }: { title?: string; children: React.ReactNode }) => {
  return (
    <LayoutWrapper>
      {!isMobile && title && <Heading>{title}</Heading>}
      {children}
    </LayoutWrapper>
  )
}

const ArrowWrapper = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.text};
  svg {
    transition: all 150ms ease-in-out;
  }
  &[data-expanded='false'] {
    svg {
      transform: rotate(180deg);
    }
  }
`

const NetworkItemWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 42px;
  display: flex;
  padding: 10px 15px;
  gap: 10px;
  cursor: pointer;
`

const NetworkWrapper = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 15px;
  gap: 10px;
  display: flex;
  flex-direction: column;
`

const ImageMobile = ({
  imgSrc,
  imageName,
  marginTop = false,
}: {
  imgSrc: string
  imageName: string
  marginTop?: boolean
}) =>
  isMobile ? (
    <Flex justifyContent={'center'}>
      <img style={{ marginTop: marginTop ? 20 : 0, width: '100%', maxWidth: 800 }} src={imgSrc} alt={imageName} />
    </Flex>
  ) : null

const Desc = styled.p`
  line-height: 20px;
`

const HighlightText = styled.span`
  color: ${({ theme }) => theme.text};
`
function Welcome() {
  return (
    <Layout>
      <img src={WelcomeImage} alt="welcome to kyberswap" style={{ maxWidth: '100%', marginTop: 10 }} />
      <Desc>
        <Trans>
          KyberSwap is a decentralized exchange (DEX) aggregator and an automated market maker (AMM). We provide our
          traders with the <HighlightText>best token prices</HighlightText> by analyzing rates across hundreds of
          exchanges instantly! On the other hand, our liquidity providers can add liquidity to our pools to{' '}
          <HighlightText>earn fees and rewards!</HighlightText>
        </Trans>
      </Desc>

      <Desc>
        <Trans>
          KyberSwap also allows users to <HighlightText>trade smarter</HighlightText>. We provide various trading
          insights so our users can get access to <HighlightText>alpha</HighlightText> instantly!
        </Trans>
      </Desc>

      <Desc>
        <Trans>
          Here&apos;s a quick tutorial guide about KyberSwap&apos;s main features. Do you wish to have a look?
        </Trans>
      </Desc>
    </Layout>
  )
}

function ConnectWallet() {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = () => setIsExpanded(!isExpanded)
  const isDarkMode = useIsDarkMode()
  return (
    <Layout title={LIST_TITLE.CONNECT_WALLET}>
      <Desc>
        <Trans>Choose your preferred wallet, connect it, and get started with KyberSwap!</Trans>
      </Desc>
      <ImageMobile imgSrc={ConnectWalletImg} imageName="Step connect wallet" />
      <BrowserView>
        <Heading onClick={toggleExpand} style={{ cursor: 'pointer' }}>
          <Trans>Download Wallet</Trans>
          <ArrowWrapper data-expanded={isExpanded}>
            <ChevronUp size={15} onClick={toggleExpand} />
          </ArrowWrapper>
        </Heading>
        {isExpanded && (
          <NetworkWrapper>
            {Object.values(SUPPORTED_WALLETS)
              .filter(e => e.installLink)
              .map(item => (
                <NetworkItemWrapper key={item.name} onClick={() => window.open(item.installLink)}>
                  <img src={isDarkMode ? item.icon : item.iconLight} alt={item.name} width="20" height="20" />
                  <span>{item.name}</span>
                </NetworkItemWrapper>
              ))}
          </NetworkWrapper>
        )}
      </BrowserView>
    </Layout>
  )
}

function VideoSwap() {
  return (
    <Layout title={LIST_TITLE.START_TRADING}>
      <Desc>
        <Trans>
          Select from over thousands of tokens and start trading. KyberSwap finds you the best prices across multiple
          exchanges & combines them into one trade!
        </Trans>
      </Desc>
    </Layout>
  )
}

// override lib css
const CustomCss = createGlobalStyle`
  [id^=walktour-tooltip-container]:focus-visible {
    outline: none;
  };
`

const Highlight = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`
const getListSteps = (isLogin: boolean, isSolana: boolean) => {
  let stepNumber = 0
  const isHighlightBtnConnectWallet = !isLogin || isMobile
  return filterTruthy([
    {
      customTitleRenderer: () => (
        <Heading style={{ fontSize: 20 }}>
          <Trans>{LIST_TITLE.WELCOME}</Trans>
        </Heading>
      ),
      customFooterRenderer: (logic: WalktourLogic) => (
        <Flex justifyContent={'center'} style={{ gap: 25, marginTop: 20 }}>
          <ButtonOutlined onClick={() => logic.close()} width="160px" height="36px">
            <Trans>Maybe later</Trans>
          </ButtonOutlined>
          <ButtonPrimary onClick={() => logic.next()} width="160px" height="36px">
            <Trans>Let’s get started</Trans>
          </ButtonPrimary>
        </Flex>
      ),
      stepNumber: stepNumber++,
      description: <Welcome />,
      pcOnly: true,
      center: true,
      popupStyle: { width: 800 },
    },
    {
      selector: isHighlightBtnConnectWallet ? TutorialIds.BUTTON_CONNECT_WALLET : TutorialIds.BUTTON_ADDRESS_WALLET,
      title: isHighlightBtnConnectWallet ? LIST_TITLE.CONNECT_WALLET : LIST_TITLE.YOUR_WALLET,
      stepNumber: stepNumber++,
      description: <ConnectWallet />,
      orientationPreferences: [CardinalOrientation.SOUTHEAST, CardinalOrientation.NORTHWEST],
    },
    {
      selector: TutorialIds.SELECT_NETWORK,
      title: LIST_TITLE.SELECT_NETWORK,
      stepNumber: stepNumber++,
      description: (
        <Layout title={LIST_TITLE.SELECT_NETWORK}>
          <Desc>
            <Trans>
              Choose your preferred network. KyberSwap is a multi-chain platform that supports over 13 chains!
            </Trans>
          </Desc>
          <ImageMobile imgSrc={SelectChainBtn} imageName="Step select chain" />
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTHEAST, CardinalOrientation.NORTHWEST],
    },
    {
      selector: TutorialIds.SWAP_FORM,
      title: LIST_TITLE.START_TRADING,
      stepNumber: stepNumber++,
      description: <VideoSwap />,
      requiredClickSelector: '#' + TutorialIds.BUTTON_SETTING_SWAP_FORM,
      selectorHint: '#' + TutorialIds.SWAP_FORM_CONTENT,
    },
    {
      selector: TutorialIds.BUTTON_SETTING_SWAP_FORM,
      title: LIST_TITLE.SETTING,
      stepNumber: stepNumber,
      maskPadding: 10,
      description: (
        <Layout title={LIST_TITLE.SETTING}>
          <Desc>
            <Trans>Customize the layout & the look and feel of your trading interface!</Trans>
          </Desc>
          <ImageMobile imgSrc={SwapSettingBtn} imageName="Step setting" />
          <ImageMobile imgSrc={SwapSetting} imageName="Step setting" marginTop />
        </Layout>
      ),
      hasPointer: true,
      orientationPreferences: [CardinalOrientation.EAST, CardinalOrientation.NORTH],
      spotlightInteraction: true,
    },
    {
      selector: TutorialIds.SWAP_FORM,
      title: LIST_TITLE.SETTING,
      stepNumber: stepNumber++,
      requiredClickSelector: '#' + TutorialIds.BUTTON_SETTING_SWAP_FORM,
      selectorHint: '#' + TutorialIds.TRADING_SETTING_CONTENT,
      description: (
        <Layout title={LIST_TITLE.SETTING}>
          <Desc>
            <Trans>Customize the layout & the look and feel of your trading interface!</Trans>
          </Desc>
        </Layout>
      ),
      pcOnly: true,
      callbackEndStep: () => document.getElementById(TutorialIds.BUTTON_SETTING_SWAP_FORM)?.click(),
      orientationPreferences: [CardinalOrientation.EAST, CardinalOrientation.NORTH],
      maskPadding: 10,
    },
    {
      selector: TutorialIds.BRIDGE_LINKS,
      title: LIST_TITLE.BRIDGE,
      stepNumber: stepNumber++,
      description: (
        <Layout title={LIST_TITLE.BRIDGE}>
          <Desc>
            <Trans> You can place limit orders, bridge tokens, or buy crypto with multiple payment options!</Trans>
          </Desc>
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTH],
      popupStyle: { width: 430 },
    },
    isSolana
      ? null
      : {
          selector: TutorialIds.EARNING_LINKS,
          title: LIST_TITLE.EARN,
          stepNumber: stepNumber++,
          description: (
            <Layout title={LIST_TITLE.EARN}>
              <Desc>
                <Trans>
                  Add liquidity into our Pools to earn trading fees & participate in our Farms to earn additional
                  rewards!
                </Trans>
              </Desc>
              <ImageMobile imgSrc={Step5} imageName="Step earn" />
            </Layout>
          ),
          orientationPreferences: [CardinalOrientation.SOUTH],
        },
    isSolana
      ? null
      : {
          selector: TutorialIds.DISCOVER_LINK,
          title: LIST_TITLE.DISCOVER,
          stepNumber: stepNumber++,
          description: (
            <Layout title={LIST_TITLE.DISCOVER}>
              <Desc>
                <Trans>
                  Whether you&apos;re looking to identify new tokens to trade, or get <Highlight>alpha</Highlight> on a
                  specific token, KyberAI has it all! It provides trading insights on{' '}
                  <Highlight>4000+ tokens</Highlight> across <Highlight>7 blockchains!</Highlight>
                </Trans>
              </Desc>
            </Layout>
          ),
          orientationPreferences: [CardinalOrientation.SOUTH, CardinalOrientation.SOUTHEAST],
        },
    {
      selector: TutorialIds.CAMPAIGN_LINK,
      title: LIST_TITLE.CAMPAIGN,
      stepNumber: stepNumber++,
      description: (
        <Layout title={LIST_TITLE.CAMPAIGN}>
          <Desc>
            <Trans>Check out our latest trading campaigns and participate in them to earn rewards!</Trans>
          </Desc>
          <ImageMobile imgSrc={Menu} imageName="Menu" />
          <ImageMobile imgSrc={CampaignLink} imageName="Step campaign" marginTop />
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTH],
    },
    isSolana
      ? null
      : {
          selector: TutorialIds.KYBER_DAO_LINK,
          title: LIST_TITLE.KYBER_DAO,
          stepNumber: stepNumber++,
          description: (
            <Layout title={LIST_TITLE.KYBER_DAO}>
              <Desc>
                <Trans>
                  Stake KNC tokens to vote on proposals that shape Kyber&apos;s future and earn KNC rewards!
                </Trans>
              </Desc>
            </Layout>
          ),
          orientationPreferences: [CardinalOrientation.SOUTH],
        },
    {
      selector: TutorialIds.BUTTON_VIEW_GUIDE_SWAP,
      title: LIST_TITLE.VIEW_GUIDE,
      stepNumber: stepNumber++,
      maskPadding: 10,
      requiredClickSelector: '#' + TutorialIds.BUTTON_MENU_HEADER,
      stopPropagationMouseDown: true,
      lastStep: true,
      description: (
        <Layout title={LIST_TITLE.VIEW_GUIDE}>
          <Desc>
            <Trans>
              You can repeat these instructions anytime by clicking on the &quot;View&quot; button under Preferences.
            </Trans>
          </Desc>
          <Desc>
            <Trans>
              For a more detailed user guide,{' '}
              <ExternalLink href="https://docs.kyberswap.com/guides/getting-started">click here.</ExternalLink>
            </Trans>
          </Desc>
          <ImageMobile imgSrc={BtnSettingHeader} imageName="Step review" marginTop />
          <ImageMobile imgSrc={ButtonSwapGuide} imageName="Step review" />
        </Layout>
      ),
    },
  ])
}

const TutorialKeys = {
  SHOWED_SWAP_GUIDE: 'showedTutorialSwapGuide',
}

export default memo(function TutorialSwap() {
  const [{ show = false, step = 0 }, setShowTutorial] = useTutorialSwapGuide()
  const stopTutorial = () => setShowTutorial({ show: false })
  const { account, isSolana } = useActiveWeb3React()
  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (!localStorage.getItem(TutorialKeys.SHOWED_SWAP_GUIDE)) {
      // auto show for first time all user
      setShowTutorial({ show: true, step: 0 })
      localStorage.setItem(TutorialKeys.SHOWED_SWAP_GUIDE, '1')
    }
  }, [setShowTutorial])

  const steps = useMemo(() => {
    const list = getListSteps(!!account, isSolana)
    if (isMobile) {
      return list
        .filter(e => !e.pcOnly)
        .map(({ title, description }, i) => ({
          title: `${i + 1}. ${title}`,
          content: description,
        }))
    }
    return list.map(e => ({
      ...e,
      description: e.description as unknown as string, // because this lib type check description is string but actually it accept any
      selector: '#' + e.selector,
    }))
  }, [account, isSolana])

  const stepInfo = (steps[step] || {}) as StepTutorial

  const onDismiss = (logic: WalktourLogic) => {
    const { stepNumber } = stepInfo
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_DENY, stepNumber)
    stopTutorial()
    logic.close()
  }

  const onFinished = () => {
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_DONE)
    stopTutorial()
  }

  const checkRequiredClick = (nextStep: StepTutorial) => {
    const { requiredClickSelector, selectorHint } = nextStep
    const needClick = requiredClickSelector && !document.querySelector(selectorHint || nextStep?.selector)
    // target next step has not render yet, => click other button to render it
    // ex: click button setting to show setting popup, and then highlight content of setting
    if (needClick) {
      const button: HTMLButtonElement | null = document.querySelector(requiredClickSelector)
      button?.click()
    }
    return needClick
  }

  const processNextStep = ({ allSteps, prev, next, stepIndex }: WalktourLogic, isNext: boolean) => {
    const nextIndex = isNext ? stepIndex + 1 : stepIndex - 1
    const needClickAnyElement = checkRequiredClick(allSteps[nextIndex])
    const { callbackEndStep } = stepInfo
    callbackEndStep && callbackEndStep()
    setTimeout(
      () => {
        setShowTutorial({ step: nextIndex, stepInfo: allSteps[nextIndex] })
        isNext ? next() : prev()
      },
      needClickAnyElement ? 400 : 0,
    )
  }

  const onNext = (logic: WalktourLogic) => {
    const { stepIndex, close, allSteps } = logic
    const { lastStep } = allSteps[stepIndex] as StepTutorial
    if (lastStep) {
      onFinished()
      close()
      return
    }
    // next
    processNextStep(logic, true)
  }

  const onBack = (logic: WalktourLogic) => {
    processNextStep(logic, false)
  }

  if (!show) return null
  if (isMobile) return <TutorialMobile stopTutorial={stopTutorial} steps={steps as ToggleItemType[]} />
  return (
    <>
      <Walktour
        tooltipSeparation={25}
        disableMaskInteraction
        customTooltipRenderer={(props: WalktourLogic | undefined) => (
          <CustomPopup {...(props || ({} as WalktourLogic))} />
        )}
        steps={steps as Step[]}
        isOpen={show}
        initialStepIndex={step}
        customNextFunc={onNext}
        customPrevFunc={onBack}
        customCloseFunc={onDismiss}
        renderMask={options => <CustomMask options={options} stepInfo={stepInfo} />}
      />
      <CustomCss />
    </>
  )
})
