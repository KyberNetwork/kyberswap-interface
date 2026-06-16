import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Archive, Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

import GeckoterminalIcon from 'assets/images/geckoterminal_dark.png'
import KNCGraphic from 'assets/images/knc-graphic.png'
import CoinGecko from 'assets/svg/coingecko_color.svg'
import CoinMarketCap from 'assets/svg/coinmarketcap.svg'
import KyberDao from 'assets/svg/kyber/kyber-dao.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import TrophyIcon from 'assets/svg/trophy.svg'
import Argent from 'assets/wallets/argent.svg'
import ArgentLight from 'assets/wallets/argent_light.svg'
import Coin98 from 'assets/wallets/coin98.svg'
import Enjin from 'assets/wallets/enjin.svg'
import KrystalWallet from 'assets/wallets/krystal.svg'
import KrystalLight from 'assets/wallets/krystal_light.svg'
import Ledger from 'assets/wallets/ledger.svg'
import LedgerLight from 'assets/wallets/ledger_light.svg'
import Metamask from 'assets/wallets/metamask.svg'
import MetamaskLight from 'assets/wallets/metamask_light.svg'
import Mew from 'assets/wallets/mew.svg'
import Trezor from 'assets/wallets/trezor.svg'
import TrezorLight from 'assets/wallets/trezor_light.svg'
import Trust from 'assets/wallets/trust.svg'
import TrustLight from 'assets/wallets/trust_light.svg'
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
import { FooterSocialLink } from 'components/Footer/Footer'
import RevealOnScroll from 'components/RevealOnScroll'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ExternalLink, StyledInternalLink } from 'theme'

import {
  AboutPage,
  BtnPrimary,
  Exchange,
  ExchangeWrapper,
  Footer,
  FooterContainer,
  ForLiquidityProviderItem,
  GridWrapper,
  MoreInfoWrapper,
  SupportedChain,
  VerticalDivider,
  Wrapper,
} from './styleds'

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

const LIST_WALLETS = [
  { logo: Ledger, lightLogo: LedgerLight },
  { logo: Metamask, lightLogo: MetamaskLight },
  { logo: Coin98, lightLogo: Coin98 },
  { logo: KrystalWallet, lightLogo: KrystalLight },
  { logo: Trezor, lightLogo: TrezorLight },
  { logo: Mew, lightLogo: Mew },
  { logo: Trust, lightLogo: TrustLight },
  { logo: Enjin, lightLogo: Enjin },
  { logo: Argent, lightLogo: ArgentLight },
  { logo: 'https://rabby.io/assets/images/logo-new.svg', lightLogo: 'https://rabby.io/assets/images/logo-new.svg' },
  {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Coinbase.svg/1024px-Coinbase.svg.png',
    lightLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Coinbase.svg/1024px-Coinbase.svg.png',
  },
  {
    logo: 'https://www.cloudwards.net/wp-content/uploads/2023/05/OKX-logo.png',
    lightLogo: 'https://www.cloudwards.net/wp-content/uploads/2023/05/OKX-logo.png',
  },
]

function AboutKNC() {
  const theme = useTheme()
  const { trackingHandler } = useTracking()

  const DynamicTokenModel = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem className="min-h-[360px] flex-1 flex-col items-center sm:items-start" style={{ width }}>
      <img width="64px" src={RocketIcon} alt="rocket_icon" />
      <p className="mt-7 text-[16px] font-medium uppercase text-primary">
        <Trans>Dynamic Token Model</Trans>
      </p>

      <p className="mt-6 text-center leading-normal text-text min-[500px]:text-start">
        <Trans>
          KNC enables KyberDAO to shape token behaviour and upgrades, making KNC much more adaptable and providing
          better support for innovation and growth.
        </Trans>
      </p>
    </ForLiquidityProviderItem>
  )

  const ParticipationRewards = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem className="min-h-[360px] flex-1 flex-col items-center sm:items-start" style={{ width }}>
      <img width="64px" src={TrophyIcon} alt="trophy_icon" />
      <p className="mt-7 text-[16px] font-medium uppercase text-primary">
        <Trans>Participation Rewards</Trans>
      </p>

      <p className="mt-6 text-center leading-normal text-text min-[500px]:text-start">
        <Trans>
          KNC holders can stake KNC in KyberDAO and vote on important decisions. Voters receive trading fees generated
          on KyberSwap and other benefits from ecosystem collaborations on Kyber.
        </Trans>
      </p>
    </ForLiquidityProviderItem>
  )

  return (
    <div className="relative w-screen overflow-hidden bg-buttonBlack">
      <AboutPage>
        <Wrapper>
          <RevealOnScroll>
            <h1 className="text-center text-[28px] font-light leading-[32px] sm:text-[48px] sm:leading-[60px]">
              <Trans>
                Kyber Network Crystal <span className="font-medium text-primary">(KNC)</span>
              </Trans>
            </h1>

            <p className="mt-10 text-center text-[1rem] leading-normal text-text sm:mt-12 sm:text-[1.25rem]">
              <Trans>
                KNC is a utility and governance token and an integral part of Kyber Network and its product KyberSwap -
                the multi-chain decentralized exchange (DEX) that provides superior rates for traders.{' '}
              </Trans>
            </p>

            <SupportedChain>
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
            </SupportedChain>
          </RevealOnScroll>

          <RevealOnScroll>
            <p className="mt-[100px] text-center text-[20px] font-medium text-primary sm:mt-[160px]">
              <Trans>TOKEN UTILITY</Trans>
            </p>
            <h2 className="mt-3 text-center text-[28px] font-medium sm:text-[36px]">
              <Trans>What is KNC used for?</Trans>
            </h2>
            <p className="mt-10 text-center text-[1rem] leading-normal text-text sm:mt-12">
              <Trans>
                KNC token holders can benefit from our flagship product KyberSwap. Holders can stake their KNC & vote on
                initiatives to receive trading fees generated on KyberSwap! More trades on KyberSwap can generate more
                rewards for KNC holders!
                <br />
                <br />
                KNC token is dynamic - it can be upgraded, minted or burned by KyberDAO to better support liquidity and
                growth.
              </Trans>
            </p>

            {/* ≥768: side-by-side fixed-width cards; <768: horizontally-scrollable grid. Both rendered,
                toggled via CSS so server + client first render match (hydration-safe). */}
            <div className="mt-10 hidden flex-row gap-6 sm:mt-12 sm:flex">
              <ParticipationRewards width="392px" />
              <DynamicTokenModel width="392px" />
            </div>
            <GridWrapper className="sm:hidden">
              <ParticipationRewards />
              <DynamicTokenModel />
            </GridWrapper>

            <div className="m-auto mt-10 flex w-full justify-center gap-4 sm:mt-12 sm:w-[236px] sm:gap-6">
              <BtnPrimary
                width="216px"
                as={Link as any}
                to={APP_PATHS.SWAP}
                onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
              >
                <Repeat />
                <span className="ml-2 text-[16px]">
                  <Trans>Swap Now</Trans>
                </span>
              </BtnPrimary>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="mt-[100px] flex flex-col items-center gap-6 sm:mt-[160px] sm:flex-row">
              <img width="85%" src={KyberDao} alt="KyberDao" className="hidden sm:block" />
              <div className="flex h-max w-full flex-col">
                <p className="text-[20px] font-medium text-primary sm:text-[24px]">
                  <Trans>KYBER DAO</Trans>
                </p>
                <h2 className="mt-3 text-[28px] font-medium sm:text-[36px]">
                  <Trans>Stake KNC, Vote, Earn Rewards.</Trans>
                </h2>
                <p className="mt-10 text-left text-[16px] leading-6 text-text sm:mt-12">
                  <Trans>
                    KyberDAO is a community platform that allows KNC token holders to participate in governance. KNC
                    holders can stake KNC to vote on proposals. In return, they receive rewards from fees generated on
                    KyberSwap through trading activities in Kyber Network.
                  </Trans>
                </p>
                <img width="100%" src={KyberDao} alt="KyberDao" className="mt-10 block sm:hidden" />

                <BtnPrimary
                  className="w-full sm:w-[236px]"
                  margin="40px 0 0"
                  as={Link as any}
                  to={APP_PATHS.KYBERDAO_STAKE}
                  onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_STAKE_KNC_CLICKED)}
                >
                  <Archive />
                  <span className="ml-2 text-[16px]">
                    <Trans>Stake KNC</Trans>
                  </span>
                </BtnPrimary>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h2 className="mt-[100px] text-center text-[28px] font-medium sm:mt-[160px] sm:text-[36px]">
              <Trans>Where you can buy KNC</Trans>
            </h2>

            {/* ≥768: static grid; <768: carousel. Both rendered, toggled via CSS (hydration-safe). */}
            <Exchange className="hidden sm:grid">
              {LIST_EXCHANGES.map(exchange => (
                <div key={exchange.name} className="m-auto flex">
                  {exchange.logo}
                </div>
              ))}
            </Exchange>
            <Swiper
              slidesPerView={1}
              spaceBetween={30}
              modules={[Pagination]}
              loop={true}
              pagination={{
                clickable: true,
              }}
              className="mt-6 sm:hidden"
            >
              {LIST_EXCHANGES.map(exchange => (
                <SwiperSlide key={exchange.name}>
                  <ExchangeWrapper>
                    <div className="m-auto flex">{exchange.logo}</div>
                  </ExchangeWrapper>
                </SwiperSlide>
              ))}
            </Swiper>
            <h2 className="mt-[100px] text-center text-[28px] font-medium sm:mt-[160px] sm:text-[36px]">
              <Trans>Where you can store KNC</Trans>
            </h2>
            <p className="mt-10 text-center text-[16px] leading-6 text-text sm:mt-12">
              <Trans>
                KNC is an ERC-20 token, so it can be stored in many Web3 wallets you control. Below are some examples.
              </Trans>
            </p>

            <Exchange className="hidden sm:grid">
              {LIST_WALLETS.map(wallet => (
                <img key={wallet.logo} src={wallet.logo} alt={wallet.logo} className="m-auto" width="100%" />
              ))}
            </Exchange>
            <Swiper
              slidesPerView={1}
              spaceBetween={30}
              modules={[Pagination]}
              loop={true}
              pagination={{
                clickable: true,
              }}
              className="mt-6 sm:hidden"
            >
              {LIST_WALLETS.map(wallet => (
                <SwiperSlide key={wallet.logo}>
                  <ExchangeWrapper>
                    <img src={wallet.logo} alt={wallet.logo} width="160px" className="m-auto" />
                  </ExchangeWrapper>
                </SwiperSlide>
              ))}
            </Swiper>

            <MoreInfoWrapper>
              <div className="mr-0 flex flex-col items-center sm:mr-[180px] sm:items-start">
                <h2 className="text-[28px] font-medium sm:text-[36px]">
                  <Trans>More information about KNC is available on:</Trans>
                </h2>
                <div className="mt-12 flex flex-col items-center gap-12 sm:flex-row">
                  <ExternalLink href={`https://www.coingecko.com/en/coins/kyber-network-crystal`}>
                    <img src={CoinGecko} alt="CoinGecko" width="165px" />
                  </ExternalLink>
                  <ExternalLink href={`https://coinmarketcap.com/currencies/kyber-network-crystal-v2/`}>
                    <img src={CoinMarketCap} alt="CoinMarketCap" width="227px" />
                  </ExternalLink>
                  <ExternalLink href="https://www.geckoterminal.com/eth/pools/0xa38a0165e82b7a5e8650109e9e54087a34c93020">
                    <img src={GeckoterminalIcon} alt="Geckoterminal" width="235px" />
                  </ExternalLink>
                </div>
              </div>
              <img src={KNCGraphic} alt="KNCGraphic" className="w-[287px] sm:w-[218px]" />
            </MoreInfoWrapper>
          </RevealOnScroll>
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
            <div className="min-[500px]:hidden" />
            <VerticalDivider className="hidden min-[500px]:block" />
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

export default AboutKNC
