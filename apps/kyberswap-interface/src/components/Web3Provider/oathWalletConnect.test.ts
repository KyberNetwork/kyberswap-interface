import { describe, expect, it, vi } from 'vitest'

import {
  OATH_WALLET,
  connectOathWallet,
  presentOathWallet,
  queueWalletConnect,
} from 'components/Web3Provider/oathWalletConnect'

function controller<T extends object>(state: T) {
  const listeners = new Set<() => void>()
  return {
    state,
    listeners,
    subscribeKey<K extends keyof T>(_key: K, callback: (value: T[K]) => void) {
      const wrapped = () => callback(state[_key])
      listeners.add(wrapped)
      return () => listeners.delete(wrapped)
    },
    subscribe(callback: () => void) {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    update(values: Partial<T>) {
      Object.assign(state, values)
      queueMicrotask(() => listeners.forEach(callback => callback()))
    },
  }
}
function controls() {
  const router = controller({ view: 'Connect', data: undefined as { wallet: typeof OATH_WALLET } | undefined })
  const connection = controller({ wcUri: undefined as string | undefined })
  const modal = controller({ open: false })
  return {
    ModalController: modal,
    ConnectionController: Object.assign(connection, { resetUri: () => connection.update({ wcUri: undefined }) }),
    RouterController: Object.assign(router, {
      reset: (view: string, data?: typeof router.state.data) => router.update({ view, data }),
    }),
  }
}
type Controls = ReturnType<typeof controls>
const asControllers = (c: Controls) => c as unknown as Parameters<typeof presentOathWallet>[0]
async function flush() {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}
async function open(c: Controls, uri?: string, mobile = false) {
  c.ConnectionController.update({ wcUri: uri })
  c.RouterController.reset(mobile ? 'AllWallets' : 'ConnectingWalletConnectBasic')
  c.ModalController.update({ open: true })
  await flush()
}
function expectClean(c: Controls) {
  Object.values(c).forEach(ctrl => expect(ctrl.listeners.size).toBe(0))
  expect(c.ConnectionController.state.wcUri).toBeUndefined()
  expect(c.RouterController.state.view).toBe('Connect')
  expect(c.RouterController.state.data).toBeUndefined()
}

describe('Oath WalletConnect presentation', () => {
  it('opens the branded QR directly on desktop, including the SDK second open', async () => {
    const c = controls()
    const presentation = presentOathWallet(asControllers(c))
    await open(c)
    expect(c.RouterController.state.view).toBe('ConnectingWalletConnect')
    await open(c, 'wc:test-only@2?relay-protocol=irn&symKey=test-only')
    expect(c.RouterController.state.view).toBe('ConnectingWalletConnect')
    expect(c.RouterController.state.data?.wallet).toEqual(OATH_WALLET)
    expect(c.RouterController.state.data?.wallet.image_url).toContain('oath.svg')
    presentation.dispose()
    expectClean(c)
  })

  it('does not reuse the URI from an earlier modal attempt', async () => {
    const c = controls()
    c.ConnectionController.state.wcUri = 'wc:old-fixture'
    const presentation = presentOathWallet(asControllers(c))
    c.ModalController.update({ open: true })
    await flush()
    expect(c.ConnectionController.state.wcUri).toBeUndefined()
    expect(c.RouterController.state.view).toBe('ConnectingWalletConnect')
    presentation.dispose()
    expectClean(c)
  })

  it('routes the mobile SDK wallet list to the named wallet with its native handoff', async () => {
    const c = controls()
    const presentation = presentOathWallet(asControllers(c))
    await open(c)
    expect(c.RouterController.state.view).toBe('ConnectingWalletConnect')
    await open(c, 'wc:test-only@2?relay-protocol=irn&symKey=test-only', true)
    expect(c.RouterController.state.view).toBe('ConnectingWalletConnect')
    expect(c.RouterController.state.data?.wallet.mobile_link).toBe('oathwallet://')
    presentation.dispose()
    expectClean(c)
  })

  it('matches the installed AppKit controllers and native URL formatter', async () => {
    const sdk = await import('@reown/appkit-controllers')
    const presentation = presentOathWallet(sdk)
    try {
      sdk.RouterController.reset('ConnectingWalletConnectBasic')
      sdk.ModalController.state.open = true
      await flush()
      expect(sdk.RouterController.state.view).toBe('ConnectingWalletConnect')
      expect(sdk.RouterController.state.data?.wallet?.id).toBe(OATH_WALLET.id)
      const pairing = 'wc:test-only@2?relay-protocol=irn&symKey=test-only'
      const { redirect } = sdk.CoreHelperUtil.formatNativeUrl(OATH_WALLET.mobile_link, pairing)
      const link = new URL(redirect)
      expect(link.protocol).toBe('oathwallet:')
      expect(link.hostname).toBe('wc')
      expect(link.searchParams.get('uri')).toBe(pairing)
    } finally {
      sdk.ModalController.state.open = false
      presentation.dispose()
    }
    expect(sdk.RouterController.state.data).toBeUndefined()
  })

  it('finishes stale-session preparation before wagmi connects and preserves the result', async () => {
    const c = controls()
    const events: string[] = []
    const result = { accounts: ['test-account'], chainId: 1 }
    const actual = await connectOathWallet(
      asControllers(c),
      async () => {
        events.push('clear stale session')
      },
      async () => {
        events.push('connect')
        await open(c, 'wc:test-only')
        return result
      },
    )
    expect(events).toEqual(['clear stale session', 'connect'])
    expect(actual).toBe(result)
    expectClean(c)
  })

  it('restores generic presentation after cancellation or wallet rejection, without retrying', async () => {
    const c = controls()
    const connect = vi.fn(async () => {
      await open(c, 'wc:test-only')
      throw new Error('modal closed')
    })
    await expect(connectOathWallet(asControllers(c), async () => {}, connect)).rejects.toThrow('modal closed')
    expect(connect).toHaveBeenCalledOnce()
    expectClean(c)
  })

  it('does not start a connection when stale-session preparation fails', async () => {
    const c = controls()
    const connect = vi.fn()
    await expect(
      connectOathWallet(
        asControllers(c),
        async () => {
          throw new Error('provider unavailable')
        },
        connect,
      ),
    ).rejects.toThrow('provider unavailable')
    expect(connect).not.toHaveBeenCalled()
    expectClean(c)
  })

  it('serializes generic connection behind Oath cleanup, including failed attempts', async () => {
    const events: string[] = []
    let release = () => {}
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    const oath = queueWalletConnect(async () => {
      events.push('oath')
      await gate
      events.push('cleanup')
      throw new Error('cancelled')
    })
    const generic = queueWalletConnect(async () => {
      events.push('generic')
      return true
    })
    await flush()
    expect(events).toEqual(['oath'])
    release()
    await expect(oath).rejects.toThrow('cancelled')
    expect(await generic).toBe(true)
    expect(events).toEqual(['oath', 'cleanup', 'generic'])
  })
})
