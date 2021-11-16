import React, { useState, useEffect, useCallback } from 'react'
import { Text, Flex } from 'rebass'
import { Link } from 'react-router-dom'
import useTheme from 'hooks/useTheme'
import { Trans } from '@lingui/macro'
import {
  MoneyBag,
  Ethereum,
  Polygon,
  Binance,
  Clock,
  Avalanche,
  Fantom,
  BestPrice,
  LowestSlippage,
  FarmIcon,
  Enter,
  CircleFocus,
  Telegram
} from 'components/Icons'
import { Repeat, Plus, Edit, FileText } from 'react-feather'
import Loader from 'components/Loader'
import ForTraderImage from 'assets/images/about_for_trader.png'
import SeamlessImg from 'assets/svg/permissionless_frictionless.svg'
import { useMedia } from 'react-use'
import { ExternalLink } from 'theme'
import { useDarkModeManager } from 'state/user/hooks'
import githubImg from 'assets/svg/about_icon_github.png'
import githubImgLight from 'assets/svg/about_icon_github_light.png'
import FantomLogoFull from 'components/Icons/FantomLogoFull'
import { KYBER_NETWORK_TWITTER_URL, KYBER_NETWORK_DISCORD_URL, KNC, MAX_ALLOW_APY } from 'constants/index'
import { ChainId, ETHER, Fraction, JSBI } from '@dynamic-amm/sdk'
import { convertToNativeTokenFromETH, useFarmRewardPerBlocks, getTradingFeeAPR, useFarmApr } from 'utils/dmm'
import { useActiveWeb3React } from 'hooks'
import { useFarmsData } from 'state/farms/hooks'
import { useGlobalData } from 'state/about/hooks'
import { Farm } from 'state/farms/types'
import { isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { ethers } from 'ethers'
import { useBlockNumber } from 'state/application/hooks'
import { formatBigLiquidity } from 'utils/formatBalance'
import {
  Footer,
  FooterContainer,
  Wrapper,
  Powered,
  BtnOutlined,
  BtnPrimary,
  ForLiquidityProviderItem,
  TypicalAMM,
  KyberSwapSlippage,
  ForTrader,
  ForTraderInfo,
  ForTraderDivider,
  StatisticWrapper,
  StatisticItem,
  SupportedChain,
  AboutPage
} from './styleds'

const getPoolsMenuLink = (chainId?: ChainId) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return `/pools/${convertToNativeTokenFromETH(ETHER, chainId).symbol}/${KNC[chainId as ChainId].address}`
    case ChainId.ROPSTEN:
      return `/pools/${convertToNativeTokenFromETH(ETHER, chainId).symbol}/${KNC[chainId as ChainId].address}`
    case ChainId.MATIC:
      return `/pools/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619/${KNC[chainId as ChainId].address}`
    case ChainId.MUMBAI:
      return `/pools/0x19395624C030A11f58e820C3AeFb1f5960d9742a/${KNC[chainId as ChainId].address}`
    case ChainId.BSCTESTNET:
      return `/pools/BNB`
    case ChainId.BSCMAINNET:
      return `/pools/BNB`
    case ChainId.AVAXTESTNET:
      return `/pools/AVAX`
    case ChainId.AVAXMAINNET:
      return `/pools/AVAX`
    case ChainId.FANTOM:
      return `/pools/FTM`
    default:
      return '/pools/ETH'
  }
}

function About() {
  const theme = useTheme()
  const [isDarkMode] = useDarkModeManager()
  const above992 = useMedia('(min-width: 992px)')
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

  const { chainId } = useActiveWeb3React()
  const poolsMenuLink = getPoolsMenuLink(chainId)
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]
  const aggregatorData = data?.aggregatorData

  const { data: farms } = useFarmsData()

  const [maxApr, setMaxApr] = useState<{ [key: string]: number }>({
    [chainId as ChainId]: -1
  })
  const [indexx, setIndexx] = useState<number>(0)

  useEffect(() => {
    setIndexx(0)
  }, [farms])

  const handleAprUpdate = useCallback(
    (value: number) => {
      const max = maxApr[chainId as ChainId] || -1
      if (value > max) {
        setMaxApr(prev => ({
          ...prev,
          [chainId as ChainId]: value
        }))
      }
      setIndexx(prev => prev + 1)
    },
    [maxApr, chainId]
  )

  return (
    <AboutPage background={isDarkMode ? theme.buttonBlack : theme.white}>
      <Wrapper>
        <Text as="h2" fontSize={['28px', '48px']} textAlign="center" lineHeight={['32px', '60px']} fontWeight="300">
          <Text color={theme.primary} as="span" fontWeight="500">
            <Trans>Swap</Trans>
          </Text>{' '}
          and{' '}
          <Text fontWeight="500" color={theme.primary} as="span">
            Earn
          </Text>{' '}
          Tokens at the Best Rates
        </Text>

        <Text color={theme.subText} fontSize={['1rem', '1.25rem']} marginTop={['40px', '48px']} textAlign="center">
          <Trans>
            KyberSwap is DeFi’s first dynamic market maker, providing the best token rates for traders and maximizing
            returns for liquidity providers, in one decentralized exchange
          </Trans>
        </Text>

        <SupportedChain>
          <Ethereum />
          <Polygon />
          <Binance />
          <Avalanche />
          <Fantom />
        </SupportedChain>

        <Flex
          justifyContent="center"
          maxWidth="456px"
          margin="auto"
          marginTop={['40px', '48px']}
          sx={{ gap: above768 ? '24px' : '16px' }}
        >
          <BtnPrimary as={Link} to="/swap">
            <Repeat />
            <Text fontSize={['16px', '20px']} marginLeft="8px">
              <Trans>Swap Now</Trans>
            </Text>
          </BtnPrimary>
          <BtnOutlined as={Link} to={poolsMenuLink}>
            <MoneyBag />
            <Text fontSize={['16px', '20px']} marginLeft="8px">
              <Trans>Start Earning</Trans>
            </Text>
          </BtnOutlined>
        </Flex>

        <StatisticWrapper>
          <StatisticItem>
            <Text fontSize={['24px', '28px']} fontWeight={600}>
              {aggregatorData?.totalVolume ? formatBigLiquidity(aggregatorData.totalVolume, 2, true) : <Loader />}
            </Text>
            <Text color={theme.subText} marginTop="8px">
              <Trans>Total Trading Volume</Trans>*
            </Text>
          </StatisticItem>
          <Flex sx={{ gap: '16px' }} flex={2}>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>Total Value Locked</Trans>
              </Text>
            </StatisticItem>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                {globalData ? formatBigLiquidity(globalData.totalAmplifiedLiquidityUSD, 2, true) : <Loader />}
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>Total AMP Liquidity</Trans>**
              </Text>
            </StatisticItem>
          </Flex>

          <Flex sx={{ gap: '16px' }} flex={2}>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                $2.13B
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>Total Earning</Trans>
              </Text>
            </StatisticItem>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                {maxApr[chainId as ChainId] >= 0 ? maxApr[chainId as ChainId].toFixed(2) + '%' : <Loader />}
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>Max APR Available</Trans>
              </Text>
            </StatisticItem>
          </Flex>
        </StatisticWrapper>

        <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="12px" color={theme.subText}>
          *<Trans>Includes DEX aggregation</Trans>
        </Text>
        <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="8px" color={theme.subText}>
          **<Trans>TVL equivalent compared to AMMs</Trans>
        </Text>

        <ForTrader>
          <Flex flex={1} flexDirection="column" height="max-content">
            <Text fontSize={['16px', '20px']} fontWeight={500} color={theme.primary}>
              <Trans>FOR TRADERS</Trans>
            </Text>
            <Text marginTop="12px" fontSize={['28px', '36px']}>
              <Trans>Swap your tokens at the best rates. No limits</Trans>
            </Text>
            <Text
              fontSize="16px"
              marginTop={['40px', '48px']}
              color={theme.subText}
              lineHeight="24px"
              textAlign="justify"
            >
              <Trans>
                With our Dynamic Trade Routing technology, we aggregate liquidity from multiple DEXs (including
                KyberSwap) and identify the best trade route for you.
              </Trans>
            </Text>

            <Flex marginTop="20px" alignItems="center">
              <BestPrice />
              <Text marginLeft="12px">Best price guaranteed</Text>
            </Flex>
            <Flex marginTop="20px" alignItems="center">
              <LowestSlippage />
              <Text marginLeft="12px">Lowest possible slippage</Text>
            </Flex>

            <Flex marginTop="20px" alignItems="center">
              <Clock />
              <Text marginLeft="12px">Save time & effort</Text>
            </Flex>

            {above500 && (
              <BtnPrimary margin="48px 0" width="216px" as={Link} to="/swap">
                <Repeat />
                <Text fontSize={['16px', '20px']} marginLeft="8px">
                  <Trans>Swap Now</Trans>
                </Text>
              </BtnPrimary>
            )}
          </Flex>
          <Flex flex={1} flexDirection="column">
            <img width="100%" src={ForTraderImage} alt="" style={{ marginTop: above992 ? '0.25rem' : '40px' }} />
            <ForTraderInfo marginTop="20px">
              <Flex sx={{ gap: '24px' }} height={above992 ? '100%' : 'unset'} width={above992 ? 'unset' : '100%'}>
                <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
                  <Text fontWeight="600" fontSize="24px">
                    $24B
                  </Text>
                  <Text color={theme.subText} marginTop="4px" fontSize="14px">
                    <Trans>TVL From DEXs</Trans>
                  </Text>
                </Flex>

                <ForTraderDivider />

                <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
                  <Text fontWeight="600" fontSize="24px">
                    24
                  </Text>
                  <Text color={theme.subText} marginTop="4px" fontSize="14px">
                    <Trans>DEXs</Trans>
                  </Text>
                </Flex>
              </Flex>

              <ForTraderDivider horizontal={!above992} />

              <Flex sx={{ gap: '24px' }} height={above992 ? '100%' : 'unset'} width={above992 ? 'unset' : '100%'}>
                <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
                  <Text fontWeight="600" fontSize="24px">
                    5
                  </Text>
                  <Text color={theme.subText} marginTop="4px" fontSize="14px">
                    <Trans>Chain</Trans>
                  </Text>
                </Flex>
                <ForTraderDivider />
                <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
                  <Text fontWeight="600" fontSize="24px">
                    20,000+
                  </Text>
                  <Text color={theme.subText} marginTop="4px" fontSize="14px">
                    <Trans>Tokens</Trans>
                  </Text>
                </Flex>
              </Flex>
            </ForTraderInfo>
          </Flex>
          {!above500 && (
            <BtnPrimary margin="40px 0" as={Link} to="/swap">
              <Repeat />
              <Text fontSize={['16px', '20px']} marginLeft="8px">
                <Trans>Swap Now</Trans>
              </Text>
            </BtnPrimary>
          )}
        </ForTrader>

        <Text
          color={theme.primary}
          marginTop={['100px', '160px']}
          fontWeight="500"
          fontSize={['16px', '20px']}
          textAlign="center"
        >
          <Trans>FOR LIQUIDITY PROVIDERS</Trans>
        </Text>
        <Text marginTop="12px" fontWeight="500" fontSize={['28px', '36px']} textAlign="center">
          <Trans>Earn more with your crypto assets</Trans>
        </Text>
        <Text color={theme.subText} marginTop={['40px', '48px']} fontSize="1rem" textAlign="center">
          <Trans>Earn fees and rewards by depositing your tokens into our pools.</Trans>
        </Text>

        <ForLiquidityProviderItem
          marginTop={['40px', '48px']}
          flexDirection={above768 ? 'row' : 'column'}
          sx={{ gap: above768 ? '32px' : '48px' }}
          alignItems={above768 ? 'flex-start' : 'center'}
        >
          <Flex flexDirection="column" alignItems={above768 ? 'flex-start' : 'center'} width="max-content">
            <LowestSlippage size={64} />
            <Text marginTop="28px" fontWeight="500" color={theme.primary}>
              <Trans>LOWER SLIPPAGE</Trans>
            </Text>
          </Flex>

          <Flex sx={{ gap: '24px' }} flexDirection="column" alignItems={above768 ? 'flex-start' : 'center'} flex={1}>
            <Text>
              <Trans>Amplified Liquidity Pools</Trans>
            </Text>
            <Text color={theme.subText}>
              <Trans>
                We can amplify liquidity pools to provide much higher capital efficiency and better slippage for you.
                Deposit less tokens and still achieve better liquidity and volume.
              </Trans>
            </Text>

            <ExternalLink href="https://docs.dmm.exchange/">
              <Text color={theme.primary} fontSize="14px" fontWeight={600}>
                <Trans>Learn More</Trans>↗
              </Text>
            </ExternalLink>
          </Flex>

          {above768 && (
            <Flex alignItems="center" width="fit-content">
              <KyberSwapSlippage>
                <img src="/logo.svg" width="88px" alt="KyberSwap" />
                <Flex justifyContent="center">
                  <Text fontWeight="500" fontSize="40px" lineHeight="48px">
                    ~0.1
                  </Text>
                  <Text marginTop="6px">%</Text>
                </Flex>
                <Text fontSize="12px">Slippage</Text>
                <Text fontSize="10px" color={theme.subText} marginTop="12px">
                  AMP Factor = 100
                </Text>
              </KyberSwapSlippage>
              <TypicalAMM>
                <Text color={theme.subText} fontSize="12px">
                  Typical AMM
                </Text>
                <Flex marginTop="8px" justifyContent="center">
                  <Text fontWeight="500" fontSize="40px" lineHeight="48px">
                    ~11
                  </Text>
                  <Text marginTop="6px">%</Text>
                </Flex>
                <Text fontSize="12px">Slippage</Text>
              </TypicalAMM>
            </Flex>
          )}
        </ForLiquidityProviderItem>
        <Flex marginTop="24px" sx={{ gap: '24px' }} flexDirection={above768 ? 'row' : 'column'}>
          <ForLiquidityProviderItem flexDirection="column" flex={1} alignItems={above768 ? 'flex-start' : 'center'}>
            <BestPrice size={64} />
            <Text marginTop="28px" fontWeight="500" color={theme.primary}>
              <Trans>LOWER SLIPPAGE</Trans>
            </Text>

            <Text marginTop={['40px', '48px']}>
              <Trans>Dynamic Fees</Trans>
            </Text>
            <Text color={theme.subText} marginTop="24px">
              <Trans>We adjust trading fees dynamically based on market conditions to give you the best returns.</Trans>
            </Text>

            <ExternalLink href="https://docs.dmm.exchange/dynamic-fee">
              <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
                <Trans>Learn More</Trans>↗
              </Text>
            </ExternalLink>
          </ForLiquidityProviderItem>

          <ForLiquidityProviderItem flexDirection="column" flex={1} alignItems={above768 ? 'flex-start' : 'center'}>
            <BestPrice size={64} />
            <Text marginTop="28px" fontWeight="500" color={theme.primary}>
              <Trans>BONUS REWARDS</Trans>
            </Text>

            <Text marginTop={['40px', '48px']}>
              <Trans>Rainmaker Yield Farming</Trans>
            </Text>
            <Text color={theme.subText} marginTop="24px">
              <Trans>
                Deposit your tokens and farm attractive rewards. We collaborate with projects to get you the best
                rewards.
              </Trans>
            </Text>

            <ExternalLink href="https://docs.dmm.exchange/guides/yield-farming">
              <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
                <Trans>Learn More</Trans>↗
              </Text>
            </ExternalLink>
          </ForLiquidityProviderItem>
        </Flex>

        <Flex
          justifyContent="center"
          maxWidth="456px"
          margin="auto"
          marginTop={['40px', '48px']}
          sx={{ gap: above768 ? '24px' : '16px' }}
        >
          <BtnPrimary as={Link} to={poolsMenuLink}>
            <MoneyBag color={theme.textReverse} />
            <Text fontSize="16px" marginLeft="8px">
              <Trans>Start Earning</Trans>
            </Text>
          </BtnPrimary>
          <BtnOutlined as={Link} to="/farms">
            <FarmIcon />
            <Text fontSize="16px" marginLeft="8px">
              <Trans>View Farms</Trans>
            </Text>
          </BtnOutlined>
        </Flex>

        <Text marginTop={['100px', '160px']} fontWeight="500" fontSize={['28px', '36px']}>
          Seamless liquidity.
        </Text>
        <Text fontWeight="500" fontSize={['28px', '36px']}>
          For everyone
        </Text>

        <Flex sx={{ gap: '24px' }} marginTop="48px">
          <Flex flex={1} flexDirection="column">
            <Text color={theme.subText}>
              Anyone can provide liquidity to KyberSwap by depositing tokens e.g. Traders, Token Teams.
            </Text>
            <Text color={theme.subText} marginTop="24px">
              Anyone can access this liquidity from KyberSwap for their own use case e.g. Dapps, Aggregators.
            </Text>
            <Text color={theme.subText} marginTop="24px">
              Thousands of users and multiple decentralized applications are already providing and using our liquidity.
            </Text>

            <Flex marginTop="20px" alignItems="center">
              <Enter />
              <Text marginLeft="12px">
                <Trans>No KYC or sign-ups required</Trans>
              </Text>
            </Flex>
            <Flex marginTop="12px" alignItems="center">
              <BestPrice />
              <Text marginLeft="12px">
                <Trans>List your tokens permissionlessly</Trans>
              </Text>
            </Flex>
            <Flex marginTop="12px" alignItems="center">
              <CircleFocus />
              <Text marginLeft="12px">
                <Trans>List your tokens permissionlessly</Trans>
              </Text>
            </Flex>
          </Flex>
          {above768 && (
            <Flex flex={1}>
              <img src={SeamlessImg} style={{ flex: 1 }} width="100%" alt="" />
            </Flex>
          )}
        </Flex>

        <Flex
          sx={{ gap: '24px' }}
          marginTop={['40px', '48px']}
          flexDirection={above768 ? 'row' : 'column'}
          maxWidth="696px"
        >
          <BtnPrimary as={Link} to="/create">
            <Plus />
            <Text marginLeft="8px">Create New Pool</Text>
          </BtnPrimary>
          <Flex sx={{ gap: above768 ? '24px' : '16px' }} maxWidth="456px">
            <BtnOutlined as={ExternalLink} href="https://developer.kyber.network/">
              <Edit color={theme.primary} />
              <Text marginLeft="8px" fontSize="16px">
                <Trans>Contact Us</Trans>
              </Text>
            </BtnOutlined>

            <BtnOutlined as={ExternalLink} href="https://developer.kyber.network/">
              <FileText color={theme.primary} />
              <Text marginLeft="8px" fontSize="16px">
                <Trans>Docs</Trans>
              </Text>
            </BtnOutlined>
          </Flex>
        </Flex>

        {!above768 && (
          <Flex flex={1} marginTop="40px">
            <img src={SeamlessImg} style={{ flex: 1 }} width="100%" alt="" />
          </Flex>
        )}

        <Text marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
          <Trans>Committed to Security</Trans>
        </Text>

        <Flex
          marginTop="40px"
          sx={{ gap: above992 ? '32px' : '20px' }}
          flexDirection={above992 ? 'row' : 'column'}
          alignItems="center"
          justifyContent="center"
        >
          <Flex flex={1} sx={{ gap: above992 ? '32px' : '20px' }} alignItems="center" justifyContent="center">
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text color={theme.subText} textAlign="center" marginBottom={above992 ? '21px' : '14px'}>
                <Trans>Code Audited</Trans>
              </Text>
              <ExternalLink href="https://chainsecurity.com/wp-content/uploads/2021/04/ChainSecurity_KyberNetwork_DMM_Dynamic-Market-Making_Final.pdf">
                <img
                  src={
                    !isDarkMode
                      ? 'https://chainsecurity.com/wp-content/themes/chainsecurity-wp/resources/images/temp/logo.svg'
                      : require('../../assets/svg/chainsecurity.svg')
                  }
                  alt=""
                  width={above992 ? '197px' : '140px'}
                />
              </ExternalLink>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text color={theme.subText} textAlign="center" marginBottom={above992 ? '24px' : '12px'}>
                <Trans>Insured by</Trans>
              </Text>
              <ExternalLink href="https://medium.com/unslashed/kyber-network-and-unslashed-finance-partner-over-a-20m-native-insurance-to-protect-kyber-network-df543045a97c">
                <img
                  src={
                    !isDarkMode
                      ? require('../../assets/svg/unslashed_light.svg')
                      : require('../../assets/svg/unslashed.svg')
                  }
                  alt=""
                  width={above992 ? '170px' : '140px'}
                />
              </ExternalLink>
            </div>
          </Flex>
          <Flex flex={1} sx={{ gap: above992 ? '32px' : '20px' }} alignItems="center" justifyContent="center">
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text color={theme.subText} textAlign="center" marginBottom={above992 ? '16px' : '12px'}>
                <Trans>On-chain & Open Source</Trans>
              </Text>
              <ExternalLink href="https://github.com/dynamic-amm">
                <img src={isDarkMode ? githubImg : githubImgLight} alt="" width="125px" />
              </ExternalLink>
            </div>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text color={theme.subText} textAlign="center" marginBottom="16px">
                <Trans>Bug Bounty</Trans>
              </Text>
              <img
                src={require('../../assets/svg/about_icon_bug_bounty.svg')}
                alt=""
                width={above992 ? '186px' : '140px'}
              />
            </div>
          </Flex>
        </Flex>

        <Text marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
          <Trans>Powered by</Trans>

          <Powered
            marginTop="48px"
            justifyContent="center"
            alignItems="center"
            sx={{ gap: '36px' }}
            flexDirection={above992 ? 'row' : 'column'}
          >
            <Flex flex={1} justifyContent="center" alignItems="center" sx={{ gap: '36px' }}>
              <img
                src={
                  isDarkMode
                    ? require('../../assets/svg/about_icon_kyber.svg')
                    : require('../../assets/svg/about_icon_kyber_light.svg')
                }
                alt=""
                width="50%"
                style={{ flex: 1 }}
              />
              <img src={require('../../assets/svg/about_icon_ethereum.png')} alt="" style={{ flex: 1 }} width="50%" />
            </Flex>
            <Flex flex={1} justifyContent="center" alignItems="center" sx={{ gap: '36px' }}>
              <img
                style={{ flex: 1 }}
                src={
                  isDarkMode
                    ? require('../../assets/svg/about_icon_polygon.png')
                    : require('../../assets/svg/about_icon_polygon_light.svg')
                }
                alt=""
                width="50%"
              />
              <img src={require('../../assets/svg/about_icon_avalanche.png')} alt="" style={{ flex: 1 }} width="50%" />
            </Flex>

            <Flex flex={1} justifyContent="center" alignItems="center" sx={{ gap: '36px' }}>
              <img src={require('../../assets/svg/about_icon_bsc.png')} alt="" style={{ flex: 1 }} width="50%" />
              <div style={{ flex: 1, width: '50%' }}>
                <FantomLogoFull color={isDarkMode ? '#fff' : '#1969FF'} />
              </div>
            </Flex>
          </Powered>
        </Text>
      </Wrapper>
      <Footer background={isDarkMode ? theme.background : theme.white}>
        <FooterContainer>
          <Flex flexWrap="wrap" sx={{ gap: '24px' }} justifyContent="center">
            <ExternalLink href={`https://docs.dmm.exchange`}>
              <Trans>Docs</Trans>
            </ExternalLink>
            <ExternalLink href={`https://github.com/dynamic-amm`}>
              <Trans>Github</Trans>
            </ExternalLink>
            <ExternalLink href={`https://kyber.org`}>KyberDAO</ExternalLink>
            <ExternalLink href={`https://gov.kyber.org`}>
              <Trans>Forum</Trans>
            </ExternalLink>
            <ExternalLink href={`https://kyber.network`}>Kyber Network</ExternalLink>
            <ExternalLink href={`https://kyber.network/about/knc`}>KNC</ExternalLink>
          </Flex>
          <Flex alignItems="center" justifyContent="center" sx={{ gap: '24px' }}>
            <ExternalLink href="https://t.me/kybernetwork">
              <Telegram size={16} color={theme.subText} />
            </ExternalLink>
            <ExternalLink href={KYBER_NETWORK_TWITTER_URL}>
              <img src={require('../../assets/svg/about_icon_twitter.svg')} width="16px" alt="" />
            </ExternalLink>
            <ExternalLink href={KYBER_NETWORK_DISCORD_URL}>
              <img src={require('../../assets/svg/about_icon_discord.svg')} width="16px" alt="" />
            </ExternalLink>
            <ExternalLink href={`https://blog.kyber.network`}>
              <img src={require('../../assets/svg/about_icon_medium.svg')} width="16px" alt="" />
            </ExternalLink>
          </Flex>
        </FooterContainer>
      </Footer>

      {Object.values(farms)
        .flat()
        .map((farm, index) => index === indexx && <Apr key={farm.id} farm={farm} onAprUpdate={handleAprUpdate} />)}
    </AboutPage>
  )
}

export default About

function Apr({ farm, onAprUpdate }: { farm: Farm; onAprUpdate: any }) {
  const farmRewardPerBlocks = useFarmRewardPerBlocks([farm])
  const poolAddressChecksum = isAddressString(farm.id)
  const { decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const currentBlock = useBlockNumber()
  const isLiquidityMiningActive =
    currentBlock && farm.startBlock && farm.endBlock
      ? farm.startBlock <= currentBlock && currentBlock <= farm.endBlock
      : false

  const farmAPR = useFarmApr(farmRewardPerBlocks, liquidity.toString(), isLiquidityMiningActive)
  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)
  const apr = farmAPR + (tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0)

  useEffect(() => {
    if (farmAPR > 0) onAprUpdate(apr)
  }, [apr, onAprUpdate, farmAPR])
  return <></>
}
