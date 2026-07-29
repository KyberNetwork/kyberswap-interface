import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Archive, Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

import AboutBackground from 'assets/images/about_background.png'
import GeckoterminalIcon from 'assets/images/geckoterminal_dark.png'
import KNCGraphic from 'assets/images/knc-graphic.png'
import CoinGecko from 'assets/svg/coingecko_color.svg'
import CoinMarketCap from 'assets/svg/coinmarketcap.svg'
import KyberDao from 'assets/svg/kyber/kyber-dao.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import TrophyIcon from 'assets/svg/trophy.svg'
import Argent from 'assets/wallets/argent.svg'
import Coin98 from 'assets/wallets/coin98.svg'
import Enjin from 'assets/wallets/enjin.svg'
import KrystalWallet from 'assets/wallets/krystal.svg'
import Ledger from 'assets/wallets/ledger.svg'
import Metamask from 'assets/wallets/metamask.svg'
import Mew from 'assets/wallets/mew.svg'
import Trezor from 'assets/wallets/trezor.svg'
import Trust from 'assets/wallets/trust.svg'
import { ButtonPrimary } from 'components/Button'
import {
  Binance,
  Bithumb,
  Bitrue,
  ChangeNow,
  Coinbase,
  Etoro,
  Gate,
  Gemini,
  Huobi,
  Kraken,
  Krystal,
  Kucoin,
  KyberSwap,
  Mexc,
  Okx,
  Upbit,
} from 'components/ExchangeIcons'
import RevealOnScroll from 'components/RevealOnScroll'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import AboutFooter from 'pages/About/AboutFooter'
import { ExternalLink } from 'theme'

const LIST_EXCHANGES = [
  { name: 'KyberSwap', logo: <KyberSwap /> },
  { name: 'Krystal', logo: <Krystal /> },
  { name: 'Binance', logo: <Binance /> },
  { name: 'Mexc', logo: <Mexc /> },
  { name: 'Etoro', logo: <Etoro /> },
  { name: 'Huobi', logo: <Huobi /> },
  { name: 'Upbit', logo: <Upbit /> },
  { name: 'Kraken', logo: <Kraken /> },
  { name: 'Kucoin', logo: <Kucoin /> },
  { name: 'Gate', logo: <Gate /> },
  { name: 'Coinbase', logo: <Coinbase width={160} /> },
  { name: 'Bithumb', logo: <Bithumb /> },
  { name: 'Gemini', logo: <Gemini /> },
  { name: 'Okx', logo: <Okx /> },
  { name: 'ChangeNow', logo: <ChangeNow /> },
  { name: 'Bitrue', logo: <Bitrue /> },
]

const WALLET_LOGOS = [
  Ledger,
  Metamask,
  Coin98,
  KrystalWallet,
  Trezor,
  Mew,
  Trust,
  Enjin,
  Argent,
  'https://rabby.io/assets/images/logo-new.svg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Coinbase.svg/250px-Coinbase.svg.png',
  'https://www.cloudwards.net/wp-content/uploads/2023/05/OKX-logo.png',
]

const UtilityCard = ({
  children,
  icon,
  title,
}: {
  children: React.ReactNode
  icon: string
  title: React.ReactNode
}) => (
  <Stack className="min-h-80 w-full items-center gap-4 rounded-2xl bg-background p-8 md:items-start lg:p-12">
    <img width="64px" src={icon} alt="" />
    <Stack className="items-center gap-4 md:items-start">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</p>
      <p className="text-center text-base text-text md:text-start">{children}</p>
    </Stack>
  </Stack>
)

function AboutKNC() {
  const { trackingHandler } = useTracking()

  return (
    <div className="relative w-full overflow-hidden bg-buttonBlack">
      <Center
        className="w-full bg-transparent"
        style={{
          backgroundImage: `url(${AboutBackground}), url(${AboutBackground})`,
          backgroundSize: 'contain, contain',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundPosition: 'top, bottom',
        }}
      >
        <Stack className="w-full max-w-[1228px] gap-20 bg-transparent px-4 py-20 sm:px-6 lg:gap-32 lg:py-32 [&_.swiper-pagination-bullet-active]:w-2 [&_.swiper-pagination-bullet-active]:rounded-lg [&_.swiper-pagination-bullet-active]:bg-primary [&_.swiper-pagination-bullet]:w-2 [&_.swiper-pagination-bullet]:rounded-lg [&_.swiper-pagination-bullet]:bg-subText [&_.swiper-pagination]:!-bottom-4 [&_.swiper]:!overflow-visible">
          <RevealOnScroll>
            <Stack className="items-center gap-8">
              <h1 className="text-center text-3xl font-light sm:text-5xl">
                <Trans>
                  Kyber Network Crystal <span className="font-medium text-primary">(KNC)</span>
                </Trans>
              </h1>

              <Stack className="w-full items-center gap-4">
                <p className="w-full text-center text-base text-text sm:text-lg">
                  <Trans>
                    KNC is a utility and governance token and an integral part of Kyber Network and its product
                    KyberSwap - the multi-chain decentralized exchange (DEX) that provides superior rates for traders.{' '}
                  </Trans>
                </p>

                <HStack className="w-full flex-wrap justify-center gap-4">
                  {[
                    ChainId.MAINNET,
                    ChainId.BASE,
                    ChainId.MATIC,
                    ChainId.BSCMAINNET,
                    ChainId.AVAXMAINNET,
                    ChainId.ARBITRUM,
                    ChainId.OPTIMISM,
                    ChainId.LINEA,
                  ].map(item => (
                    <img
                      src={NETWORKS_INFO[item].icon}
                      width="36px"
                      alt={NETWORKS_INFO[item].name}
                      key={NETWORKS_INFO[item].name}
                    />
                  ))}
                </HStack>
              </Stack>
            </Stack>
          </RevealOnScroll>

          <RevealOnScroll>
            <Stack className="items-center gap-8">
              <Stack className="items-center gap-2">
                <p className="text-center text-sm font-semibold uppercase tracking-wide text-primary sm:text-base">
                  <Trans>TOKEN UTILITY</Trans>
                </p>
                <h2 className="text-center text-2xl font-medium sm:text-4xl">
                  <Trans>What is KNC used for?</Trans>
                </h2>
              </Stack>

              <Stack className="w-full gap-4 text-center text-base text-text">
                <p>
                  <Trans>
                    KNC token holders can benefit from our flagship product KyberSwap. Holders can stake their KNC &
                    vote on initiatives to receive trading fees generated on KyberSwap! More trades on KyberSwap can
                    generate more rewards for KNC holders!
                  </Trans>
                </p>
                <p>
                  <Trans>
                    KNC token is dynamic - it can be upgraded, minted or burned by KyberDAO to better support liquidity
                    and growth.
                  </Trans>
                </p>
              </Stack>

              <div className="grid w-full gap-8 md:grid-cols-2">
                <UtilityCard icon={TrophyIcon} title={<Trans>Participation Rewards</Trans>}>
                  <Trans>
                    KNC holders can stake KNC in KyberDAO and vote on important decisions. Voters receive trading fees
                    generated on KyberSwap and other benefits from ecosystem collaborations on Kyber.
                  </Trans>
                </UtilityCard>
                <UtilityCard icon={RocketIcon} title={<Trans>Dynamic Token Model</Trans>}>
                  <Trans>
                    KNC enables KyberDAO to shape token behaviour and upgrades, making KNC much more adaptable and
                    providing better support for innovation and growth.
                  </Trans>
                </UtilityCard>
              </div>

              <Center className="w-full sm:w-56">
                <ButtonPrimary
                  className="w-full gap-2 rounded-full px-3 py-2.5"
                  as={Link as any}
                  to={APP_PATHS.SWAP}
                  onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
                >
                  <Repeat />
                  <span className="text-sm font-medium">
                    <Trans>Swap Now</Trans>
                  </span>
                </ButtonPrimary>
              </Center>
            </Stack>
          </RevealOnScroll>

          <RevealOnScroll>
            <HStack className="items-center gap-8 max-md:flex-col">
              <img src={KyberDao} alt="KyberDao" className="hidden w-[45%] md:block" />
              <Stack className="h-max flex-1 gap-8">
                <Stack className="gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary sm:text-base">
                    <Trans>KYBER DAO</Trans>
                  </p>
                  <h2 className="text-2xl font-medium sm:text-4xl">
                    <Trans>Stake KNC, Vote, Earn Rewards.</Trans>
                  </h2>
                </Stack>
                <p className="text-left text-base text-text">
                  <Trans>
                    KyberDAO is a community platform that allows KNC token holders to participate in governance. KNC
                    holders can stake KNC to vote on proposals. In return, they receive rewards from fees generated on
                    KyberSwap through trading activities in Kyber Network.
                  </Trans>
                </p>
                <img width="100%" src={KyberDao} alt="KyberDao" className="block md:hidden" />

                <ButtonPrimary
                  className="w-full gap-2 rounded-full px-3 py-2.5 sm:w-56"
                  as={Link as any}
                  to={APP_PATHS.KYBERDAO_STAKE}
                  onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_STAKE_KNC_CLICKED)}
                >
                  <Archive />
                  <span className="text-sm font-medium">
                    <Trans>Stake KNC</Trans>
                  </span>
                </ButtonPrimary>
              </Stack>
            </HStack>
          </RevealOnScroll>

          <RevealOnScroll>
            <Stack className="gap-20 lg:gap-32">
              <Stack className="gap-8">
                <h2 className="text-center text-2xl font-medium sm:text-4xl">
                  <Trans>Where you can buy KNC</Trans>
                </h2>

                <div className="hidden grid-cols-4 items-center gap-8 md:grid [&_svg]:max-w-full">
                  {LIST_EXCHANGES.map(exchange => (
                    <Center key={exchange.name}>{exchange.logo}</Center>
                  ))}
                </div>
                <Swiper
                  slidesPerView={1}
                  spaceBetween={32}
                  modules={[Pagination]}
                  loop={true}
                  pagination={{
                    clickable: true,
                  }}
                  className="md:hidden"
                >
                  {LIST_EXCHANGES.map(exchange => (
                    <SwiperSlide key={exchange.name}>
                      <Center className="h-40 rounded-lg bg-background">{exchange.logo}</Center>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Stack>

              <Stack className="gap-12">
                <Stack className="gap-8">
                  <Stack className="items-center gap-4">
                    <h2 className="text-center text-2xl font-medium sm:text-4xl">
                      <Trans>Where you can store KNC</Trans>
                    </h2>
                    <p className="w-full text-center text-base text-text">
                      <Trans>
                        KNC is an ERC-20 token, so it can be stored in many Web3 wallets you control. Below are some
                        examples.
                      </Trans>
                    </p>
                  </Stack>

                  <div className="hidden grid-cols-4 items-center gap-8 md:grid">
                    {WALLET_LOGOS.map(logo => (
                      <Center key={logo}>
                        <img src={logo} alt={logo} width="100%" />
                      </Center>
                    ))}
                  </div>
                  <Swiper
                    slidesPerView={1}
                    spaceBetween={32}
                    modules={[Pagination]}
                    loop={true}
                    pagination={{
                      clickable: true,
                    }}
                    className="md:hidden"
                  >
                    {WALLET_LOGOS.map(logo => (
                      <SwiperSlide key={logo}>
                        <Center className="h-40 rounded-lg bg-background">
                          <img src={logo} alt={logo} width="160px" />
                        </Center>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </Stack>

                <HStack className="w-full items-center justify-between gap-8 rounded-2xl bg-background p-8 max-lg:flex-col max-lg:text-center lg:p-12">
                  <Stack className="items-center gap-8 lg:items-start">
                    <h2 className="text-2xl font-medium sm:text-3xl">
                      <Trans>More information about KNC is available on:</Trans>
                    </h2>
                    <HStack className="flex-wrap items-center justify-center gap-8 lg:justify-start">
                      <ExternalLink href={`https://www.coingecko.com/en/coins/kyber-network-crystal`}>
                        <img src={CoinGecko} alt="CoinGecko" width="165px" />
                      </ExternalLink>
                      <ExternalLink href={`https://coinmarketcap.com/currencies/kyber-network-crystal-v2/`}>
                        <img src={CoinMarketCap} alt="CoinMarketCap" width="227px" />
                      </ExternalLink>
                      <ExternalLink href="https://www.geckoterminal.com/eth/pools/0xa38a0165e82b7a5e8650109e9e54087a34c93020">
                        <img src={GeckoterminalIcon} alt="Geckoterminal" width="235px" />
                      </ExternalLink>
                    </HStack>
                  </Stack>
                  <img src={KNCGraphic} alt="KNCGraphic" className="w-56" />
                </HStack>
              </Stack>
            </Stack>
          </RevealOnScroll>
        </Stack>
      </Center>
      <AboutFooter />
    </div>
  )
}

export default AboutKNC
