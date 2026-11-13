import { describe, expect, it, vi } from 'vitest'

import { createLedgerProvider } from './ledger'

const mocks = vi.hoisted(() => ({
  request: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  sdkLoaded: vi.fn(),
}))
vi.mock('@ledgerhq/hw-transport-webusb', () => ({
  default: {
    request: mocks.request,
    create: vi.fn().mockResolvedValue({ close: mocks.close, send: mocks.send, setExchangeTimeout: vi.fn() }),
  },
}))
vi.mock('@ledgerhq/hw-app-btc', () => {
  mocks.sdkLoaded()
  return {
    default: class {
      getWalletPublicKey = vi.fn().mockResolvedValue({ bitcoinAddress: 'btc-address', publicKey: 'public-key' })
    },
  }
})

describe('Ledger lazy SDK', () => {
  it('loads after USB permission and preserves connection and disposal', async () => {
    const setWalletInfo = vi.fn()
    const provider = createLedgerProvider({
      connectingWallet: null,
      setWalletInfo,
      defaultInfo: { address: null, publicKey: null, walletType: null, isConnected: false },
    })
    expect(mocks.sdkLoaded).not.toHaveBeenCalled()
    await provider.connect("m/84'/0'/0'/0/0")
    expect(mocks.request.mock.invocationCallOrder[0]).toBeLessThan(mocks.sdkLoaded.mock.invocationCallOrder[0])
    expect(setWalletInfo).toHaveBeenCalledWith(expect.objectContaining({ address: 'btc-address', isConnected: true }))
    await provider.dispose?.()
    expect(mocks.close).toHaveBeenCalledOnce()
    await expect(provider.sendBitcoin({ sender: 'btc-address', recipient: 'recipient', amount: 1 })).rejects.toThrow(
      'Ledger not connected',
    )
  })
})
