// @vitest-environment happy-dom
import { Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { configureStore } from '@reduxjs/toolkit'
import { MouseEvent, act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
import { expect, it, vi } from 'vitest'

import { useTokenFavoriteActions, useTokenFavorites } from 'components/TokenSelectorModal/hooks/useTokenFavorites'
import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { addSerializedToken } from 'state/user/actions'
import { getFavoriteTokenAddresses } from 'state/user/favorites'
import user from 'state/user/reducer'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), favorites: [] as string[] }))
vi.mock('hooks/useTokens', () => ({ fetchListTokenByAddresses: mocks.fetch }))
vi.mock('state/user/hooks', async () => {
  const { useStore } = await import('react-redux')
  const { removeSerializedToken } = await import('state/user/actions')
  return {
    useUserFavoriteTokens: () => ({ favoriteTokens: mocks.favorites }),
    useRemoveUserAddedToken: () => {
      const store = useStore()
      return (chainId: number, address: string) => store.dispatch(removeSerializedToken({ chainId, address }))
    },
  }
})

const address = '0x0000000000000000000000000000000000000001'
const eth = new Token(1, address, 18, 'TOKEN')
const bnb = new Token(56, address, 18, 'TOKEN')
const setup = (commonTokens: Record<number, string[]> = {}) => {
  const config = Object.fromEntries(
    Object.entries(commonTokens).map(([chain, tokens]) => [chain, { commonTokens: tokens }]),
  )
  const store = configureStore({ reducer: { user, application: (state = { config }) => state } })
  let actions!: ReturnType<typeof useTokenFavoriteActions>
  const Probe = () => {
    actions = useTokenFavoriteActions()
    return null
  }
  renderToStaticMarkup(
    <Provider store={store}>
      <Probe />
    </Provider>,
  )
  const favorites = (chain: 1 | 56) =>
    getFavoriteTokenAddresses(store.getState().user.favoriteTokensByChainIdv2[chain], config[chain]?.commonTokens)
  const toggle = (currency: Currency) => {
    const stopPropagation = vi.fn()
    actions.handleClickFavorite({ stopPropagation } as unknown as MouseEvent, currency)
    expect(stopPropagation).toHaveBeenCalledOnce()
  }
  return { store, actions, favorites, toggle }
}

it('toggles current membership on the token chain and enforces each chain limit, including common tokens', () => {
  const common = Array.from({ length: 12 }, (_, index) => `0x${(index + 1).toString(16).padStart(40, '0')}`)
  const { favorites, toggle } = setup({ 1: common, 56: [address] })
  toggle(bnb)
  expect(favorites(56)).toEqual([])
  expect(favorites(1)).toEqual(common)
  // A second click before rerender must use the newly committed membership.
  toggle(bnb)
  expect(favorites(56)).toEqual([address])
  const extra = new Token(1, '0x0000000000000000000000000000000000000013', 18, 'EXTRA')
  toggle(extra)
  expect(favorites(1)).toEqual(common)
  toggle(eth)
  toggle(extra)
  expect(favorites(1)).not.toContain(address)
  expect(favorites(1)).toContain(extra.address.toLowerCase())
})

it('removes only the selected chain import and its common-token favorite', () => {
  const { store, actions, favorites } = setup({ 1: [address], 56: [address] })
  for (const token of [eth, bnb]) {
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: token.chainId,
          address: token.address,
          decimals: token.decimals,
          symbol: token.symbol,
          name: token.name,
        },
      }),
    )
  }
  actions.removeImportedToken(bnb)
  expect(store.getState().user.tokens[56]?.[address]).toBeUndefined()
  expect(store.getState().user.tokens[1]?.[address]).toBeDefined()
  expect(favorites(56)).toEqual([])
  expect(favorites(1)).toEqual([address])
})

it('favorites native currency under its sentinel without toggling the wrapped token', () => {
  const wrapped = WETH[1].address.toLowerCase()
  const { favorites, toggle } = setup({ 1: [wrapped] })
  toggle(NativeCurrencies[1])
  expect(favorites(1)).toEqual([wrapped, ETHER_ADDRESS.toLowerCase()])
  toggle(NativeCurrencies[1])
  expect(favorites(1)).toEqual([wrapped])
})

it('ignores superseded favorite lookups and preserves the last result on failure', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const root = createRoot(document.createElement('div'))
  let result!: ReturnType<typeof useTokenFavorites>
  // A populated list permits resolution, but the favorite itself needs remote metadata.
  const defaults = { [WETH[1].address]: WETH[1] } as Parameters<typeof useTokenFavorites>[1]
  const Probe = ({ chainId }: { chainId: 1 | 56 }) => {
    result = useTokenFavorites(chainId, defaults)
    return null
  }
  let finishOld!: (tokens: Token[]) => void
  mocks.favorites = [address]
  mocks.fetch.mockReturnValueOnce(new Promise<Token[]>(resolve => (finishOld = resolve)))
  try {
    await act(async () => root.render(<Probe chainId={1} />))
    mocks.fetch.mockResolvedValueOnce([bnb])
    await act(async () => root.render(<Probe chainId={56} />))
    expect(result.pinnedTokens).toEqual([bnb])
    await act(async () => finishOld([eth]))
    expect(result.pinnedTokens).toEqual([bnb])
    mocks.favorites = [WETH[56].address]
    mocks.fetch.mockRejectedValueOnce(new Error('lookup failed'))
    await act(async () => root.render(<Probe chainId={56} />))
    expect(result.pinnedTokens).toEqual([bnb])
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})
