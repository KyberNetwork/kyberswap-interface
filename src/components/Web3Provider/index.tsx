import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { createClient, http } from 'viem'
import {
  arbitrum,
  avalanche,
  base,
  bitTorrent,
  blast,
  bsc,
  cronos,
  fantom,
  linea,
  mainnet,
  mantle,
  optimism,
  polygon,
  polygonZkEvm,
  scroll,
  xLayer,
  zksync,
} from 'viem/chains'
import { WagmiProvider, createConfig, createConnector } from 'wagmi'
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors'

import WC_BG from 'assets/images/wc-bg.png'
import Kyber from 'assets/svg/kyber/logo_kyberswap_with_padding.svg'
import COINBASE_ICON from 'assets/wallets-connect/coinbase.svg'
import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'
import SAFE_ICON from 'assets/wallets-connect/safe.svg'
import WALLET_CONNECT_ICON from 'assets/wallets-connect/wallet-connect.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import { WALLETCONNECT_PROJECT_ID } from 'constants/env'

export const queryClient = new QueryClient()

export const CONNECTION = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  UNISWAP_WALLET_CONNECT_CONNECTOR_ID: 'uniswapWalletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  INJECTED_CONNECTOR_TYPE: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
  UNISWAP_EXTENSION_RDNS: 'org.uniswap.app',
  SAFE_CONNECTOR_ID: 'safe',
} as const

export const CONNECTOR_ICON_OVERRIDE_MAP: { [id in string]?: string } = {
  [CONNECTION.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION.SAFE_CONNECTOR_ID]: SAFE_ICON,
}

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

function injectedWithFallback() {
  return createConnector(config => {
    const injectedConnector = injected()(config)

    return {
      ...injectedConnector,
      connect(...params) {
        if (!window.ethereum) {
          window.open('https://metamask.io/', 'inst_metamask')
        }
        return injectedConnector.connect(...params)
      },
      get icon() {
        return !window.ethereum || window.ethereum?.isMetaMask ? METAMASK_ICON : INJECTED_DARK_ICON
      },
      get name() {
        return !window.ethereum ? 'Install MetaMask' : window.ethereum?.isMetaMask ? 'MetaMask' : 'Browser Wallet'
      },
    }
  })
}

const WC_PARAMS = {
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'KyberSwap',
    description: document.title,
    url: window.location.origin,
    icons: ['https://kyberswap.com/favicon.svg'],
  },
  qrModalOptions: {
    chainImages: undefined,
    themeMode: 'dark' as const,
    themeVariables: {
      '--w3m-z-index': '1000',
      '--w3m-logo-image-url': Kyber,
      '--w3m-background-image-url': WC_BG,
      '--w3m-accent-color': '#31CB9E',
      '--w3m-accent-fill-color': '#222222',
      '--w3m-color-bg-1': '#0F0F0F',
    } as any,
  },
}

export const wagmiConfig = createConfig({
  chains: [
    mainnet,
    arbitrum,
    optimism,
    zksync,
    polygon,
    polygonZkEvm,
    base,
    bsc,
    linea,
    mantle,
    scroll,
    avalanche,
    fantom,
    blast,
    xLayer,
    cronos,
    bitTorrent,
  ],
  connectors: [
    injectedWithFallback(),
    walletConnect(WC_PARAMS),
    //uniswapWalletConnect(),
    coinbaseWallet({
      appName: 'KyberSwap',
      appLogoUrl: Kyber,
      reloadOnDisconnect: false,
      enableMobileWalletLink: true,
    }),
    safe(),
  ],
  client({ chain }) {
    return createClient({
      chain,
      batch: { multicall: true },
      pollingInterval: 12_000,
      transport: http(),
    })
  },
})

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
