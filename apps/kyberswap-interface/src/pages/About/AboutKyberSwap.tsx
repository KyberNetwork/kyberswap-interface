import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import aggregatorStatsApi from 'services/aggregatorStats'

import ArbitrumDark from 'assets/images/Arbitrum_HorizontalLogo-dark.svg'
import AboutBackground from 'assets/images/about_background.png'
import KNCGraphic from 'assets/images/knc-graphic.png'
import megaEthIcon from 'assets/networks/megaeth.svg'
import monadIcon from 'assets/networks/monad.svg'
import robinhoodIcon from 'assets/networks/robinhood.svg'
import AboutAvalanche from 'assets/svg/about_icon_avalanche.svg'
import BSC from 'assets/svg/about_icon_bsc.svg'
import ForTraderImage from 'assets/svg/for_trader.svg'
import KyberDark from 'assets/svg/kyber/about_icon_kyber.svg'
import { ReactComponent as KNCSVG } from 'assets/svg/kyber/knc_black.svg'
import { ButtonPrimary } from 'components/Button'
import { BestPrice, Clock, LineaFull, LowestSlippage, OptimismLogoFull, PolygonLogoFull } from 'components/Icons'
import Loader from 'components/Loader'
import RevealOnScroll from 'components/RevealOnScroll'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import AboutFooter from 'pages/About/AboutFooter'
import { formatBigLiquidity } from 'utils/formatBalance'

const KNCBlack = () => <KNCSVG className="[&_path]:fill-textReverse" />

const ForTraderInfoRow = ({ children }: { children: React.ReactNode }) => (
  <HStack className="flex-1 basis-full max-lg:size-full max-lg:flex-1 max-lg:gap-4">{children}</HStack>
)

const ForTraderInfoCell = ({ children }: { children: React.ReactNode }) => (
  <Stack className="flex-1 basis-full items-center gap-2 max-lg:flex-1">{children}</Stack>
)

const ForTraderDivider = () => <div className="h-12 w-px bg-border max-md:h-auto" />

const KSStatistic = () => {
  const { supportedChains } = useChainsConfig()

  return (
    <HStack className="items-center justify-center rounded-lg border border-primary bg-background py-5 max-lg:flex-col max-lg:gap-4 max-lg:px-4">
      <ForTraderInfoRow>
        <ForTraderInfoCell>
          <span className="text-2xl font-semibold">$24B</span>
          <span className="text-sm text-subText">
            <Trans>TVL From DEXs</Trans>
          </span>
        </ForTraderInfoCell>

        <ForTraderDivider />

        <ForTraderInfoCell>
          <span className="text-2xl font-semibold">70+</span>
          <span className="text-sm text-subText">
            <Trans>DEXs</Trans>
          </span>
        </ForTraderInfoCell>
      </ForTraderInfoRow>

      {/* Between-rows divider: horizontal when the two rows stack (≤1200), vertical side-by-side (>1200). */}
      <div className="h-px w-full bg-border lg:h-[50px] lg:w-px" />

      <ForTraderInfoRow>
        <ForTraderInfoCell>
          <span className="text-2xl font-semibold">{supportedChains.length}+</span>
          <span className="text-sm text-subText">
            <Trans>Chains</Trans>
          </span>
        </ForTraderInfoCell>
        <ForTraderDivider />
        <ForTraderInfoCell>
          <span className="text-2xl font-semibold">20,000+</span>
          <span className="text-sm text-subText">
            <Trans>Tokens</Trans>
          </span>
        </ForTraderInfoCell>
      </ForTraderInfoRow>
    </HStack>
  )
}

function AboutKyberSwap() {
  const { data: aggregatorData } = aggregatorStatsApi.useGetAggregatorVolumeQuery({})
  const { networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

  const dataToShow = {
    totalTradingVolume: aggregatorData?.totalVolume,
    '24hTradingVolume': aggregatorData?.last24hVolume,
  }

  const { supportedChains } = useChainsConfig()

  return (
    <div className="relative w-full bg-buttonBlack">
      <Center
        className="w-full bg-transparent"
        style={{
          backgroundImage: `url(${AboutBackground}), url(${AboutBackground})`,
          backgroundSize: 'contain, contain',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundPosition: 'top, bottom',
        }}
      >
        <Stack className="w-full max-w-[1228px] gap-20 bg-transparent px-4 py-20 sm:px-6 lg:gap-32 lg:py-32">
          <RevealOnScroll>
            <Stack className="gap-12">
              <Stack className="items-center gap-8">
                <h1 className="text-center text-3xl font-light sm:text-5xl">
                  <Trans>
                    <span className="font-medium text-primary">Swap</span> Tokens at Superior Rates
                  </Trans>
                </h1>

                <HStack className="w-full flex-wrap justify-center gap-4">
                  {supportedChains.map(({ chainId: chain, icon, name }) => (
                    <img className="size-9 object-contain" src={icon} alt={name} key={chain} />
                  ))}
                </HStack>

                <Stack className="w-full items-center gap-4">
                  <p className="text-center text-base text-text sm:text-lg">
                    <Trans>
                      KyberSwap is a decentralized platform. We provide our traders with <b>superior token prices</b> by
                      analyzing rates across thousands of exchanges instantly!
                    </Trans>
                  </p>
                  <ButtonPrimary
                    as={Link}
                    to={`${APP_PATHS.SWAP}/${networkInfo.route}?highlightBox=true`}
                    className="w-56 gap-2 rounded-full px-3 py-2.5"
                    onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
                  >
                    <Repeat size={20} />
                    <span className="text-sm font-medium">
                      <Trans>Swap Now</Trans>
                    </span>
                  </ButtonPrimary>
                </Stack>
              </Stack>

              <HStack className="w-full max-w-[900px] justify-center gap-4 self-center">
                <Stack className="flex-1 items-center gap-2 rounded-lg bg-background py-5 text-center text-sm">
                  <span className="flex min-h-[1.2em] items-center justify-center text-2xl font-semibold sm:text-3xl">
                    {dataToShow.totalTradingVolume ? (
                      formatBigLiquidity(dataToShow.totalTradingVolume, 2, true)
                    ) : (
                      <Loader />
                    )}
                  </span>
                  <span className="text-subText">
                    <Trans>Total Trading Volume</Trans>*
                  </span>
                </Stack>
                <Stack className="flex-1 items-center gap-2 rounded-lg bg-background py-5 text-center text-sm">
                  <span className="flex min-h-[1.2em] items-center justify-center text-2xl font-semibold sm:text-3xl">
                    {dataToShow['24hTradingVolume'] ? (
                      formatBigLiquidity(dataToShow['24hTradingVolume'], 2, true)
                    ) : (
                      <Loader />
                    )}
                  </span>
                  <span className="text-subText">
                    <Trans>24H Trading Volume</Trans>*
                  </span>
                </Stack>
              </HStack>
            </Stack>
          </RevealOnScroll>

          <RevealOnScroll>
            <HStack className="gap-8 max-md:flex-col">
              <Stack className="h-max flex-1 gap-8">
                <Stack className="gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary sm:text-base">
                    <Trans>FOR TRADERS</Trans>
                  </p>
                  <h2 className="text-2xl font-medium sm:text-4xl">
                    <Trans>Swap your tokens at superior rates. No limits</Trans>
                  </h2>
                </Stack>

                <Stack className="gap-4 text-base text-text">
                  <p>
                    <Trans>
                      With our Dynamic Trade Routing technology, we aggregate liquidity from multiple DEXs and identify
                      superior trade routes for you.
                    </Trans>
                  </p>

                  <HStack className="items-center gap-4">
                    <BestPrice />
                    <span>
                      <Trans>Superior price guaranteed</Trans>
                    </span>
                  </HStack>
                  <HStack className="items-center gap-4">
                    <LowestSlippage />
                    <span>
                      <Trans>Lowest possible slippage</Trans>
                    </span>
                  </HStack>

                  <HStack className="items-center gap-4">
                    <Clock className="text-primary" />
                    <span>
                      <Trans>Save time & effort</Trans>
                    </span>
                  </HStack>
                </Stack>

                <ButtonPrimary
                  className="hidden w-56 gap-2 rounded-full px-3 py-2.5 sm:flex"
                  as={Link as never}
                  to={APP_PATHS.SWAP}
                  onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
                >
                  <Repeat size={20} />
                  <span className="text-sm font-medium">
                    <Trans>Swap Now</Trans>
                  </span>
                </ButtonPrimary>
              </Stack>
              <Stack className="flex-1 gap-4">
                <img width="100%" src={ForTraderImage} alt="ForTrader" />
                <KSStatistic />
              </Stack>
              <ButtonPrimary
                className="w-full gap-2 rounded-full px-3 py-2.5 sm:hidden"
                as={Link as never}
                to={APP_PATHS.SWAP}
                onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
              >
                <Repeat />
                <span className="text-sm font-medium">
                  <Trans>Swap Now</Trans>
                </span>
              </ButtonPrimary>
            </HStack>
          </RevealOnScroll>

          <RevealOnScroll>
            <HStack className="gap-8 max-md:flex-col lg:gap-12">
              <img src={KNCGraphic} alt="KNCGraphic" className="hidden h-[400px] w-auto md:block" />
              <Stack className="h-max w-full gap-8 self-center">
                <Stack className="gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary sm:text-base">
                    <Trans>ABOUT KNC</Trans>
                  </p>
                  <h2 className="text-2xl font-medium sm:text-4xl">
                    <Trans>Kyber Network Crystal (KNC)</Trans>
                  </h2>
                </Stack>
                <p className="text-base text-text">
                  <Trans>
                    KNC is a utility and governance token, and an integral part of Kyber Network and its flagship
                    product KyberSwap. It is the glue that connects different stakeholders in Kyber&apos;s ecosystem.
                  </Trans>
                </p>
                <img src={KNCGraphic} alt="KNCGraphic" className="block w-3/4 self-center md:hidden" />
                <ButtonPrimary
                  className="w-full gap-2 rounded-full px-3 py-2.5 sm:w-56"
                  as={Link as never}
                  to="/about/knc"
                >
                  <KNCBlack />
                  <span className="text-sm font-medium">
                    <Trans>Find out more</Trans>
                  </span>
                </ButtonPrimary>
              </Stack>
            </HStack>
          </RevealOnScroll>

          <RevealOnScroll>
            <Stack className="gap-8">
              <h2 className="text-center text-2xl font-medium sm:text-4xl">
                <Trans>Powered by</Trans>
              </h2>

              <div className="grid grid-cols-2 items-center justify-center gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

                <HStack className="items-center justify-center gap-4">
                  <img
                    src="https://storage.googleapis.com/ks-setting-1d682dca/68e11813-067b-42d7-8d7a-c1b7bf80714e1739239376230.png"
                    alt="Bera"
                    width="80px"
                  />
                  <span>Berachain</span>
                </HStack>

                <HStack className="items-center justify-center gap-4">
                  <img src="https://docs.roninchain.com/img/logo.svg" alt="Ronin" className="h-20 w-auto" />
                  <span>Roninchain</span>
                </HStack>
                <img src="https://www.etherlink.com/logo-desktop.svg" alt="Etherlink" width="100%" />
                <HStack className="items-center justify-center gap-4">
                  <img
                    src="https://storage.googleapis.com/ks-setting-1d682dca/9cdb1542-1d9a-4cf0-b67b-b68b1a29b09d1758725874771.png"
                    alt="Plasma"
                    width="80px"
                  />
                  <span>Plasma</span>
                </HStack>
                <HStack className="items-center justify-center gap-4">
                  <img src={monadIcon} alt="Monad" width="80px" />
                  <span>Monad</span>
                </HStack>
                <HStack className="items-center justify-center gap-4">
                  <img src={megaEthIcon} alt="MegaETH" width="80px" />
                  <span>MegaETH</span>
                </HStack>
                <HStack className="items-center justify-center gap-4">
                  <img src={robinhoodIcon} alt="Robinhood" width="80px" />
                  <span>Robinhood</span>
                </HStack>
              </div>
            </Stack>
          </RevealOnScroll>
        </Stack>
      </Center>
      <AboutFooter />
    </div>
  )
}

export default AboutKyberSwap
