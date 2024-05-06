import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import aggregatorStatsApi from 'services/aggregatorStats'
import styled from 'styled-components'

import ArbitrumDark from 'assets/images/Arbitrum_HorizontalLogo-dark.svg'
import BTTCDark from 'assets/images/btt-logo-dark.svg'
import KNCGraphic from 'assets/images/knc-graphic.png'
import AboutAvalanche from 'assets/svg/about_icon_avalanche.svg'
import BSC from 'assets/svg/about_icon_bsc.svg'
import KyberDark from 'assets/svg/about_icon_kyber.svg'
import ForTraderImage from 'assets/svg/for_trader.svg'
import { ReactComponent as KNCSVG } from 'assets/svg/knc_black.svg'
import Banner from 'components/Banner'
import { FooterSocialLink } from 'components/Footer/Footer'
import {
  BestPrice,
  Clock,
  CronosLogoFull,
  FantomLogoFull,
  LineaFull,
  LowestSlippage,
  OptimismLogoFull,
  PolygonLogoFull,
} from 'components/Icons'
import ZkSyncFull from 'components/Icons/ZkSyncFull'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatBigLiquidity } from 'utils/formatBalance'

import KyberSwapGeneralIntro from '../KyberSwapGeneralIntro'
import {
  AboutKNC,
  AboutPage,
  BtnPrimary,
  Footer,
  FooterContainer,
  ForTrader,
  ForTraderDivider,
  ForTraderInfo,
  ForTraderInfoShadow,
  Powered,
  StatisticItem,
  StatisticWrapper,
  SupportedChain,
  VerticalDivider,
  Wrapper,
} from '../styleds'

// import MeetTheTeam from './MeetTheTeam'

const KNCBlack = styled(KNCSVG)`
  path {
    fill: ${({ theme }) => theme.textReverse};
  }
`

const ForTraderInfoRow = styled.div`
  flex: 1 1 100%;
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
    gap: 24px;
    width: 100%;
    height: 100%;
  `}
`

const ForTraderInfoCell = styled.div`
  flex: 1 1 100%;

  display: flex;
  flex-direction: column;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
  `}
`

export const KSStatistic = () => {
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const { supportedChains } = useChainsConfig()

  return (
    <Box sx={{ position: 'relative', marginTop: '20px' }}>
      <ForTraderInfoShadow />
      <ForTraderInfo>
        <ForTraderInfoRow>
          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              $24B
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>TVL From DEXs</Trans>
            </Text>
          </ForTraderInfoCell>

          <ForTraderDivider />

          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              70+
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>DEXs</Trans>
            </Text>
          </ForTraderInfoCell>
        </ForTraderInfoRow>

        <ForTraderDivider horizontal={upToLarge} />

        <ForTraderInfoRow>
          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              {supportedChains.length}+
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>Chains</Trans>
            </Text>
          </ForTraderInfoCell>
          <ForTraderDivider />
          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              20,000+
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>Tokens</Trans>
            </Text>
          </ForTraderInfoCell>
        </ForTraderInfoRow>
      </ForTraderInfo>
    </Box>
  )
}

function AboutKyberSwap() {
  const { networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const above992 = useMedia('(min-width: 992px)')
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

  const { data: aggregatorData } = aggregatorStatsApi.useGetAggregatorVolumeQuery({})

  const { mixpanelHandler } = useMixpanel()

  const dataToShow = {
    totalTradingVolume: aggregatorData?.totalVolume,
    '24hTradingVolume': aggregatorData?.last24hVolume,
  }

  const { supportedChains } = useChainsConfig()

  return (
    <div style={{ position: 'relative', background: theme.buttonBlack, width: '100%' }}>
      <AboutPage>
        <Banner margin="32px auto 0" padding="0 16px" maxWidth="1224px" />

        <Wrapper>
          <Text as="h1" fontSize={['28px', '48px']} textAlign="center" lineHeight={['32px', '60px']} fontWeight="300">
            <Trans>
              <Text color={theme.primary} as="span" fontWeight="500">
                Swap
              </Text>{' '}
              Tokens at Superior Rates
            </Trans>
          </Text>

          <SupportedChain>
            {supportedChains.map(({ chainId: chain, icon, name }) => (
              <img src={icon} alt={name} key={chain} width="36px" height="36px" />
            ))}
          </SupportedChain>

          <KyberSwapGeneralIntro />

          <StatisticWrapper>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                {dataToShow.totalTradingVolume ? (
                  formatBigLiquidity(dataToShow.totalTradingVolume, 2, true)
                ) : (
                  <Loader />
                )}
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>Total Trading Volume</Trans>*
              </Text>
            </StatisticItem>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                {dataToShow['24hTradingVolume'] ? (
                  formatBigLiquidity(dataToShow['24hTradingVolume'], 2, true)
                ) : (
                  <Loader />
                )}
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>24H Trading Volume</Trans>*
              </Text>
            </StatisticItem>
          </StatisticWrapper>

          <ForTrader>
            <Flex flex={1} flexDirection="column" height="max-content">
              <Text fontSize={['16px', '20px']} fontWeight={500} color={theme.primary}>
                <Trans>FOR TRADERS</Trans>
              </Text>
              <Text as="h2" marginTop="12px" fontSize={['28px', '36px']} fontWeight="500">
                <Trans>Swap your tokens at superior rates. No limits</Trans>
              </Text>
              <Text
                fontSize="16px"
                marginTop={['40px', '48px']}
                color={theme.text}
                lineHeight="24px"
                textAlign="justify"
              >
                <Trans>
                  With our Dynamic Trade Routing technology, we aggregate liquidity from multiple DEXs and identify
                  superior trade routes for you.
                </Trans>
              </Text>

              <Flex marginTop="20px" alignItems="center">
                <BestPrice />
                <Text marginLeft="12px">
                  <Trans>Superior price guaranteed</Trans>
                </Text>
              </Flex>
              <Flex marginTop="20px" alignItems="center">
                <LowestSlippage />
                <Text marginLeft="12px">
                  <Trans>Lowest possible slippage</Trans>
                </Text>
              </Flex>

              <Flex marginTop="20px" alignItems="center">
                <Clock />
                <Text marginLeft="12px">
                  <Trans>Save time & effort</Trans>
                </Text>
              </Flex>

              {above500 && (
                <BtnPrimary
                  margin="48px 0"
                  width="216px"
                  as={Link}
                  to={APP_PATHS.SWAP + '/' + networkInfo.route}
                  onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
                >
                  <Repeat size={20} />
                  <Text fontSize="16px" marginLeft="8px">
                    <Trans>Swap Now</Trans>
                  </Text>
                </BtnPrimary>
              )}
            </Flex>
            <Flex flex={1} flexDirection="column">
              <img
                width="100%"
                src={ForTraderImage}
                alt="ForTrader"
                style={{ marginTop: above992 ? '0.25rem' : '40px' }}
              />
              <KSStatistic />
            </Flex>
            {!above500 && (
              <BtnPrimary
                margin="40px 0"
                as={Link}
                to={APP_PATHS.SWAP + '/' + networkInfo.route}
                onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
              >
                <Repeat />
                <Text fontSize={['16px', '20px']} marginLeft="8px">
                  <Trans>Swap Now</Trans>
                </Text>
              </BtnPrimary>
            )}
          </ForTrader>

          <AboutKNC>
            <img height="400px" src={KNCGraphic} alt="KNCGraphic" style={{ display: above768 ? 'block' : 'none' }} />
            <Flex width="100%" alignSelf="center" flexDirection="column" height="max-content">
              <Text fontSize={['16px', '20px']} fontWeight={500} color={theme.primary}>
                <Trans>ABOUT KNC</Trans>
              </Text>
              <Text as="h2" marginTop="12px" fontSize={['28px', '36px']} fontWeight="500">
                <Trans>Kyber Network Crystal (KNC)</Trans>
              </Text>
              <Text
                fontSize="16px"
                marginTop={['40px', '48px']}
                color={theme.subText}
                lineHeight="24px"
                textAlign="justify"
              >
                <Trans>
                  KNC is a utility and governance token, and an integral part of Kyber Network and its flagship product
                  KyberSwap. It is the glue that connects different stakeholders in Kyber&apos;s ecosystem.
                </Trans>
              </Text>
              <img
                width="75%"
                src={KNCGraphic}
                alt="KNCGraphic"
                style={{ display: above768 ? 'none' : 'block', margin: 'auto', marginTop: '40px' }}
              />
              <BtnPrimary as={Link} to="/about/knc" margin="48px 0">
                <KNCBlack />
                <Text fontSize={['14px', '16px']} marginLeft="8px">
                  <Trans>Find out more</Trans>
                </Text>
              </BtnPrimary>
            </Flex>
          </AboutKNC>

          {/* <MeetTheTeam /> */}

          <Text as="h2" marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
            <Trans>Powered by</Trans>

            <Powered>
              <img src={KyberDark} alt="kyber_icon" width="100%" />
              <img src="https://i.imgur.com/1l1KyxF.png" alt="ethereum_icon" width="100%" />
              <img src={BSC} alt="bsc_icon" width="100%" />
              <PolygonLogoFull />
              <img src={AboutAvalanche} alt="avalanche_icon" width="100%" />
              <FantomLogoFull color={'#fff'} width="100%" height="unset" />
              <CronosLogoFull color={undefined} />
              <img src={ArbitrumDark} alt="" width="100%" />
              <img src={BTTCDark} alt="btt" width="100%" />
              <OptimismLogoFull />
              <ZkSyncFull color={theme.text} />
              <LineaFull />
              <img
                src={
                  'https://polygontechnology.notion.site/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fdd9f65de-0698-41f4-9a0e-4120b50b8176%2FPolygon_zkEVM_logo_light.svg?table=block&id=5d157d90-9ed4-48e4-be5d-4405bb02a2aa&spaceId=51562dc1-1dc5-4484-bf96-2aeac848ae2f&userId=&cache=v2'
                }
                alt="zkevm"
                width="100%"
              />
              <img
                src="https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/wordmark/Base_Wordmark_Blue.svg"
                alt="Base"
                width="100%"
              />
              <img
                src="https://storage.googleapis.com/ks-setting-1d682dca/8f4656a9-aaeb-438c-a6c2-3af30cca26db1697596014388.png"
                alt="Sroll"
                width="100%"
              />

              <img src="https://i.imgur.com/kG2lDVA.png" alt="Blast" width="100%" />

              <img src="https://www.mantle.xyz/logo-lockup.svg" alt="mantle" width="100%" />

              <Flex alignItems="center" sx={{ minWidth: '190px', gap: '6px' }}>
                <img src="https://static.okx.com/cdn/assets/imgs/243/230501A8E74482AB.png" alt="X Layer" width="50px" />
                <Text>X Layer</Text>
              </Flex>
            </Powered>
          </Text>
        </Wrapper>
      </AboutPage>
      <Footer background={theme.background}>
        <FooterContainer>
          <Flex flexWrap="wrap" sx={{ gap: '12px' }} justifyContent="center">
            <ExternalLink href={`https://docs.kyberswap.com`}>
              <Trans>Docs</Trans>
            </ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://github.com/KyberNetwork`}>
              <Trans>Github</Trans>
            </ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://kyber.org`}>KyberDAO</ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://gov.kyber.org`}>
              <Trans>Forum</Trans>
            </ExternalLink>
            {!above500 ? <div /> : <VerticalDivider />}
            <ExternalLink href={`https://kyber.network`}>Kyber Network</ExternalLink>
            <VerticalDivider />
            <StyledInternalLink to={`/about/knc`}>KNC</StyledInternalLink>
          </Flex>
          <FooterSocialLink />
        </FooterContainer>
      </Footer>
    </div>
  )
}

export default AboutKyberSwap
