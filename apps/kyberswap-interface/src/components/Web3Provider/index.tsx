import { PUBLIC_RPC_ENDPOINTS } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { reconnect, watchChainId } from '@wagmi/core'
import { Dialog, Mode } from 'porto'
import { porto } from 'porto/wagmi'
import { ReactNode, useEffect } from 'react'
import { type Chain, defineChain, fallback, http } from 'viem'
import {
  arbitrum,
  avalanche,
  base,
  berachain,
  blast,
  bsc,
  etherlink,
  fantom,
  hyperEvm,
  linea,
  mainnet,
  mantle,
  megaeth,
  monad,
  optimism,
  plasma,
  polygon,
  ronin,
  scroll,
  sonic,
  unichain,
  zksync,
} from 'viem/chains'
import { Connector, WagmiProvider, createConfig, createConnector } from 'wagmi'
import { coinbaseWallet, injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

import WC_BG from 'assets/images/wc-bg.png'
import Kyber from 'assets/svg/kyber/logo_kyberswap_with_padding.svg'
import BINANCE_ICON from 'assets/wallets-connect/binance.svg'
import BITGET_ICON from 'assets/wallets-connect/bitget-wallet.png'
import COINBASE_ICON from 'assets/wallets-connect/coinbase.svg'
import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'
import RABBY_ICON from 'assets/wallets-connect/rabby.svg'
import SAFE_ICON from 'assets/wallets-connect/safe.svg'
import SAFEPAL_ICON from 'assets/wallets-connect/safepal.svg'
import WALLET_CONNECT_ICON from 'assets/wallets-connect/wallet-connect.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import { setMetaMaskMobileLink } from 'components/Web3Provider/metamaskMobileLink'
import { WALLETCONNECT_PROJECT_ID } from 'constants/env'
import { KYBERSWAP_URL } from 'constants/index'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
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
  METAMASK_SDK_CONNECTOR_ID: 'metaMaskSDK',
  METAMASK_RDNS: 'io.metamask',
  PHANTOM: 'app.phantom',
  RABBY: 'io.rabby',
  SAFE_CONNECTOR_ID: 'safe',
  PORTO: 'xyz.ithaca.porto',
  BINANCE: 'com.binance.wallet',
  BITGET: 'com.bitget.web3',
  SAFEPAL: 'io.safepal',
  // SafePal's EIP-6963 announce uses its download URL as rdns (non-standard).
  SAFEPAL_RDNS: 'https://www.safepal.com/download',
} as const

export const CONNECTION_ORDER = [
  CONNECTION.METAMASK_SDK_CONNECTOR_ID,
  CONNECTION.METAMASK_RDNS,
  CONNECTION.WALLET_CONNECT_CONNECTOR_ID,
  CONNECTION.PHANTOM,
  CONNECTION.RABBY,
  CONNECTION.COINBASE_SDK_CONNECTOR_ID,
  CONNECTION.COINBASE_RDNS,
  CONNECTION.BINANCE,
  CONNECTION.BITGET,
  CONNECTION.SAFEPAL,
  CONNECTION.PORTO,
]

export const CONNECTOR_ICON_OVERRIDE_MAP: { [id in string]?: string } = {
  [CONNECTION.METAMASK_SDK_CONNECTOR_ID]: METAMASK_ICON,
  [CONNECTION.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION.SAFE_CONNECTOR_ID]: SAFE_ICON,
  [CONNECTION.SAFEPAL]: SAFEPAL_ICON,
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

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

export const HardCodedConnectors = [
  {
    id: 'KSRabby',
    logo: RABBY_ICON,
    name: 'Rabby Wallet',
    url: 'https://rabby.io/',
    realId: 'io.rabby',
  },
  {
    id: 'KSBinanceWallet',
    name: 'Binance Wallet',
    logo: BINANCE_ICON,
    url: 'https://www.binance.com/en/binancewallet',
    realId: 'com.binance.wallet',
  },
  {
    id: 'KSBitgetWallet',
    name: 'Bitget Wallet',
    logo: BITGET_ICON,
    url: 'https://web3.bitget.com/en/wallet-download',
    realId: 'com.bitget.web3',
  },
] as const

// hardcoded connector to display as a default option. will replace by the real one if user already installed real extension
const createPriorityConnector = ({ id, name, logo, url }: (typeof HardCodedConnectors)[number]) => {
  return createConnector(config => {
    const injectedConnector = injected()(config)

    const connect: typeof injectedConnector.connect = () => {
      window.open(url, '_blank')
      return Promise.reject()
    }

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
      connect,
    }
  })
}

// Resolve SafePal's EVM provider across both injection shapes the extension
// uses: legacy `window.safepalProvider` (older builds) and the current
// `window.__safepalEthereumBootstrap__.activeProvider` (newer builds, where
// SafePal lazy-attaches the EVM provider behind a bootstrap object that also
// holds Aptos/Tron providers + a setProvider switch). The active provider
// carries an `isSafePal: true` flag even when it shims MetaMask via
// `isMetaMask: true` / `__isMetaMaskShim__`, so use that to discriminate from
// other wallets that may be active under the same bootstrap.
export function getSafepalProvider(): typeof window.safepalProvider {
  if (typeof window === 'undefined') return undefined
  const active = window.__safepalEthereumBootstrap__?.activeProvider
  if (active?.isSafePal) return active as typeof window.safepalProvider
  return window.safepalProvider
}

function safepalConnector() {
  return createConnector(config => {
    const injectedConnector = injected({
      target: () => ({ id: CONNECTION.SAFEPAL, name: 'SafePal', provider: getSafepalProvider() }),
      // SafePal's content script can inject `window.safepalProvider` after wagmi's
      // mount-time reconnect already runs `isAuthorized()`. Without this shim the
      // connector would return `false` synchronously and stay disconnected until a
      // manual reconnect. The shim makes `isAuthorized()` wait up to 5s for
      // `ethereum#initialized` (or re-check the target on timeout) so a slow
      // content-script injection no longer drops the session on refresh.
      unstable_shimAsyncInject: 5_000,
    })(config)

    const connect: typeof injectedConnector.connect = (...params) => {
      if (!getSafepalProvider()) {
        window.open('https://www.safepal.com/download', '_blank')
        return Promise.reject(new Error('SafePal extension not installed'))
      }
      return injectedConnector.connect(...params)
    }

    return {
      ...injectedConnector,
      get icon() {
        return SAFEPAL_ICON
      },
      get id() {
        return CONNECTION.SAFEPAL as string
      },
      get name() {
        return 'SafePal'
      },
      // Pin the rdns SafePal advertises via EIP-6963 so wagmi's mipd dedup
      // collapses the announced provider onto this custom connector instead of
      // appending a second `id = <URL>` connector after first render. That keeps
      // `recentConnectorId` stable as `io.safepal` and lets the reconnect path
      // always find the same connector entry on refresh.
      rdns: CONNECTION.SAFEPAL_RDNS,
      connect,
    }
  })
}

// Generic browser-wallet fallback for non-MetaMask injected providers (Brave, Trust, etc.).
// MetaMask install/deep-link is handled by the dedicated metaMask() SDK connector now,
// so this connector is hidden when the active EIP-1193 provider is MetaMask.
function injectedWithFallback() {
  return createConnector(config => {
    const injectedConnector = injected()(config)

    return {
      ...injectedConnector,
      get icon() {
        return INJECTED_DARK_ICON
      },
      get name() {
        return 'Browser Wallet'
      },
    }
  })
}

const WC_PARAMS = {
  showQrModal: true,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'KyberSwap',
    description: typeof document !== 'undefined' ? document.title : 'KyberSwap',
    url: typeof window !== 'undefined' ? window.location.origin : KYBERSWAP_URL,
    icons: [`${KYBERSWAP_URL}/favicon.svg`],
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

// WalletConnect v2 keeps all of its state under `wc@2:`-prefixed localStorage keys. Their presence means
// this browser has talked to WalletConnect before, so there may be a session worth restoring at boot.
const hasWalletConnectState = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    return Object.keys(window.localStorage).some(key => key.startsWith('wc@2:'))
  } catch {
    // Storage can throw (disabled cookies, partitioned contexts) — treat it as "no session" and let the
    // SDK load on the first Connect click instead.
    return false
  }
}

// wagmi runs `connector.setup()` for every connector while createConfig() builds the store, and
// WalletConnect's setup() unconditionally awaits getProvider() — which dynamically imports the ~460KB
// @walletconnect/ethereum-provider bundle and runs EthereumProvider.init() (relay, keychain, storage).
// All of that exists to attach one 'connect' listener that only fires for a session being restored, so a
// visitor who has never used WalletConnect pays the whole cost for nothing. Gate setup() on prior
// WalletConnect state: connect() awaits getProvider() itself, so a first-time user still gets the SDK the
// moment they click Connect, and returning WalletConnect users keep today's restore behaviour.
const walletConnectWithDeferredSetup = (parameters: Parameters<typeof walletConnect>[0]) =>
  createConnector(config => {
    const connector = walletConnect(parameters)(config)
    return {
      ...connector,
      async setup() {
        if (!hasWalletConnectState()) return
        await connector.setup?.()
      },
    }
  })

// Build an ordered, de-duplicated RPC list for a chain: KyberSwap RPC first,
// then the public RPCs from @kyber/rpc-client. The list feeds both the wagmi
// `transports` map (via viem `fallback()` for true rotation on read calls) and
// the chain object's `rpcUrls.default.http` (which connectors like the MetaMask
// SDK read directly — they ignore `transports` and only consume URL[0]).
const getRpcUrlsForChain = (chainId: number): string[] => {
  const primary = NETWORKS_INFO[chainId as ChainId]?.defaultRpcUrl
  const publics = PUBLIC_RPC_ENDPOINTS[chainId] ?? []
  const all = [primary, ...publics].filter((url): url is string => !!url)
  return Array.from(new Set(all))
}

// Override viem's hardcoded chain defaults (e.g. https://56.rpc.thirdweb.com for BSC)
// so connector-internal RPC clients don't bypass our transports config and hit
// public RPCs that quickly rate-limit (HTTP 429).
const withKyberRpc = <T extends { id: number; rpcUrls: { default: { http: readonly string[] } } }>(chain: T): T => {
  const urls = getRpcUrlsForChain(chain.id)
  if (urls.length === 0) return chain
  return {
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: { ...chain.rpcUrls.default, http: urls },
    },
  }
}

export const robinhood = defineChain({
  id: ChainId.ROBINHOOD,
  name: 'Robinhood',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.chain.robinhood.com'],
      webSocket: ['wss://feed.mainnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Robinscan', url: 'https://robinscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
})

const wagmiChains: readonly [Chain, ...Chain[]] = [
  withKyberRpc(mainnet),
  withKyberRpc(arbitrum),
  withKyberRpc(optimism),
  withKyberRpc(zksync),
  withKyberRpc(polygon),
  withKyberRpc(base),
  withKyberRpc(bsc),
  withKyberRpc(linea),
  withKyberRpc(mantle),
  withKyberRpc(scroll),
  withKyberRpc(avalanche),
  withKyberRpc(fantom),
  withKyberRpc(blast),
  withKyberRpc(sonic),
  withKyberRpc(berachain),
  withKyberRpc(ronin),
  withKyberRpc(unichain),
  withKyberRpc(hyperEvm),
  withKyberRpc(etherlink),
  withKyberRpc(plasma),
  withKyberRpc(monad),
  withKyberRpc(megaeth),
  withKyberRpc(robinhood),
] as const

// viem `fallback()` rotates through URLs on transport errors (network, 429, 5xx),
// giving us true client-side RPC rotation for every wagmi-issued call (multicall,
// useReadContract, polling). KyberSwap RPC sits first; public endpoints are tried
// only when it errors. Connector-internal calls still use URL[0] of `rpcUrls.default`
// (set by `withKyberRpc` above), which is the same KyberSwap RPC.
const transports = Object.fromEntries(
  wagmiChains.map(c => {
    const urls = getRpcUrlsForChain(c.id)
    const httpTransports = urls.length > 0 ? urls.map(url => http(url)) : [http()]
    return [c.id, fallback(httpTransports, { retryCount: 1 })]
  }),
) as Record<(typeof wagmiChains)[number]['id'], ReturnType<typeof fallback>>

// Migrate localStorage's recent-connector hint from the EIP-6963 io.metamask id (used by the
// pre-PR injected connector) to the metaMaskSDK id (the new SDK connector). wagmi auto-resets
// the main `wagmi.store` on the v2→v3 version bump, but `wagmi.recentConnectorId` lives outside
// that store and would otherwise stay pointing at a non-existent connector — preventing the
// reconnect-priority boost for returning MetaMask users on first visit after deploy.
;(() => {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const raw = window.localStorage.getItem('wagmi.recentConnectorId')
    if (raw && JSON.parse(raw) === CONNECTION.METAMASK_RDNS) {
      window.localStorage.setItem('wagmi.recentConnectorId', JSON.stringify(CONNECTION.METAMASK_SDK_CONNECTOR_ID))
    }
  } catch {
    // ignore parse / storage failures — at worst the user reconnects manually
  }
})()

/** The connector a returning visitor last connected with, as wagmi persists it (JSON-encoded). */
const readRecentConnectorId = (): string | undefined => {
  if (typeof window === 'undefined' || !window.localStorage) return undefined
  try {
    const raw = window.localStorage.getItem('wagmi.recentConnectorId')
    return raw ? (JSON.parse(raw) as string) : undefined
  } catch {
    return undefined
  }
}

export const wagmiConfig = createConfig({
  chains: wagmiChains,
  transports,
  batch: { multicall: true },
  pollingInterval: 12_000,
  connectors: [
    metaMask({
      dapp: {
        name: 'KyberSwap',
        url: typeof window !== 'undefined' ? window.location.origin : KYBERSWAP_URL,
        iconUrl: `${KYBERSWAP_URL}/favicon.svg`,
      },
      // The SDK calls this on a native mobile browser with the `metamask://connect/mwp?...`
      // deep link, asynchronously after the relay handshake. We surface it to the wallet modal
      // rather than opening it here, so the user launches MetaMask with a real tap — a genuine
      // gesture is the reliable way to open the app, and tapping a custom-scheme link keeps this
      // page (and its open relay connection) alive so the pairing can complete on return.
      //
      // Keep the `metamask://` custom scheme as-is: it carries the connection payload straight
      // into the app, so MetaMask lands on the approval screen. Do NOT rewrite it to the
      // `metamask.app.link` Universal Link — that domain is a Branch link that drops the query
      // params, so the app opens to its home screen with no pairing request.
      mobile: {
        preferredOpenLink: deeplink => {
          setMetaMaskMobileLink(deeplink)
        },
      },
    }),
    injectedWithFallback(),
    walletConnectWithDeferredSetup(WC_PARAMS),
    coinbaseWallet({
      appName: 'KyberSwap',
      appLogoUrl: `${KYBERSWAP_URL}/favicon.png`,
    }),
    safepalConnector(),
    // Porto's default iframe renderer sets iframe.src during connector setup,
    // which hits id.porto.sh on app mount. The official popup renderer opens
    // the remote dialog only when a Porto request needs user confirmation.
    ...(import.meta.env.SSR ? [] : [porto({ mode: Mode.dialog({ renderer: Dialog.popup() }) })]),
    safe(),
    ...HardCodedConnectors.map(connector => createPriorityConnector(connector)),
  ],
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

  // Restore the previous session ourselves, because WagmiProvider below passes `reconnectOnMount={false}`.
  //
  // wagmi's own mount reconnect walks EVERY connector and awaits `connector.getProvider()` on each — and
  // that call is where a connector dynamically imports its SDK. A visitor who has never connected a wallet
  // therefore downloads the MetaMask (~356KB) and WalletConnect (~397KB) SDKs during boot just for wagmi to
  // learn they have no session. Scoping the walk to the connector they actually last used skips all of it:
  // with no stored id there is nothing to restore, so no SDK loads at all.
  //
  // Runs on mount rather than at idle so a returning visitor's wallet reconnects as promptly as before. If
  // the stored id names a connector we cannot resolve yet — EIP-6963 wallets announce asynchronously, so a
  // discovered connector may not be registered at this point — fall back to wagmi's full walk rather than
  // leave that visitor disconnected.
  useEffect(() => {
    const recentConnectorId = readRecentConnectorId()
    if (!recentConnectorId) return

    const recentConnector = wagmiConfig.connectors.find(connector => connector.id === recentConnectorId)
    reconnect(wagmiConfig, recentConnector ? { connectors: [recentConnector] } : undefined).catch(() => {})
  }, [])

  // SafePal reconnect recovery. The extension lazy-attaches its EVM provider
  // (window.__safepalEthereumBootstrap__.activeProvider — see getSafepalProvider)
  // some time after the page loads and does NOT fire an EIP-6963 announce, so
  // the mount reconnect above runs before the provider exists, finds nothing
  // via `connector.getProvider()`, and gives up without ever reaching
  // `isAuthorized()` (where the shim lives). Poll for the bootstrap object and,
  // once it lands, re-trigger reconnect so the custom safepalConnector finds it.
  // Guarded so it only runs while no other connector is current.
  useEffect(() => {
    if (typeof window === 'undefined') return

    let triggered = false
    let pollHandle: ReturnType<typeof setInterval> | null = null

    const tryReconnect = () => {
      if (triggered) return
      if (!getSafepalProvider()) return
      if (wagmiConfig.state.current) return
      // Status `reconnecting`/`connecting` means wagmi is still iterating
      // connectors; calling reconnect() now hits its `isReconnecting` re-entry
      // guard and no-ops. Defer to the next poll tick.
      const status = wagmiConfig.state.status
      if (status === 'reconnecting' || status === 'connecting') return
      triggered = true
      if (pollHandle) clearInterval(pollHandle)
      reconnect(wagmiConfig).catch(() => {})
    }

    let pollCount = 0
    pollHandle = setInterval(() => {
      pollCount += 1
      if (pollCount > 50 || triggered) {
        if (pollHandle) clearInterval(pollHandle)
        return
      }
      tryReconnect()
    }, 100)

    return () => {
      if (pollHandle) clearInterval(pollHandle)
    }
  }, [])

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
