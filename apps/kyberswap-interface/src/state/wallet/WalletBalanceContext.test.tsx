import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

import {
  WalletBalanceContext,
  WalletBalanceScope,
  useEvmBalanceAccount,
  useWalletBalanceAddress,
} from 'state/wallet/WalletBalanceContext'
import { NonEvmChain } from 'types/crossChain'

vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1, account: 'app-evm' }) }))
const read = (scope?: WalletBalanceScope) => {
  let result!: { evm?: string; solana?: string; bitcoin?: string; near?: string }
  const Probe = () => {
    result = {
      evm: useEvmBalanceAccount(),
      solana: useWalletBalanceAddress(NonEvmChain.Solana, 'app-sol'),
      bitcoin: useWalletBalanceAddress(NonEvmChain.Bitcoin, 'app-btc'),
      near: useWalletBalanceAddress(NonEvmChain.Near, 'app.near'),
    }
    return null
  }
  renderToStaticMarkup(createElement(WalletBalanceContext.Provider, { value: scope }, createElement(Probe)))
  return result
}
it('preserves app-wallet balance sources outside a scoped form', () => {
  expect(read()).toEqual({ evm: 'app-evm', solana: 'app-sol', bitcoin: 'app-btc', near: 'app.near' })
})
it('uses the receiver EVM address across EVM networks without borrowing other wallet families', () => {
  expect(read({ chain: 56, address: 'receiver' })).toEqual({ evm: 'receiver' })
})
it.each([NonEvmChain.Solana, NonEvmChain.Bitcoin, NonEvmChain.Near])(
  'uses only the selected %s slot and stays empty on disconnect',
  chain => {
    expect(read({ chain, address: 'selected' })).toEqual({ [chain]: 'selected' })
    expect(Object.values(read({ chain, address: '' })).every(value => value === undefined)).toBe(true)
  },
)
