export enum WalletReadyState {
  /**
   * User-installable wallets can typically be detected by scanning for an API
   * that they've injected into the global context. If such an API is present,
   * we consider the wallet to have been installed.
   */
  Installed = 'Installed',
  NotDetected = 'NotDetected',
  /**
   * Loadable wallets are always available to you. Since you can load them at
   * any time, it's meaningless to say that they have been detected.
   */
  Loadable = 'Loadable',
  /**
   * If a wallet is not supported on a given platform (eg. server-rendering, or
   * mobile) then it will stay in the `Unsupported` state.
   */
  Unsupported = 'Unsupported',
}

export const INJECTED_KEYS = [
  'COIN98',
  'BRAVE',
  'METAMASK',
  'COINBASE',
  'TRUST_WALLET',
  'KRYSTAL',
  'RABBY',
  'INJECTED',
] as const
export type INJECTED_KEY = typeof INJECTED_KEYS[number]
