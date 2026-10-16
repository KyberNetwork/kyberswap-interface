import { adaptChainsResponse } from 'services/copyTrading/adapters/agents'
import { adaptCopyAccountWalletInventoryResponse } from 'services/copyTrading/adapters/copyAccounts'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { CopyAccountWalletInventoryResponse } from 'services/copyTrading/types/responses'
import { describe, expect, it, vi } from 'vitest'

import { useWithdrawalInventory } from 'pages/CopyTrading/modals/WithdrawModal/useWithdrawalData'

vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  useMemo: (getValue: () => unknown) => getValue(),
}))

const query = vi.hoisted(() => ({
  currentData: undefined as CopyAccountWalletInventoryResponse | undefined,
  isFetching: false,
}))
vi.mock('services/copyTrading/api/endpoints/copyAccounts', () => ({
  default: { useGetCopyAccountWalletInventoryQuery: () => query },
}))
vi.mock('services/copyTrading/api/endpoints/preparedActions', () => ({ default: {} }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('pages/CopyTrading/context', () => ({
  useCopyTradingContext: () => ({
    chains: adaptChainsResponse({ data: [{ chainId: '8453', quoteToken: token }] }).data,
  }),
}))

const copyRun = { chainId: 8453, copyAccount: '0x1111111111111111111111111111111111111111' } as CopyRunListItem
const token = { chainId: '8453', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 }
const balance = {
  chainId: '8453',
  copyAccount: copyRun.copyAccount,
  tokenAddress: token.address,
  amountDecimal: '1.25',
}

describe('withdrawal inventory source', () => {
  it('uses chain metadata with a PRESENT pinned balance that has no token metadata', () => {
    query.currentData = adaptCopyAccountWalletInventoryResponse({
      data: [],
      pinnedStableBalance: { status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT', balance },
    })
    const wallet = useWithdrawalInventory(copyRun, true)
    expect(wallet.stable).toBe(query.currentData.pinnedStableBalance?.balance)
    expect(wallet.stable?.token).toBeUndefined()
    expect(wallet.quoteToken).toMatchObject(token)
  })

  it('keeps chain token information when the pinned balance is absent', () => {
    query.currentData = adaptCopyAccountWalletInventoryResponse({ data: [] })
    const wallet = useWithdrawalInventory(copyRun, true)
    expect(wallet.stable).toBeUndefined()
    expect(wallet.quoteToken).toMatchObject(token)
  })

  it.each(['PINNED_STABLE_BALANCE_STATUS_TOKEN_MISMATCH', 'PINNED_STABLE_BALANCE_STATUS_UNAVAILABLE'])(
    'does not use an unusable pinned row with status %s',
    status => {
      query.currentData = adaptCopyAccountWalletInventoryResponse({
        data: [],
        pinnedStableBalance: { status, balance },
      })
      expect(useWithdrawalInventory(copyRun, true).stable).toBeUndefined()
    },
  )
})
