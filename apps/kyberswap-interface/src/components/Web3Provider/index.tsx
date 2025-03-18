import { blocto } from '@blocto/wagmi-connector'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { watchChainId } from '@wagmi/core'
import { ReactNode, useEffect, useMemo } from 'react'
import { createClient, http } from 'viem'
import {
  arbitrum,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  fantom,
  linea,
  mainnet,
  mantle,
  optimism,
  polygon,
  scroll,
  sonic,
  zksync,
  ronin,
} from 'viem/chains'
import { Connector, WagmiProvider, createConfig, createConnector, useConnect } from 'wagmi'
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors'

import WC_BG from 'assets/images/wc-bg.png'
import Kyber from 'assets/svg/kyber/logo_kyberswap_with_padding.svg'
import BLOCTO_ICON from 'assets/wallets-connect/bocto.svg'
import COINBASE_ICON from 'assets/wallets-connect/coinbase.svg'
import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'
import SAFE_ICON from 'assets/wallets-connect/safe.svg'
import WALLET_CONNECT_ICON from 'assets/wallets-connect/wallet-connect.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import { WALLETCONNECT_PROJECT_ID } from 'constants/env'
import { isSupportedChainId } from 'constants/networks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'

export const queryClient = new QueryClient()

export const CONNECTION = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  UNISWAP_WALLET_CONNECT_CONNECTOR_ID: 'uniswapWalletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  INJECTED_CONNECTOR_TYPE: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
  BLOCTO_ID: 'blocto',
  //UNISWAP_EXTENSION_RDNS: 'org.uniswap.app',
  SAFE_CONNECTOR_ID: 'safe',
} as const

export const CONNECTOR_ICON_OVERRIDE_MAP: { [id in string]?: string } = {
  [CONNECTION.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION.SAFE_CONNECTOR_ID]: SAFE_ICON,
  [CONNECTION.BLOCTO_ID]: BLOCTO_ICON,
}

type ConnectorID = (typeof CONNECTION)[keyof typeof CONNECTION]

export function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options: { shouldThrow: true },
): Connector
export function getConnectorWithId(connectors: readonly Connector[], id: ConnectorID): Connector | undefined
export function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options?: { shouldThrow: true },
): Connector | undefined {
  const connector = connectors.find(c => c.id === id)
  if (!connector && options?.shouldThrow) {
    throw new Error(`Expected connector ${id} missing from wagmi context.`)
  }
  return connector
}

/** Returns a wagmi `Connector` with the given id. If `shouldThrow` is passed, an error will be thrown if the connector is not found. */
export function useConnectorWithId(id: ConnectorID, options: { shouldThrow: true }): Connector
export function useConnectorWithId(id: ConnectorID): Connector | undefined
export function useConnectorWithId(id: ConnectorID, options?: { shouldThrow: true }): Connector | undefined {
  const { connectors } = useConnect()
  return useMemo(
    () => (options?.shouldThrow ? getConnectorWithId(connectors, id, options) : getConnectorWithId(connectors, id)),
    [connectors, id, options],
  )
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
  showQrModal: true,
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
      '--wcm-z-index': '1000',
      '--wcm-logo-image-url': Kyber,
      '--wcm-background-image-url': WC_BG,
      '--wcm-accent-color': '#31CB9E',
      '--wcm-accent-fill-color': '#222222',
      '--wcm-color-bg-1': '#0F0F0F',
      '--wcm-background-color': '#31CB9E',
    },
  },
}

export const wagmiConfig = createConfig({
  chains: [
    mainnet,
    arbitrum,
    optimism,
    zksync,
    polygon,
    base,
    bsc,
    linea,
    mantle,
    scroll,
    avalanche,
    fantom,
    blast,
    sonic,
    berachain,
    ronin,
  ],
  connectors: [
    injectedWithFallback(),
    walletConnect(WC_PARAMS),
    coinbaseWallet({
      appName: 'KyberSwap',
      appLogoUrl: 'https://kyberswap.com/favicon.png',
      reloadOnDisconnect: false,
      enableMobileWalletLink: true,
    }),
    blocto({ appId: 'fbd356ae-8f39-4650-ab42-4ef8cb9e15c9' }),
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
  const dispatch = useAppDispatch()
  useEffect(() => {
    const unwatch = watchChainId(wagmiConfig, {
      onChange(chainId) {
        if (isSupportedChainId(chainId)) {
          dispatch(updateChainId(chainId as any))
        }
      },
    })
    return () => {
      unwatch()
    }
  }, [dispatch])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
