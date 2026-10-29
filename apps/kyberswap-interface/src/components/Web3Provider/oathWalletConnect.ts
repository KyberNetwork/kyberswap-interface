import type * as AppKitControllers from '@reown/appkit-controllers'

import OATH_ICON from 'assets/wallets-connect/oath.svg'

// A local selector entry, not a WalletGuide ID or a claim of directory approval.
export const OATH_WALLET = {
  id: 'oath-ios',
  name: 'Oath Wallet',
  homepage: 'https://oathwallet.org',
  image_url: OATH_ICON,
  app_store: 'https://apps.apple.com/app/id6780187283',
  mobile_link: 'oathwallet://',
}

type Controllers = Pick<typeof AppKitControllers, 'ModalController' | 'ConnectionController' | 'RouterController'>

// EthereumProvider 2.23.9 uses AppKit in manualWCControl mode. Keep its provider,
// URI generation, cancellation and signing intact; only choose its named-wallet view.
// The pinned controller version matches the provider's existing AppKit dependency.
export function presentOathWallet({ ModalController, ConnectionController, RouterController }: Controllers) {
  ConnectionController.resetUri()
  const showOath = () => {
    if (!ModalController.state.open) return
    RouterController.reset('ConnectingWalletConnect', { wallet: OATH_WALLET })
  }
  const subscriptions = [
    ModalController.subscribeKey('open', open => {
      if (open) showOath()
    }),
    RouterController.subscribeKey('view', view => {
      // The SDK can re-open its generic desktop view when a new URI arrives.
      if (view === 'ConnectingWalletConnectBasic') showOath()
    }),
  ]
  return {
    dispose() {
      subscriptions.forEach(unsubscribe => unsubscribe())
      ConnectionController.resetUri()
      RouterController.reset('Connect')
    },
  }
}

export async function connectOathWallet<T>(
  controllers: Controllers,
  prepare: () => Promise<void>,
  connect: () => Promise<T>,
): Promise<T> {
  const presentation = presentOathWallet(controllers)
  try {
    // Clear a stale restored session before connecting, never after wagmi has committed it.
    // Otherwise an Oath selection could silently reuse a different wallet's session.
    await prepare()
    return await connect()
  } finally {
    presentation.dispose()
  }
}

// Queue the whole operation (not just the SDK's pairing). A generic connection or restoration
// must not inherit Oath's temporary modal state while another call is still setting up its chains.
let queue: Promise<unknown> = Promise.resolve()
export function queueWalletConnect<T>(connect: () => Promise<T>): Promise<T> {
  const result = queue.then(connect)
  queue = result.catch(() => undefined)
  return result
}
