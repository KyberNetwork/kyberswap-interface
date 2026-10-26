// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NativeCurrencies } from 'constants/tokens'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { TAB, Tabs } from 'pages/Swap/Layout/Tabs'
import SwapRoute from 'pages/Swap/SwapRoute'
import { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { Field } from 'state/swap/actions'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
i18n.loadAndActivate({ locale: 'en', messages: {} })

const tokens = vi.hoisted(() => ({ values: [] as any[], loading: false }))
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ chainId: 1, networkInfo: { route: 'ethereum' } }),
}))
vi.mock('hooks/useChainsConfig', () => ({ NETWORKS_INFO: {} }))
vi.mock('hooks/useTokens', () => ({
  useAllTokensWithLoading: (_lowercase: boolean, chainId: number) => ({
    tokens: Object.fromEntries(
      tokens.values.filter(token => token.chainId === chainId).map(token => [token.address, token]),
    ),
    isLoading: tokens.loading,
  }),
  useCurrencyLookup: (id: string | undefined, chainId: number, knownToken?: Token) => ({
    currency:
      knownToken ||
      tokens.values.find(token => token.chainId === chainId && token.address?.toLowerCase() === id?.toLowerCase()),
    isLoading: false,
  }),
}))
vi.mock('state/user/hooks', () => ({}))
vi.mock('services/tokenCatalog', () => ({}))
vi.mock('hooks/useTracking', () => ({
  default: () => ({ trackingHandler: vi.fn() }),
  TRACKING_EVENT_TYPE: {},
}))
vi.mock('hooks/usePageLocation', async () => {
  const { useLocation } = await import('react-router-dom')
  return {
    default: function usePageLocation() {
      return { ...useLocation(), isEmbeddedSwap: false }
    },
  }
})
vi.mock('hooks/usePrefetchOnIntent', () => ({ default: () => ({}) }))
vi.mock('hooks/web3/useSyncNetworkParamWithStore', () => ({ useSyncNetworkParamWithStore: vi.fn() }))
vi.mock('pages/Swap/SwapPage', () => ({ default: () => <Page /> }))
vi.mock('pages/CrossChainSwap/loader', () => ({ prefetchCrossChainSwap: vi.fn() }))
vi.mock('pages/Swap/Layout/LimitTab', () => ({
  LimitTab: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Limit Order</button>,
}))

const usdc = new WrappedTokenInfo({
  chainId: ChainId.BASE,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
  isWhitelisted: true,
})
const weth = new Token(ChainId.BASE, '0x4200000000000000000000000000000000000006', 18, 'WETH')
tokens.values = [usdc, weth]

function Page() {
  const location = useLocation()
  const navigate = useNavigate()
  const pair = useSwapFormPair()
  const activeTab = location.pathname.startsWith('/limit')
    ? TAB.LIMIT
    : location.pathname === '/cross-chain'
    ? TAB.CROSS_CHAIN
    : TAB.SWAP
  return (
    <>
      <Tabs activeTab={activeTab} onTabChange={() => undefined} />
      <output>{location.pathname + location.search}</output>
      <span data-output-symbol>{pair.currencyOut?.symbol}</span>
      <span data-loading>{String(pair.isOutputCurrencyLoading)}</span>
      <span data-pair>{`${pair.inputChain}:${pair.inputId} → ${pair.outputChain}:${pair.outputId}`}</span>
      <button onClick={() => pair.selectCurrency(Field.OUTPUT, usdc)}>Select USDC</button>
      <button onClick={() => pair.selectCurrency(Field.INPUT, NativeCurrencies[ChainId.MAINNET])}>
        Select Ethereum
      </button>
      <button onClick={() => pair.selectCurrency(Field.INPUT, weth)}>Select Base WETH</button>
      <button onClick={pair.reversePair}>Reverse</button>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  )
}

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const mount = async (url: string) => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await render(url)
}
const render = async (url: string) => {
  await act(async () => {
    root.render(
      <I18nProvider i18n={i18n}>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/swap" element={<SwapRoute />} />
            <Route path="/swap/:network/:currency?" element={<SwapRoute />} />
            <Route path="/limit/:network/:currency?" element={<Page />} />
            <Route path="/cross-chain" element={<Page />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    )
  })
}
const click = async (text: string) => {
  const button = [...container.querySelectorAll('button')].find(button => button.textContent === text)
  expect(button, `Button ${text}`).toBeTruthy()
  if (!button) throw new Error(`Missing button: ${text}`)
  await act(async () => button.click())
}
const url = () => container.querySelector('output')?.textContent || ''
const pairText = () => container.querySelector('[data-pair]')?.textContent || ''

afterEach(async () => {
  await act(async () => root?.unmount())
  container?.remove()
  tokens.loading = false
  tokens.values = [usdc, weth]
})

// Exercise the real pair reader, selection hook and tab navigation with a wallet on another chain.
describe('unified swap pair navigation', () => {
  it('keeps the selected pair and network through Swap → Limit → Swap', async () => {
    await mount(`/swap/base/${weth.address}-to-usdc?input=12`)
    const pair = pairText()
    await click('Limit Order')
    expect(url()).toBe(`/limit/base/${weth.address.toLowerCase()}-to-usdc?input=12`)
    expect(pairText()).toBe(pair)
    await click('Swap')
    expect(url()).toBe(`/swap/base/${weth.address.toLowerCase()}-to-usdc?input=12`)
    expect(pairText()).toBe(pair)
  })

  it('writes selections into the single-chain path using the legacy whitelist symbol', async () => {
    await mount(`/swap/base/${weth.address}-to-${usdc.address}`)
    await click('Select USDC')
    expect(url()).toBe(`/swap/base/${weth.address.toLowerCase()}-to-usdc`)
    await click('Reverse')
    expect(url()).toBe(`/swap/base/usdc-to-${weth.address.toLowerCase()}`)
  })

  it('drops the old path on entering cross-chain and restores it when returning to one chain', async () => {
    await mount(`/swap/base/${weth.address}-to-usdc?input=12`)
    await click('Select Ethereum')
    const swapUrl = url()
    expect(swapUrl).toBe(`/swap?input=12&from=1&to=8453&tokenIn=ETH&tokenOut=${usdc.address}`)
    await click('Select Base WETH')
    expect(url()).toBe(`/swap/base/${weth.address.toLowerCase()}-to-usdc?input=12`)
    await click('Back')
    expect(url()).toBe(swapUrl)
  })

  it('normalizes an old mixed single-chain URL before switching to Limit Order', async () => {
    await mount(`/swap/ethereum/eth-to-usdt?from=8453&to=8453&tokenIn=${weth.address}&tokenOut=${usdc.address}`)
    expect(url()).toBe(`/swap/base/${weth.address.toLowerCase()}-to-${usdc.address.toLowerCase()}`)
    const pair = pairText()
    await click('Limit Order')
    expect(pairText()).toBe(pair)
    await click('Swap')
    expect(pairText()).toBe(pair)
  })

  it('normalizes an old mixed cross-chain URL without retaining its stale path', async () => {
    await mount(`/swap/ethereum/eth-to-usdt?from=1&to=8453&tokenIn=ETH&tokenOut=${usdc.address}`)
    expect(url()).toBe(`/swap?from=1&to=8453&tokenIn=ETH&tokenOut=${usdc.address}`)
  })

  it('preserves case-sensitive non-EVM token IDs in both directions', async () => {
    const token = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    await mount(`/cross-chain?from=${NonEvmChain.Solana}&to=8453&tokenIn=${token}&tokenOut=${usdc.address}`)
    const crossUrl = url()
    await click('Swap')
    expect(url()).toBe(crossUrl.replace('/cross-chain?', '/swap?'))
    await click('Reverse')
    expect(pairText()).toBe(`8453:${usdc.address} → ${NonEvmChain.Solana}:${token}`)
    await click('Reverse')
    expect(url()).toBe(crossUrl.replace('/cross-chain?', '/swap?'))
  })
})

describe('URL token resolution status', () => {
  it('keeps DAI pending until token metadata arrives, then resolves without an empty state', async () => {
    tokens.loading = true
    await mount('/swap/base/eth-to-dai')
    expect(container.querySelector('[data-loading]')?.textContent).toBe('true')
    expect(container.querySelector('[data-output-symbol]')?.textContent).toBe('')

    tokens.values.push(new Token(ChainId.BASE, '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', 18, 'DAI'))
    tokens.loading = false
    await render('/swap/base/eth-to-dai')
    expect(container.querySelector('[data-loading]')?.textContent).toBe('false')
    expect(container.querySelector('[data-output-symbol]')?.textContent).toBe('DAI')
  })

  it('keeps an intentionally empty output empty while token lists load', async () => {
    tokens.loading = true
    await mount('/swap?from=8453&to=8453&tokenIn=ETH&tokenOut=')
    expect(container.querySelector('[data-loading]')?.textContent).toBe('false')
  })
})
