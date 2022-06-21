import React, { useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { Flex, Text, Image } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import introImg from 'assets/buy-crypto/intro.png'
import buyNowImg from 'assets/buy-crypto/buy-now.png'
import visa from 'assets/buy-crypto/visa.svg'
import masterCard from 'assets/buy-crypto/master-card.svg'
import gPay from 'assets/buy-crypto/google-pay.svg'
import applePay from 'assets/buy-crypto/apple-pay.svg'
import bankTransfer from 'assets/buy-crypto/bank-transfer.svg'
import { ButtonPrimary, ButtonLight } from 'components/Button'
import SeamlessImg from 'assets/svg/seamless.svg'
import Cart from 'components/Icons/Cart'
import { useMedia } from 'react-use'
import { ArrowDown, ChevronDown, Repeat } from 'react-feather'
import { ButtonText, ExternalLink } from 'theme'
import Deposit from 'components/Icons/Deposit'
import metamask from 'assets/images/metamask.svg'
import c98 from 'assets/images/coin98.svg'
import walletConnect from 'assets/images/wallet-connect.svg'
import coinbase from 'assets/images/wallet-link.svg'
import ledger from 'assets/images/ledger.svg'
import { useActiveWeb3React } from 'hooks'
import CopyHelper from 'components/Copy'
import { useWalletModalToggle } from 'state/application/hooks'
import { KSStatistic } from 'pages/About/AboutKyberSwap'
import { Link } from 'react-router-dom'

const IntroWrapper = styled.div`
  background: radial-gradient(88.77% 152.19% at 12.8% -49.11%, #237c71 0%, #251c72 31%, #0f054c 100%);
  width: 100%;
  min-height: 100vh;
`

const IntroContent = styled.div`
  max-width: 1200px;
  padding: 100px 24px 48px;
  margin: auto;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column-reverse;
    padding: 44px 16px 30px;
  `}
`

const StepItem = styled.div<{ active: boolean }>`
  border-radius: 50%;
  background: ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : theme.border)};
  color: ${({ theme, active }) => (active ? theme.textReverse : theme.subText)};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`

const StepSeparator = styled.div<{ direction: 'vertical' | 'horizontal' }>`
  width: ${({ direction }) => (direction === 'vertical' ? '1px' : '16px')};
  height: ${({ direction }) => (direction === 'vertical' ? '16px' : '1px')};
  background: ${({ theme }) => theme.border};
`

const animation = keyframes`
  0% {
    transform: translate(0, 0);
  }
  20% {
    transform: translate(0, 10px);
  }
  40% {
    transform: translate(0, 0);
  }
`

const ScrollDownBtn = styled(ButtonText)`
  animation: ${animation} 1.5s infinite;
`

const DownloadWalletWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  width: 100%;
  min-height: 100vh;
`

const DownloadWalletContent = styled(IntroContent)`
  padding: 120px 24px 48px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    padding: 80px 16px 30px;
  `}
`

const Address = styled.div`
  max-width: calc(100vw - 32px);
  gap: 4px;
  display: flex;
  border-radius: 999px;
  padding: 14px 18px;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  background: ${({ theme }) => theme.buttonBlack};
  margin-top: 12px;
  width: fit-content;
`

const Step = ({
  currentStep = 1,
  direction = 'vertical',
}: {
  currentStep: 1 | 2 | 3 | 4
  direction: 'vertical' | 'horizontal'
}) => {
  const steps = [1, 2, 3, 4]
  return (
    <Flex
      width="fit-content"
      flexDirection={direction === 'vertical' ? 'column' : 'row'}
      sx={{ gap: '4px' }}
      alignItems="center"
      justifyContent="center"
    >
      {steps.map((item, index) => (
        <React.Fragment key={item}>
          <StepItem active={currentStep === item}>{index + 1}</StepItem>
          {index !== steps.length - 1 && <StepSeparator direction={direction} />}
        </React.Fragment>
      ))}
    </Flex>
  )
}

function BuyCrypto() {
  const theme = useTheme()

  const upToMedium = useMedia('(max-width: 992px)')
  const upToSmall = useMedia('(max-width: 768px)')

  const { account } = useActiveWeb3React()

  const toggleWalletModal = useWalletModalToggle()

  const step1Ref = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)

  const supportedNetworks = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avaxcchain', 'fantom', 'velasevm']
  const supportedCurrencies = [
    'AVAX',
    'USDC',
    'ETH',
    'USDS',
    'BNB',
    'BUSD',
    'DAI',
    'USDT',
    'WBTC',
    'FTM',
    'MATIC',
    'WETH',
    'VLX',
  ]

  const redirectURL = window.location.hostname.includes('localhost')
    ? 'https://KyberSwap.com/swap'
    : window.location.origin + '/swap'
  const transakUrl = `https://staging-global.transak.com?apiKey=327b8b63-626b-4376-baf2-70a304c48488&cryptoCurrencyList=${supportedCurrencies.join(
    ',',
  )}&networks=${supportedNetworks.join(',')}&walletAddress=${account}&redirectURL=${redirectURL}`

  return (
    <>
      <IntroWrapper>
        <IntroContent>
          {!upToMedium && <Step currentStep={1} direction="vertical" />}

          <Flex flexDirection="column" marginLeft={!upToMedium ? '68px' : 0}>
            <Flex
              flex={1}
              alignItems="center"
              flexDirection={upToMedium ? 'column-reverse' : 'row'}
              data-aos="fade-right"
            >
              <Flex flexDirection="column" flex={1}>
                <Text
                  fontSize={upToMedium ? '28px' : '44px'}
                  lineHeight={upToMedium ? '32px' : '60px'}
                  marginTop={upToMedium ? '40px' : undefined}
                >
                  <Trans>Buy crypto easily with over 50+ currencies</Trans>
                </Text>

                <Text
                  color={theme.subText}
                  fontSize={upToMedium ? '16px' : '20px'}
                  lineHeight={upToMedium ? '24px' : '28px'}
                  marginTop={upToMedium ? '40px' : '48px'}
                >
                  You can now seamlessly buy 100+ cryptocurrencies on over 10+ blockchains using a wide range of payment
                  options!
                </Text>

                <Flex sx={{ gap: '28px' }} marginTop="24px">
                  <Image src={visa} width={upToSmall ? '36px' : '64px'} />
                  <Image src={masterCard} width={upToSmall ? '36px' : '64px'} />
                  <Image src={gPay} width={upToSmall ? '36px' : '64px'} />
                  <Image src={applePay} width={upToSmall ? '36px' : '64px'} />
                  <Image src={bankTransfer} width={upToSmall ? '36px' : '64px'} />
                </Flex>

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '48px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  onClick={() => step1Ref?.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Get Started</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>

              <Image
                src={introImg}
                sx={{ flex: 1, marginLeft: upToSmall ? 'auto' : '48px', maxWidth: upToMedium ? '252px' : '496px' }}
                data-aos="zoom-in-left"
              />
            </Flex>

            <Flex justifyContent="space-between" marginTop={upToMedium ? '42px' : '64px'}>
              <ScrollDownBtn
                onClick={() => {
                  step1Ref?.current?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
              >
                {upToMedium ? (
                  <ChevronDown size={36} color={theme.subText} />
                ) : (
                  <ArrowDown size={48} color={theme.subText} />
                )}
              </ScrollDownBtn>

              {upToMedium && <Step direction="horizontal" currentStep={1} />}
            </Flex>
          </Flex>
        </IntroContent>
      </IntroWrapper>
      <DownloadWalletWrapper>
        <DownloadWalletContent ref={step1Ref}>
          <Flex flexDirection="column">
            <Flex alignItems="center">
              {!upToMedium && (
                <>
                  <Step direction="vertical" currentStep={2} />
                  <Image src={SeamlessImg} marginLeft="68px" maxWidth="496px" data-aos="zoom-in-right" flex={1} />
                </>
              )}
              <Flex flexDirection="column" marginLeft={!upToMedium ? '48px' : 0} data-aos="fade-left" flex={1}>
                <Text color={theme.primary} fontSize="16px" fontWeight="500">
                  <Trans>Step 1</Trans>
                </Text>
                <Text fontSize={upToMedium ? '28px' : '36px'} fontWeight="500" marginTop="8px">
                  <Trans>Download a wallet</Trans>
                </Text>
                <Text color={theme.subText} lineHeight={1.5} marginTop={upToMedium ? '40px' : '48px'}>
                  <Trans>
                    A cryptocurrency wallet gives you access to your digital tokens and acts as a gateway to many
                    blockchain applications like KyberSwap. You can buy, store, send and swap tokens using this wallet.
                    <br />
                    <br />
                    On KyberSwap we support a list of wallets including: MetaMask, Coin98, Wallet Connect, Coinbase
                    Wallet, Ledger and others
                  </Trans>
                </Text>

                <Flex sx={{ gap: upToMedium ? '28px' : '44px' }} marginTop="28px">
                  <Image src={metamask} width={upToSmall ? '36px' : '48px'} />
                  <Image src={c98} width={upToSmall ? '36px' : '48px'} />
                  <Image src={walletConnect} width={upToSmall ? '36px' : '48px'} />
                  <Image src={coinbase} width={upToSmall ? '36px' : '48px'} />
                  <Image src={ledger} width={upToSmall ? '36px' : '48px'} />
                </Flex>

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '48px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  padding="10px"
                >
                  <Deposit width={24} height={24} />
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Download Wallet</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>
            </Flex>

            <Flex>
              {!upToMedium && <Flex flex={1} marginLeft="68px" />}
              <Flex
                justifyContent="space-between"
                marginTop={upToMedium ? '42px' : '64px'}
                flex={1}
                marginLeft={!upToMedium ? '48px' : 0}
              >
                <ScrollDownBtn
                  onClick={() => {
                    step2Ref?.current?.scrollIntoView({
                      behavior: 'smooth',
                    })
                  }}
                >
                  {upToMedium ? (
                    <ChevronDown size={36} color={theme.subText} />
                  ) : (
                    <ArrowDown size={48} color={theme.subText} />
                  )}
                </ScrollDownBtn>

                {upToMedium && <Step direction="horizontal" currentStep={2} />}
              </Flex>
            </Flex>
          </Flex>
        </DownloadWalletContent>
      </DownloadWalletWrapper>

      <IntroWrapper>
        <IntroContent ref={step2Ref}>
          {!upToMedium && <Step currentStep={3} direction="vertical" />}

          <Flex flexDirection="column" marginLeft={!upToMedium ? '68px' : 0}>
            <Flex
              flex={1}
              alignItems="center"
              flexDirection={upToMedium ? 'column-reverse' : 'row'}
              data-aos="fade-right"
            >
              <Flex flexDirection="column" flex={1}>
                <Text color={theme.primary} fontSize="16px" fontWeight="500">
                  <Trans>Step 2</Trans>
                </Text>

                <Text fontSize={upToMedium ? '28px' : '44px'} lineHeight={upToMedium ? '32px' : '60px'}>
                  <Trans>Buy Crypto</Trans>
                </Text>

                <Text color={theme.subText} lineHeight={1.5} marginTop={upToMedium ? '40px' : '48px'}>
                  Note: Clicking "Buy Crypto" will bring you to a third party website, owned and operated by an
                  independent party over which KyberSwap has no control ("
                  <ExternalLink href="">Third Party Website</ExternalLink>").
                  <br />
                  <br />
                  For support, please contact Transak <ExternalLink href="">here</ExternalLink>
                </Text>

                <Text color={theme.subText} marginTop="24px">
                  Your wallet address
                </Text>

                {!account ? (
                  <ButtonLight margin={'12px 0 0'} width={upToSmall ? '100%' : '50%'} onClick={toggleWalletModal}>
                    Connect your wallet
                  </ButtonLight>
                ) : (
                  <Address>
                    <Text
                      flex={1}
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {account}
                    </Text>
                    <CopyHelper toCopy={account} />
                  </Address>
                )}

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '44px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  as="a"
                  href={transakUrl}
                >
                  <Cart />
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Buy Now</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>

              <Image
                src={buyNowImg}
                sx={{ flex: 1, marginLeft: upToSmall ? 'auto' : '48px', maxWidth: upToMedium ? '252px' : '496px' }}
                data-aos="zoom-in-left"
              />
            </Flex>

            <Flex justifyContent="space-between" marginTop={upToMedium ? '42px' : '64px'}>
              <ScrollDownBtn
                onClick={() => {
                  step3Ref?.current?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
              >
                {upToMedium ? (
                  <ChevronDown size={36} color={theme.subText} />
                ) : (
                  <ArrowDown size={48} color={theme.subText} />
                )}
              </ScrollDownBtn>

              {upToMedium && <Step direction="horizontal" currentStep={3} />}
            </Flex>
          </Flex>
        </IntroContent>
      </IntroWrapper>

      <DownloadWalletWrapper>
        <DownloadWalletContent ref={step3Ref}>
          <Flex flexDirection="column">
            <Flex alignItems="center">
              {!upToMedium && (
                <>
                  <Step direction="vertical" currentStep={4} />
                  <Image src={SeamlessImg} marginLeft="68px" maxWidth="496px" data-aos="zoom-in-right" flex={1} />
                </>
              )}
              <Flex flexDirection="column" marginLeft={!upToMedium ? '48px' : 0} data-aos="fade-left" flex={1}>
                <Text color={theme.primary} fontSize="16px" fontWeight="500">
                  <Trans>Step 3</Trans>
                </Text>
                <Text fontSize={upToMedium ? '28px' : '36px'} fontWeight="500" marginTop="8px">
                  <Trans>Swap on KyberSwap</Trans>
                </Text>
                <Text color={theme.subText} lineHeight={1.5} marginTop={upToMedium ? '40px' : '48px'}>
                  <Trans>
                    Now that you have purchased your crypto, you can trade from over 20,000+ tokens on KyberSwap! We
                    give you the best trading rates in the market!
                  </Trans>
                </Text>

                <KSStatistic />

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '48px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  padding="10px"
                  as={Link}
                  to="/swap"
                >
                  <Repeat size={24} />
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Swap Now</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>
            </Flex>

            {upToMedium && (
              <Flex marginTop="40px" justifyContent="flex-end">
                <Step direction="horizontal" currentStep={4} />
              </Flex>
            )}
          </Flex>
        </DownloadWalletContent>
      </DownloadWalletWrapper>
    </>
  )
}

export default BuyCrypto
