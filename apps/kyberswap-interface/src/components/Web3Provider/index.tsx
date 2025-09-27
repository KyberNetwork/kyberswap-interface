import { ChainId } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { watchChainId } from '@wagmi/core'
// import { porto } from 'porto/wagmi'
import { ReactNode, useEffect, useMemo } from 'react'
import { createClient, defineChain, http } from 'viem'
import {
  arbitrum,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  etherlink,
  fantom,
  linea,
  mainnet,
  mantle,
  optimism,
  polygon,
  ronin,
  scroll,
  sonic,
  unichain,
  zksync,
} from 'viem/chains'
import { Connector, WagmiProvider, createConfig, createConnector, useConnect } from 'wagmi'
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors'

import WC_BG from 'assets/images/wc-bg.png'
import Kyber from 'assets/svg/kyber/logo_kyberswap_with_padding.svg'
import COINBASE_ICON from 'assets/wallets-connect/coinbase.svg'
import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'
import SAFE_ICON from 'assets/wallets-connect/safe.svg'
import WALLET_CONNECT_ICON from 'assets/wallets-connect/wallet-connect.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import { WALLETCONNECT_PROJECT_ID } from 'constants/env'
import { isSupportedChainId } from 'constants/networks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'

export const plasma = defineChain({
  id: ChainId.PLASMA,
  name: 'Plasma',
  nativeCurrency: {
    decimals: 18,
    name: 'XPL',
    symbol: 'XPL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.plasma.to'],
      webSocket: ['wss://rpc.plasma.to'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://plasmascan.to' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
})

export const hyperevm = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
      webSocket: ['wss://hyperliquid.drpc.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://www.hyperscan.com' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
})

export const queryClient = new QueryClient()

export const CONNECTION = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  UNISWAP_WALLET_CONNECT_CONNECTOR_ID: 'uniswapWalletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  INJECTED_CONNECTOR_TYPE: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
  //UNISWAP_EXTENSION_RDNS: 'org.uniswap.app',
  SAFE_CONNECTOR_ID: 'safe',
  PORTO: 'xyz.ithaca.porto',
} as const

export const CONNECTOR_ICON_OVERRIDE_MAP: { [id in string]?: string } = {
  [CONNECTION.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION.SAFE_CONNECTOR_ID]: SAFE_ICON,
}

export const SMART_WALLETS = [CONNECTION.PORTO, CONNECTION.SAFE_CONNECTOR_ID]

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

export const HardCodedConnectors = [
  {
    id: 'KSBitgetWallet',
    name: 'Bitget Wallet',
    logo: 'data:image/png;base64,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',
    url: 'https://web3.bitget.com/en/wallet-download',
    realId: 'com.bitget.web3',
  },
  {
    id: 'KSRabby',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzc0MV8yNzUxKSI+CjxtYXNrIGlkPSJtYXNrMF83NDFfMjc1MSIgc3R5bGU9Im1hc2stdHlwZTpsdW1pbmFuY2UiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+CjxwYXRoIGQ9Ik0zMiAxNkMzMiA3LjE2MzQ0IDI0LjgzNjYgMCAxNiAwQzcuMTYzNDQgMCAwIDcuMTYzNDQgMCAxNkMwIDI0LjgzNjYgNy4xNjM0NCAzMiAxNiAzMkMyNC44MzY2IDMyIDMyIDI0LjgzNjYgMzIgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L21hc2s+CjxnIG1hc2s9InVybCgjbWFzazBfNzQxXzI3NTEpIj4KPHBhdGggZD0iTTMyIDE2QzMyIDcuMTYzNDQgMjQuODM2NiAwIDE2IDBDNy4xNjM0NCAwIDAgNy4xNjM0NCAwIDE2QzAgMjQuODM2NiA3LjE2MzQ0IDMyIDE2IDMyQzI0LjgzNjYgMzIgMzIgMjQuODM2NiAzMiAxNloiIGZpbGw9IiM3MDg0RkYiLz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF83NDFfMjc1MSkiPgo8cGF0aCBkPSJNMjcuNjAxOSAxNy4zODc2QzI4LjUyMTYgMTUuMzI2MSAyMy45NzQ4IDkuNTY2MzIgMTkuNjMxIDcuMTY2NzZDMTYuODkyOSA1LjMwNzc5IDE0LjAzOTkgNS41NjMxOCAxMy40NjIgNi4zNzkzOEMxMi4xOTQgOC4xNzA2OSAxNy42NjExIDkuNjg4NTEgMjEuMzE3NCAxMS40NTk3QzIwLjUzMTQgMTEuODAyMiAxOS43OTA4IDEyLjQxNjkgMTkuMzU1MiAxMy4yMDI5QzE3Ljk5MjEgMTEuNzA5OCAxNS4wMDAzIDEwLjQyMzkgMTEuNDg5NyAxMS40NTk3QzkuMTIzOTcgMTIuMTU3NyA3LjE1NzkxIDEzLjgwMzIgNi4zOTgwNCAxNi4yODg1QzYuMjEzMzcgMTYuMjA2MiA2LjAwODk0IDE2LjE2MDQgNS43OTM4NyAxNi4xNjA0QzQuOTcxNDIgMTYuMTYwNCA0LjMwNDY5IDE2LjgyOTQgNC4zMDQ2OSAxNy42NTQ2QzQuMzA0NjkgMTguNDc5OSA0Ljk3MTQyIDE5LjE0ODggNS43OTM4NyAxOS4xNDg4QzUuOTQ2MzIgMTkuMTQ4OCA2LjQyMjk4IDE5LjA0NjMgNi40MjI5OCAxOS4wNDYzTDE0LjAzOTkgMTkuMTAxNkMxMC45OTM3IDIzLjk1MDQgOC41ODYzNSAyNC42NTkxIDguNTg2MzUgMjUuNDk5MkM4LjU4NjM1IDI2LjMzOTIgMTAuODg5OCAyNi4xMTE2IDExLjc1NDcgMjUuNzk4NEMxNS44OTQ5IDI0LjI5OTUgMjAuMzQxNyAxOS42MjggMjEuMTA0OCAxOC4yODMzQzI0LjMwOTIgMTguNjg0NCAyNy4wMDIyIDE4LjczMTggMjcuNjAxOSAxNy4zODc2WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzc0MV8yNzUxKSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxLjMwMjkgMTEuNDUzOEMyMS4zMDY3IDExLjQ1NTUgMjEuMzEwNiAxMS40NTcxIDIxLjMxNDQgMTEuNDU4OEMyMS40ODM5IDExLjM5MTggMjEuNDU2NSAxMS4xNDA3IDIxLjQwOTkgMTAuOTQzNUMyMS4zMDMgMTAuNDkwMSAxOS40NTc1IDguNjYxNjUgMTcuNzI0NSA3Ljg0MjY1QzE1LjM2MjkgNi43MjY2NSAxMy42MjQgNi43ODQyMSAxMy4zNjcyIDcuMjk4NjVDMTMuODQ3MiA4LjI4ODIxIDE2LjA3NzkgOS4yMTcyNyAxOC40MDc3IDEwLjE4NzZDMTkuMzk3MSAxMC41OTk2IDIwLjQwNDMgMTEuMDE5MSAyMS4zMDI5IDExLjQ1MzhaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfNzQxXzI3NTEpIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTguMzIyOCAyMS40MTY3QzE3Ljg0NTMgMjEuMjMzNyAxNy4zMDYgMjEuMDY1OCAxNi42OTI5IDIwLjkxMzNDMTcuMzQ2OSAxOS43MzkzIDE3LjQ4NDEgMTguMDAxMSAxNi44NjY1IDE2LjkwMjJDMTUuOTk5OCAxNS4zNTk5IDE0LjkxMTcgMTQuNTM5MSAxMi4zODM0IDE0LjUzOTFDMTAuOTkyOCAxNC41MzkxIDcuMjQ4NzcgMTUuMDA5IDcuMTgyMjcgMTguMTQ1QzcuMTc1MzQgMTguNDczOCA3LjE4MjA5IDE4Ljc3NTEgNy4yMDU3NyAxOS4wNTIxTDE0LjA0MyAxOS4xMDE5QzEzLjEyMSAyMC41Njk0IDEyLjI1NzUgMjEuNjU3NyAxMS41MDE2IDIyLjQ4NTJDMTIuNDA5MiAyMi43MTg2IDEzLjE1ODEgMjIuOTE0NCAxMy44NDU3IDIzLjA5NDNDMTQuNDk3OCAyMy4yNjQ4IDE1LjA5NDYgMjMuNDIwOSAxNS43MTkzIDIzLjU4MDlDMTYuNjYyIDIyLjg5MTggMTcuNTQ4MyAyMi4xNDA0IDE4LjMyMjggMjEuNDE2N1oiIGZpbGw9InVybCgjcGFpbnQyX2xpbmVhcl83NDFfMjc1MSkiLz4KPHBhdGggZD0iTTYuMzA4NzQgMTguNzI4M0M2LjU4ODA1IDIxLjExMDUgNy45MzczNiAyMi4wNDQxIDEwLjY5NDYgMjIuMzIwNUMxMy40NTE5IDIyLjU5NjggMTUuMDMzNSAyMi40MTE0IDE3LjEzOTEgMjIuNjAzNkMxOC44OTc3IDIyLjc2NDEgMjAuNDY4IDIzLjY2MzMgMjEuMDUwNSAyMy4zNTI2QzIxLjU3NDcgMjMuMDczIDIxLjI4MTQgMjIuMDYyNiAyMC41Nzk5IDIxLjQxNDRDMTkuNjcwNiAyMC41NzQxIDE4LjQxMjEgMTkuOTkgMTYuMTk3NyAxOS43ODI2QzE2LjYzOSAxOC41NzAyIDE2LjUxNTQgMTYuODcwMyAxNS44Mjk5IDE1Ljk0NTVDMTQuODM4OSAxNC42MDgyIDEzLjAwOTcgMTQuMDAzNiAxMC42OTQ2IDE0LjI2NzhDOC4yNzU4NiAxNC41NDM4IDUuOTU4MjEgMTUuNzM4NiA2LjMwODc0IDE4LjcyODNaIiBmaWxsPSJ1cmwoI3BhaW50M19saW5lYXJfNzQxXzI3NTEpIi8+CjwvZz4KPC9nPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2RfNzQxXzI3NTEiIHg9Ii03Ny42MTUzIiB5PSItNzYuMTYwMiIgd2lkdGg9IjE4Ny4yNTQiIGhlaWdodD0iMTg0LjE2MiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0Lz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNDAuOTYiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuMTUxOTMzIDAgMCAwIDAgMC4yMzkyMzggMCAwIDAgMCAwLjQ5MDI0MSAwIDAgMCAwLjU0IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfNzQxXzI3NTEiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfNzQxXzI3NTEiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl83NDFfMjc1MSIgeDE9IjExLjIxNDIiIHkxPSIxNS41NjIiIHgyPSIyNy40MTE5IiB5Mj0iMjAuMTM5OSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSJ3aGl0ZSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IndoaXRlIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl83NDFfMjc1MSIgeDE9IjI0LjY3NDUiIHkxPSIxNS4yNTE4IiB4Mj0iMTIuOTUzNiIgeTI9IjMuNTQxNjMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzg2OTdGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM4Njk3RkYiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Ml9saW5lYXJfNzQxXzI3NTEiIHgxPSIxOC42NDc4IiB5MT0iMjEuODI2MSIgeDI9IjcuNDA4MDIiIHkyPSIxNS4zODU5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM4Njk3RkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjODY5N0ZGIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDNfbGluZWFyXzc0MV8yNzUxIiB4MT0iMTIuMTgyNyIgeTE9IjE1LjQzOTQiIHgyPSIxOS43OTkxIiB5Mj0iMjUuMDg0MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSJ3aGl0ZSIvPgo8c3RvcCBvZmZzZXQ9IjAuOTgzODk1IiBzdG9wLWNvbG9yPSIjRDFEOEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxjbGlwUGF0aCBpZD0iY2xpcDBfNzQxXzI3NTEiPgo8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==',
    name: 'Rabby Wallet',
    url: 'https://rabby.io/',
    realId: 'io.rabby',
  },
  {
    id: 'KSMetaMask',
    name: 'MetaMask',
    logo: METAMASK_ICON,
    url: 'https://metamask.io',
    realId: 'io.metamask',
  },
] as const

// hardcoded connector to display as a default option. will replace by the real one if user already installed real extension
const createPriorityConnector = ({ id, name, logo, url }: (typeof HardCodedConnectors)[number]) => {
  return createConnector(config => {
    const injectedConnector = injected()(config)

    return {
      ...injectedConnector,
      get icon() {
        return logo
      },
      get name() {
        return name
      },
      get id() {
        return id
      },
      connect() {
        window.open(url, '_blank')
        return Promise.reject()
      },
    }
  })
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
      '--wcm-z-index': '100000',
      '--wcm-logo-image-url': Kyber,
      '--wcm-background-image-url': WC_BG,
      '--wcm-accent-color': '#31CB9E',
      '--wcm-accent-fill-color': '#222222',
      '--wcm-color-bg-1': '#0F0F0F',
      '--wcm-background-color': '#31CB9E',
    },
  },
}

const wagmiChains = [
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
  unichain,
  hyperevm,
  etherlink,
  plasma,
] as const

export const wagmiConfig = createConfig({
  chains: wagmiChains,
  connectors: [
    injectedWithFallback(),
    walletConnect(WC_PARAMS),
    coinbaseWallet({
      appName: 'KyberSwap',
      appLogoUrl: 'https://kyberswap.com/favicon.png',
      reloadOnDisconnect: false,
      enableMobileWalletLink: true,
    }),
    // porto(),
    safe(),
    ...HardCodedConnectors.map(connector => createPriorityConnector(connector)),
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
