import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import aggregatorStatsApi from 'services/aggregatorStats'

import ArbitrumDark from 'assets/images/Arbitrum_HorizontalLogo-dark.svg'
import KNCGraphic from 'assets/images/knc-graphic.png'
import megaEthIcon from 'assets/networks/megaeth.svg'
import monadIcon from 'assets/networks/monad.svg'
import AboutAvalanche from 'assets/svg/about_icon_avalanche.svg'
import BSC from 'assets/svg/about_icon_bsc.svg'
import ForTraderImage from 'assets/svg/for_trader.svg'
import KyberDark from 'assets/svg/kyber/about_icon_kyber.svg'
import { ReactComponent as KNCSVG } from 'assets/svg/kyber/knc_black.svg'
import Banner from 'components/Banner'
import { FooterSocialLink } from 'components/Footer/Footer'
import { BestPrice, Clock, LineaFull, LowestSlippage, OptimismLogoFull, PolygonLogoFull } from 'components/Icons'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import KyberSwapGeneralIntro from 'pages/About/KyberSwapGeneralIntro'
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
} from 'pages/About/styleds'
import { ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatBigLiquidity } from 'utils/formatBalance'

const KNCBlack = () => <KNCSVG className="[&_path]:fill-textReverse" />

const ForTraderInfoRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 basis-full max-lg:size-full max-lg:flex-1 max-lg:gap-6">{children}</div>
)

const ForTraderInfoCell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 basis-full flex-col items-center max-lg:flex-1">{children}</div>
)

export const KSStatistic = () => {
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const { supportedChains } = useChainsConfig()

  return (
    <div className="relative mt-5">
      <ForTraderInfoShadow />
      <ForTraderInfo>
        <ForTraderInfoRow>
          <ForTraderInfoCell>
            <span className="text-2xl font-semibold">$24B</span>
            <span className="mt-1 text-sm text-subText">
              <Trans>TVL From DEXs</Trans>
            </span>
          </ForTraderInfoCell>

          <ForTraderDivider />

          <ForTraderInfoCell>
            <span className="text-2xl font-semibold">70+</span>
            <span className="mt-1 text-sm text-subText">
              <Trans>DEXs</Trans>
            </span>
          </ForTraderInfoCell>
        </ForTraderInfoRow>

        <ForTraderDivider horizontal={upToLarge} />

        <ForTraderInfoRow>
          <ForTraderInfoCell>
            <span className="text-2xl font-semibold">{supportedChains.length}+</span>
            <span className="mt-1 text-sm text-subText">
              <Trans>Chains</Trans>
            </span>
          </ForTraderInfoCell>
          <ForTraderDivider />
          <ForTraderInfoCell>
            <span className="text-2xl font-semibold">20,000+</span>
            <span className="mt-1 text-sm text-subText">
              <Trans>Tokens</Trans>
            </span>
          </ForTraderInfoCell>
        </ForTraderInfoRow>
      </ForTraderInfo>
    </div>
  )
}

function AboutKyberSwap() {
  const { networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const above992 = useMedia('(min-width: 992px)')
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

  const { data: aggregatorData } = aggregatorStatsApi.useGetAggregatorVolumeQuery({})

  const { trackingHandler } = useTracking()

  const dataToShow = {
    totalTradingVolume: aggregatorData?.totalVolume,
    '24hTradingVolume': aggregatorData?.last24hVolume,
  }

  const { supportedChains } = useChainsConfig()

  return (
    <div className="relative w-full bg-buttonBlack">
      <AboutPage>
        <Banner margin="32px auto 0" padding="0 16px" maxWidth="1224px" />

        <Wrapper>
          <h1 className="text-center text-[28px] font-light leading-8 sm:text-[48px] sm:leading-[60px]">
            <Trans>
              <span className="font-medium text-primary">Swap</span> Tokens at Superior Rates
            </Trans>
          </h1>

          <SupportedChain>
            {supportedChains.map(({ chainId: chain, icon, name }) => (
              <img className="size-9 object-contain" src={icon} alt={name} key={chain} />
            ))}
          </SupportedChain>

          <KyberSwapGeneralIntro />

          <StatisticWrapper>
            <StatisticItem>
              <span className="flex min-h-[1.2em] items-center justify-center text-2xl font-semibold sm:text-[28px]">
                {dataToShow.totalTradingVolume ? (
                  formatBigLiquidity(dataToShow.totalTradingVolume, 2, true)
                ) : (
                  <Loader />
                )}
              </span>
              <span className="mt-2 text-subText">
                <Trans>Total Trading Volume</Trans>*
              </span>
            </StatisticItem>
            <StatisticItem>
              <span className="flex min-h-[1.2em] items-center justify-center text-2xl font-semibold sm:text-[28px]">
                {dataToShow['24hTradingVolume'] ? (
                  formatBigLiquidity(dataToShow['24hTradingVolume'], 2, true)
                ) : (
                  <Loader />
                )}
              </span>
              <span className="mt-2 text-subText">
                <Trans>24H Trading Volume</Trans>*
              </span>
            </StatisticItem>
          </StatisticWrapper>

          <ForTrader>
            <div className="flex h-max flex-1 flex-col">
              <span className="text-base font-medium text-primary sm:text-xl">
                <Trans>FOR TRADERS</Trans>
              </span>
              <h2 className="mt-3 text-[28px] font-medium sm:text-4xl">
                <Trans>Swap your tokens at superior rates. No limits</Trans>
              </h2>
              <span className="mt-10 text-justify text-base leading-6 text-text sm:mt-12">
                <Trans>
                  With our Dynamic Trade Routing technology, we aggregate liquidity from multiple DEXs and identify
                  superior trade routes for you.
                </Trans>
              </span>

              <div className="mt-5 flex items-center">
                <BestPrice />
                <span className="ml-3">
                  <Trans>Superior price guaranteed</Trans>
                </span>
              </div>
              <div className="mt-5 flex items-center">
                <LowestSlippage />
                <span className="ml-3">
                  <Trans>Lowest possible slippage</Trans>
                </span>
              </div>

              <div className="mt-5 flex items-center">
                <Clock className="text-primary" />
                <span className="ml-3">
                  <Trans>Save time & effort</Trans>
                </span>
              </div>

              {above500 && (
                <BtnPrimary
                  margin="48px 0"
                  width="216px"
                  as={Link as never}
                  to={APP_PATHS.SWAP + '/' + networkInfo.route}
                  onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
                >
                  <Repeat size={20} />
                  <span className="ml-2 text-base">
                    <Trans>Swap Now</Trans>
                  </span>
                </BtnPrimary>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <img
                width="100%"
                src={ForTraderImage}
                alt="ForTrader"
                style={{ marginTop: above992 ? '0.25rem' : '40px' }}
              />
              <KSStatistic />
            </div>
            {!above500 && (
              <BtnPrimary
                margin="40px 0"
                as={Link as never}
                to={APP_PATHS.SWAP + '/' + networkInfo.route}
                onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
              >
                <Repeat />
                <span className="ml-2 text-base sm:text-xl">
                  <Trans>Swap Now</Trans>
                </span>
              </BtnPrimary>
            )}
          </ForTrader>

          <AboutKNC>
            <img
              src={KNCGraphic}
              alt="KNCGraphic"
              className="h-[400px] w-auto"
              style={{ display: above768 ? 'block' : 'none' }}
            />
            <div className="flex h-max w-full flex-col self-center">
              <span className="text-base font-medium text-primary sm:text-xl">
                <Trans>ABOUT KNC</Trans>
              </span>
              <h2 className="mt-3 text-[28px] font-medium sm:text-4xl">
                <Trans>Kyber Network Crystal (KNC)</Trans>
              </h2>
              <span className="mt-10 text-justify text-base leading-6 text-subText sm:mt-12">
                <Trans>
                  KNC is a utility and governance token, and an integral part of Kyber Network and its flagship product
                  KyberSwap. It is the glue that connects different stakeholders in Kyber&apos;s ecosystem.
                </Trans>
              </span>
              <img
                width="75%"
                src={KNCGraphic}
                alt="KNCGraphic"
                className="m-auto mt-10"
                style={{ display: above768 ? 'none' : 'block' }}
              />
              <BtnPrimary as={Link as never} to="/about/knc" margin="48px 0">
                <KNCBlack />
                <span className="ml-2 text-sm sm:text-base">
                  <Trans>Find out more</Trans>
                </span>
              </BtnPrimary>
            </div>
          </AboutKNC>

          <h2 className="mt-[100px] text-center text-[28px] font-medium sm:mt-40 sm:text-4xl">
            <Trans>Powered by</Trans>

            <Powered>
              <img src={KyberDark} alt="kyber_icon" width="100%" />
              <img src="https://i.imgur.com/1l1KyxF.png" alt="ethereum_icon" width="100%" />
              <img src={BSC} alt="bsc_icon" width="100%" />
              <PolygonLogoFull />
              <img src={AboutAvalanche} alt="avalanche_icon" width="100%" />
              <img src={ArbitrumDark} alt="" width="100%" />
              <OptimismLogoFull />
              <LineaFull />
              <img
                src="https://raw.githubusercontent.com/base-org/brand-kit/001c0e9b40a67799ebe0418671ac4e02a0c683ce/logo/wordmark/Base_Wordmark_Blue.svg"
                alt="Base"
                width="100%"
              />

              <img src="https://www.mantle.xyz/logo-lockup.svg" alt="mantle" width="100%" />

              <img src="https://www.soniclabs.com/sonic-logo.svg" alt="Sonic" width="100%" />

              <div className="flex !w-auto items-center gap-3">
                <img
                  src="https://storage.googleapis.com/ks-setting-1d682dca/68e11813-067b-42d7-8d7a-c1b7bf80714e1739239376230.png"
                  alt="Bera"
                  width="80px"
                />
                <span>Berachain</span>
              </div>

              <div className="flex !w-auto items-center gap-3">
                <img src="https://docs.roninchain.com/img/logo.svg" alt="Ronin" className="h-20 w-auto" />
                <span>Roninchain</span>
              </div>
              <img src="https://www.etherlink.com/logo-desktop.svg" alt="Etherlink" width="100%" />
              <div className="flex !w-auto items-center gap-3">
                <img
                  src="https://storage.googleapis.com/ks-setting-1d682dca/9cdb1542-1d9a-4cf0-b67b-b68b1a29b09d1758725874771.png"
                  alt="Plasma"
                  width="80px"
                />
                <span>Plasma</span>
              </div>
              <div className="flex !w-auto items-center gap-3">
                <img src={monadIcon} alt="Monad" width="80px" />
                <span>Monad</span>
              </div>
              <div className="flex !w-auto items-center gap-3">
                <img src={megaEthIcon} alt="MegaETH" width="80px" />
                <span>MegaETH</span>
              </div>
            </Powered>
          </h2>
        </Wrapper>
      </AboutPage>
      <Footer background={theme.background}>
        <FooterContainer>
          <div className="flex flex-wrap justify-center gap-3">
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
          </div>
          <FooterSocialLink />
        </FooterContainer>
      </Footer>
    </div>
  )
}

export default AboutKyberSwap
