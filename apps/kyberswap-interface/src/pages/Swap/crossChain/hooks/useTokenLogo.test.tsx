// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { type PayloadAction, configureStore, createSlice } from '@reduxjs/toolkit'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useTokenLogo } from 'pages/Swap/crossChain/hooks/useTokenLogo'
import { NonEvmChain } from 'types/crossChain'

const lookup = vi.hoisted(() => vi.fn())
vi.mock('hooks/useTokens', () => ({ useCurrencyLookup: lookup }))
// This hook must select from its Provider, not read the global store singleton.
vi.mock('state', () => ({
  default: {
    getState: () => {
      throw new Error('Unexpected global store read')
    },
  },
}))

type TokenLogos = Record<string, { logoURI: string }>
const lists = createSlice({
  name: 'lists',
  initialState: { mapWhitelistTokens: {} as Record<number, TokenLogos> },
  reducers: {
    setList: (state, { payload }: PayloadAction<{ chainId: number; tokens: TokenLogos }>) => {
      state.mapWhitelistTokens[payload.chainId] = payload.tokens
    },
  },
})
const makeStore = () => configureStore({ reducer: { lists: lists.reducer } })
const address = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const token = new Token(ChainId.ARBITRUM, address, 6, 'USDC')
const snapshot = { ...token, address }
const Probe = ({
  currency,
  chainId,
}: {
  currency: Parameters<typeof useTokenLogo>[0]
  chainId: Parameters<typeof useTokenLogo>[1]
}) => {
  const logo = useTokenLogo(currency, chainId)
  return <span data-logo={logo} />
}
let store: ReturnType<typeof makeStore>
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
const render = (
  currency: Parameters<typeof useTokenLogo>[0] = token,
  chainId: Parameters<typeof useTokenLogo>[1] = ChainId.ARBITRUM,
) =>
  act(async () =>
    root.render(
      <Provider store={store}>
        <Probe currency={currency} chainId={chainId} />
      </Provider>,
    ),
  )
const logo = () => container.querySelector('[data-logo]')?.getAttribute('data-logo')

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  lookup.mockReset().mockReturnValue({ currency: undefined })
  store = makeStore()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('uses a supplied logo or a checksum whitelist entry without requesting metadata', async () => {
  store.dispatch(
    lists.actions.setList({ chainId: ChainId.ARBITRUM, tokens: { [token.address]: { logoURI: 'whitelist' } } }),
  )
  await render(Object.assign(new Token(ChainId.ARBITRUM, address, 6, 'USDC'), { logoURI: 'snapshot' }))
  expect(logo()).toBe('snapshot')
  expect(lookup).toHaveBeenLastCalledWith(undefined, ChainId.ARBITRUM)
  await render(Object.assign(new Token(ChainId.ARBITRUM, address, 6, 'USDC'), snapshot))
  expect(logo()).toBe('whitelist')
  expect(lookup).toHaveBeenLastCalledWith(undefined, ChainId.ARBITRUM)
})

it('reacts to a late whitelist load and stops requesting missing metadata', async () => {
  await render()
  expect(logo()).toBe('')
  expect(lookup).toHaveBeenLastCalledWith(token.address, ChainId.ARBITRUM)
  await act(async () => {
    store.dispatch(
      lists.actions.setList({ chainId: ChainId.ARBITRUM, tokens: { [token.address]: { logoURI: 'loaded' } } }),
    )
  })
  expect(logo()).toBe('loaded')
  expect(lookup).toHaveBeenLastCalledWith(undefined, ChainId.ARBITRUM)
})

it('returns a fetched logo without mutating or replacing the token snapshot', async () => {
  lookup.mockReturnValue({ currency: { symbol: 'NEW', decimals: 18, logoURI: 'remote' } })
  await render()
  expect(logo()).toBe('remote')
  expect(token.symbol).toBe('USDC')
  expect(token.decimals).toBe(6)
  expect(token.wrapped).toBe(token)
  expect('logoURI' in token).toBe(false)
})

it('keeps logo lookup scoped to the current chain and handles non-EVM logos without EVM requests', async () => {
  store.dispatch(
    lists.actions.setList({ chainId: ChainId.ARBITRUM, tokens: { [token.address]: { logoURI: 'arbitrum' } } }),
  )
  await render()
  expect(logo()).toBe('arbitrum')
  await render(new Token(ChainId.BASE, address, 6, 'USDC'), ChainId.BASE)
  expect(logo()).toBe('')
  expect(lookup).toHaveBeenLastCalledWith(token.address, ChainId.BASE)
  await render({ name: 'Bitcoin', symbol: 'BTC', decimals: 8, logo: 'bitcoin' }, NonEvmChain.Bitcoin)
  expect(logo()).toBe('bitcoin')
  expect(lookup).toHaveBeenLastCalledWith(undefined, ChainId.MAINNET)
})
