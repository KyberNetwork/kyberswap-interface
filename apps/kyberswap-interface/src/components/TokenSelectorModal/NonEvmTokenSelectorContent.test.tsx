// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import NonEvmTokenSelectorContent from 'components/TokenSelectorModal/NonEvmTokenSelectorContent'
import { WalletBalanceContext, WalletBalanceScope } from 'state/wallet/WalletBalanceContext'
import { NonEvmChain } from 'types/crossChain'

const appAddress = '11111111111111111111111111111111'
const selectedAddress = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const mocks = vi.hoisted(() => ({ getBalance: vi.fn(), getAccounts: vi.fn(), bitcoinBalance: vi.fn() }))
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: { toString: () => '11111111111111111111111111111111' } }),
  useConnection: () => ({
    connection: {
      rpcEndpoint: 'test-rpc',
      getBalance: mocks.getBalance,
      getParsedTokenAccountsByOwner: mocks.getAccounts,
    },
  }),
}))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: 'app-evm', chainId: 1 }) }))
vi.mock('hooks/useDebounce', () => ({ default: (value: string) => value }))
vi.mock('constants/env', () => ({ SOLANA_RPC: 'test-rpc' }))
vi.mock('pages/Swap/crossChain/provider/SolanaConnectModalProvider', () => ({ SolanaConnectModalProvider: () => null }))
vi.mock('pages/Swap/crossChain/utils', () => ({ SOLANA_NATIVE: 'native-sol' }))
vi.mock('pages/Swap/crossChain/hooks/useNearBalances', () => ({ useNearBalances: () => ({ balances: {} }) }))
vi.mock('pages/Swap/crossChain/adapters/NearIntentsAdapter/useNearIntentsTokens', () => ({
  useNearIntentsTokens: () => ({ nearTokens: [], isLoadingNearTokens: false }),
}))
vi.mock('pages/Swap/crossChain/hooks/useSolanaTokens', () => ({
  useSolanaTokens: () => ({
    solanaTokens: [
      { id: 'mint-a', symbol: 'AAA', name: 'A', decimals: 2 },
      { id: 'mint-b', symbol: 'BBB', name: 'B', decimals: 2 },
    ],
    isLoadingSolanaTokens: false,
  }),
}))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({
  useBitcoinWallet: () => ({ walletInfo: { address: 'app-btc' } }),
}))
vi.mock('components/SwapForm/CrossChain/hooks/useCrossChainBalance', () => ({
  useCrossChainBalance: mocks.bitcoinBalance,
}))
vi.mock('components/TokenSelectorModal/components', () => ({
  Balance: ({ balance }: { balance: string }) => <span data-testid="balance">{balance}</span>,
  NoResult: () => null,
  SearchControl: () => null,
  SearchInput: 'input',
  SearchWrapper: 'div',
}))
vi.mock('components/TokenSelectorModal/TabBar', () => ({ TabBar: () => null }))
vi.mock('components/TokenSelectorModal/TokenListHeader', () => ({ TokenListHeader: () => null }))
vi.mock('components/TokenSelectorModal/TokenListSkeleton', () => ({ TokenListSkeleton: () => null }))
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
let client: QueryClient
const render = (scope?: WalletBalanceScope, chain = NonEvmChain.Solana) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <I18nProvider i18n={i18n}>
          <WalletBalanceContext.Provider value={scope}>
            <NonEvmTokenSelectorContent chain={chain} onSelect={() => {}} />
          </WalletBalanceContext.Provider>
        </I18nProvider>
      </QueryClientProvider>,
    ),
  )
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })
const accounts = (mint: string, amount: string) => ({
  value: [{ account: { data: { parsed: { info: { mint, tokenAmount: { amount, decimals: 2 } } } } } }],
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  i18n.load('en', {})
  i18n.activate('en')
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  container = document.createElement('div')
  root = createRoot(container)
  mocks.getBalance.mockResolvedValue(0)
  mocks.getAccounts.mockImplementation(owner =>
    Promise.resolve(accounts(owner.toString() === appAddress ? 'mint-a' : 'mint-b', '500')),
  )
  mocks.bitcoinBalance.mockImplementation((_chain, _token, address) =>
    address === 'receiver-btc' ? '123000000' : undefined,
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.unstubAllGlobals()
})
it('shows and sorts held tokens for the selected Solana slot rather than the global wallet', async () => {
  await render({ chain: NonEvmChain.Solana, address: selectedAddress })
  await settle()
  expect(mocks.getAccounts.mock.calls[0][0].toString()).toBe(selectedAddress)
  expect(container.querySelector('[aria-label="Tokens"] button')?.textContent).toContain('BBB')
  expect(container.querySelector('[data-testid="balance"]')?.textContent).toBe('5')
  await render({ chain: NonEvmChain.Solana, address: '' })
  await settle()
  expect(container.querySelector('[data-testid="balance"]')).toBeNull()
  expect(mocks.getAccounts).toHaveBeenCalledTimes(1)
})
it('does not apply a late balance response from a wallet that is no longer selected', async () => {
  let resolve!: (value: ReturnType<typeof accounts>) => void
  mocks.getAccounts.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done
      }),
  )
  await render({ chain: NonEvmChain.Solana, address: appAddress })
  await render({ chain: NonEvmChain.Solana, address: selectedAddress })
  await settle()
  await act(async () => resolve(accounts('mint-a', '999999')))
  await settle()
  expect(container.querySelector('[aria-label="Tokens"] button')?.textContent).toContain('BBB')
  expect(container.textContent).not.toContain('9999.99')
})
it('uses the pasted Bitcoin receiver and never falls back to the global Bitcoin wallet on another family', async () => {
  await render({ chain: NonEvmChain.Bitcoin, address: 'receiver-btc' }, NonEvmChain.Bitcoin)
  expect(container.querySelector('[data-testid="balance"]')?.textContent).toBe('1.23')
  await render({ chain: 1, address: '0xreceiver' }, NonEvmChain.Bitcoin)
  expect(mocks.bitcoinBalance.mock.lastCall?.[2]).toBeUndefined()
  expect(container.querySelector('[data-testid="balance"]')).toBeNull()
})
it('preserves the global wallet balance for consumers without independent slots', async () => {
  await render()
  await settle()
  expect(mocks.getAccounts.mock.calls[0][0].toString()).toBe(appAddress)
  expect(container.querySelector('[aria-label="Tokens"] button')?.textContent).toContain('AAA')
})
