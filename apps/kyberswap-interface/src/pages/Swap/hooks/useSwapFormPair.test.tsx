// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUTPUT_TOKENS, NativeCurrencies } from 'constants/tokens'
import SwapRoute from 'pages/Swap/SwapRoute'
import { NonEvmChain } from 'pages/Swap/crossChain/adapters/types'
import { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import { TAB, Tabs } from 'pages/Swap/layout/Tabs'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { Field } from 'state/swap/actions'
import { getEmbeddedSwapPair, getTradeLocation } from 'utils/swapFlow'

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
      const location = useLocation()
      return { ...location, isEmbeddedSwap: /^\/(partner-swap|user-swap)/.test(location.pathname) }
    },
  }
})
vi.mock('hooks/usePrefetchOnIntent', () => ({ default: () => ({}) }))
vi.mock('hooks/web3/useSyncNetworkParamWithStore', () => ({ useSyncNetworkParamWithStore: vi.fn() }))
vi.mock('pages/Swap/SwapPage', () => ({ default: () => <Page /> }))
vi.mock('pages/Swap/layout/LimitTab', () => ({
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

function Page({ getPairLocation }: { getPairLocation?: Parameters<typeof useSwapFormPair>[0] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const pair = useSwapFormPair(getPairLocation)
  const activeTab =
    location.pathname.startsWith('/limit') || new URLSearchParams(location.search).get('tab') === TAB.LIMIT
      ? TAB.LIMIT
      : location.pathname === '/kybercross'
      ? TAB.KYBER_CROSS
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
            <Route
              path="/kybercross"
              element={<Page getPairLocation={(pair, params) => getTradeLocation('kybercross', pair, params)} />}
            />
            <Route path="/partner-swap" element={<Page />} />
            <Route path="/user-swap/:tipsId?" element={<Page />} />
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

  it('keeps embedded attribution and chain/token params when entering and leaving cross-chain', async () => {
    await mount(
      `/partner-swap?clientId=partner&chainId=8453&inputCurrency=${weth.address}&outputCurrency=${usdc.address}&feeAmount=25&feeReceiver=receiver&tab=cross_chain`,
    )
    expect(pairText()).toBe(`8453:${weth.address} → 8453:${usdc.address}`)
    expect(container.textContent).toContain('Limit Order')
    await click('Select Ethereum')
    let next = new URL(url(), 'https://kyberswap.com')
    expect(next.pathname).toBe('/partner-swap')
    expect(next.searchParams.get('chainId')).toBe('1')
    expect(next.searchParams.has('from')).toBe(false)
    expect(next.searchParams.get('toChain')).toBe('8453')
    expect(next.searchParams.has('tokenIn')).toBe(false)
    expect(next.searchParams.get('feeAmount')).toBe('25')
    expect(next.searchParams.get('clientId')).toBe('partner')
    await click('Select Base WETH')
    next = new URL(url(), 'https://kyberswap.com')
    expect(next.pathname).toBe('/partner-swap')
    expect(next.searchParams.get('chainId')).toBe('8453')
    expect(next.searchParams.has('toChain')).toBe(false)
    expect(next.searchParams.has('tokenOut')).toBe(false)
    expect(pairText()).toBe(`8453:${weth.address} → 8453:${usdc.address}`)
  })

  it.each(['/partner-swap', '/user-swap/tip-id'])(
    'writes only partner parameters when changing output chain on %s',
    async pathname => {
      await mount(`${pathname}?chainId=1&inputCurrency=ETH&outputCurrency=USDC&clientId=partner&feeAmount=25`)
      await click('Select USDC')
      const next = new URL(url(), 'https://kyberswap.com')
      expect(next.pathname).toBe(pathname)
      expect(next.searchParams.get('chainId')).toBe('1')
      expect(next.searchParams.get('toChain')).toBe('8453')
      expect(next.searchParams.get('outputCurrency')).toBe(usdc.address)
      for (const key of ['from', 'to', 'tokenIn', 'tokenOut']) expect(next.searchParams.has(key)).toBe(false)
      await click('Reverse')
      const reversed = new URL(url(), 'https://kyberswap.com')
      expect(reversed.searchParams.get('chainId')).toBe('8453')
      expect(reversed.searchParams.get('toChain')).toBe('1')
      expect(reversed.searchParams.get('clientId')).toBe('partner')
      expect(reversed.searchParams.get('feeAmount')).toBe('25')
    },
  )

  it('reads the complete partner schema without borrowing conflicting public fields', () => {
    const pair = getEmbeddedSwapPair(
      new URLSearchParams('chainId=8453&inputCurrency=ETH&outputCurrency=USDC&from=1&to=10&tokenIn=DAI&tokenOut=ETH'),
    )
    expect(pair).toEqual({ fromChain: 8453, toChain: 8453, tokenIn: 'ETH', tokenOut: 'USDC' })
    expect(
      getEmbeddedSwapPair(
        new URLSearchParams('chainId=solana&toChain=1&inputCurrency=CaseSensitiveToken&outputCurrency=ETH'),
      ),
    ).toEqual({ fromChain: 'solana', toChain: 1, tokenIn: 'CaseSensitiveToken', tokenOut: 'ETH' })
  })

  it('keeps partner Limit Order on the embedded URL with a single-chain pair and attribution', async () => {
    await mount(
      `/partner-swap?clientId=partner&chainId=8453&toChain=1&inputCurrency=${weth.address}&outputCurrency=ETH&feeAmount=25`,
    )
    await click('Limit Order')
    const limitUrl = new URL(url(), 'https://kyberswap.com')
    expect(limitUrl.pathname).toBe('/partner-swap')
    expect(limitUrl.searchParams.get('tab')).toBe('limit')
    expect(limitUrl.searchParams.get('chainId')).toBe('8453')
    expect(limitUrl.searchParams.get('inputCurrency')).toBe(weth.address)
    expect(limitUrl.searchParams.get('outputCurrency')).toBe('')
    expect(limitUrl.searchParams.has('toChain')).toBe(false)
    expect(limitUrl.searchParams.has('from')).toBe(false)
    expect(limitUrl.searchParams.has('tokenOut')).toBe(false)
    expect(limitUrl.searchParams.get('feeAmount')).toBe('25')
    await click('Swap')
    const swapUrl = new URL(url(), 'https://kyberswap.com')
    expect(swapUrl.pathname).toBe('/partner-swap')
    expect(swapUrl.searchParams.get('tab')).toBe('swap')
    expect(swapUrl.searchParams.get('clientId')).toBe('partner')
  })

  it.each(['swap', 'limit'])('honors embedded features=%s', async feature => {
    await mount(`/partner-swap?clientId=partner&chainId=8453&features=${feature}`)
    const labels = [...container.querySelectorAll('button')].map(button => button.textContent)
    expect(labels.includes('Swap')).toBe(feature === 'swap')
    expect(labels.includes('Limit Order')).toBe(feature === 'limit')
  })

  it.each(['swap', 'kybercross'] as const)('writes only public pair parameters when navigating to %s', page => {
    const location = getTradeLocation(
      page,
      { fromChain: 1, toChain: 8453, tokenIn: 'ETH', tokenOut: usdc.address },
      new URLSearchParams('chainId=1&toChain=10&inputCurrency=ETH&outputCurrency=DAI&clientId=partner&feeAmount=25'),
    )
    const params = new URLSearchParams(location.search)
    expect(params.get('from')).toBe('1')
    expect(params.get('to')).toBe('8453')
    expect(params.has('chainId')).toBe(false)
    expect(params.has('toChain')).toBe(false)
    expect(params.has('inputCurrency')).toBe(false)
    expect(params.has('outputCurrency')).toBe(false)
    expect(params.get('clientId')).toBe('partner')
    expect(params.get('feeAmount')).toBe('25')
  })

  it('lets a derivative retain its route while reusing pair selection and reversal', async () => {
    await mount(`/kybercross?from=1&to=8453&tokenIn=ETH&tokenOut=${usdc.address}&input=12`)
    await click('Select Base WETH')
    const selectedUrl = new URL(url(), 'https://kyberswap.com')
    expect(selectedUrl.pathname).toBe('/kybercross')
    expect(selectedUrl.searchParams.get('from')).toBe('8453')
    expect(selectedUrl.searchParams.get('to')).toBe('8453')
    expect(selectedUrl.searchParams.get('input')).toBe('12')
    await click('Reverse')
    expect(new URL(url(), 'https://kyberswap.com').pathname).toBe('/kybercross')
    expect(pairText()).toBe(`8453:${usdc.address} → 8453:${weth.address}`)
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
    await mount(`/swap?from=${NonEvmChain.Solana}&to=8453&tokenIn=${token}&tokenOut=${usdc.address}`)
    const crossUrl = url()
    expect(crossUrl).toContain('/swap?')
    await click('Swap')
    expect(url()).toBe(crossUrl)
    await click('Reverse')
    expect(pairText()).toBe(`8453:${usdc.address} → ${NonEvmChain.Solana}:${token}`)
    await click('Reverse')
    expect(url()).toBe(crossUrl)
  })
})

describe('URL token resolution status', () => {
  it.each(['/partner-swap', '/user-swap/tip-id'])(
    'restores defaults for empty legacy token parameters on %s',
    async pathname => {
      await mount(`${pathname}?chainId=8453&inputCurrency=&outputCurrency=`)
      expect(pairText()).toBe(`8453:eth → 8453:${DEFAULT_OUTPUT_TOKENS[ChainId.BASE]?.wrapped.address}`)
    },
  )

  it('ignores Unified fields on an embedded page', async () => {
    await mount('/partner-swap?chainId=8453&inputCurrency=ETH&outputCurrency=USDC&tokenOut=')
    expect(container.querySelector('[data-output-symbol]')?.textContent).toBe('USDC')
  })

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
