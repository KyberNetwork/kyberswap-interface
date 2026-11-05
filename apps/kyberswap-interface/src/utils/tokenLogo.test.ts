import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { beforeEach, expect, it, vi } from 'vitest'

import { getTokenLogoURL } from 'utils/tokenLogo'

const state = vi.hoisted(() => ({
  lists: { mapWhitelistTokens: {} as Record<number, Record<string, { logoURI: string }>> },
}))
vi.mock('state', () => ({ default: { getState: () => state } }))

const address = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const checksummed = new Token(ChainId.ARBITRUM, address, 6).address

beforeEach(() => {
  state.lists.mapWhitelistTokens = {}
})

it('resolves a lowercase persisted address against checksum whitelist keys on its own chain', () => {
  state.lists.mapWhitelistTokens[ChainId.ARBITRUM] = { [checksummed]: { logoURI: 'arbitrum-usdc' } }
  state.lists.mapWhitelistTokens[ChainId.MAINNET] = { [checksummed]: { logoURI: 'other-chain' } }
  expect(getTokenLogoURL(address, ChainId.ARBITRUM)).toBe('arbitrum-usdc')
  expect(getTokenLogoURL(checksummed, ChainId.ARBITRUM)).toBe('arbitrum-usdc')
})

it('also accepts lowercase whitelist keys and returns empty when the chain has no metadata', () => {
  state.lists.mapWhitelistTokens[ChainId.ARBITRUM] = { [address]: { logoURI: 'arbitrum-usdc' } }
  expect(getTokenLogoURL(checksummed, ChainId.ARBITRUM)).toBe('arbitrum-usdc')
  expect(getTokenLogoURL(address, ChainId.BASE)).toBe('')
})
