import { captureException } from '@sentry/react'
import { useCallback } from 'react'

import { LOCALSTORAGE_LAST_WALLETKEY_EVM, SUPPORTED_WALLETS } from 'constants/wallets'

export const useActivationWallet: () => {
  tryActivation: (walletKey: string, isEagerly?: boolean) => Promise<void>
} = () => {
  const tryActivationEVM: (walletKey: string, isEagerly?: boolean) => Promise<void> = useCallback(
    async (walletKey: string, isEagerly = false) => {
      const wallet = (SUPPORTED_WALLETS as any)[walletKey]
      try {
        console.info('Activate EVM start', { walletKey, isEagerly })
        if (isEagerly) {
          if (wallet.connector.connectEagerly) {
            await wallet.connector.connectEagerly()
            console.info('Activate EVM success with .connectEagerly()', {
              walletKey,
              isEagerly,
              'wallet.connector': wallet.connector,
            })
          } else {
            await wallet.connector.activate()
            console.info('Activate EVM success with .activate()', { walletKey, isEagerly })
          }
        } else {
          await wallet.connector.activate()
          console.info('Activate EVM success with .activate()', { walletKey, isEagerly })
        }
        localStorage.setItem(LOCALSTORAGE_LAST_WALLETKEY_EVM, walletKey)
      } catch (error) {
        console.error('Activate EVM failed:', { walletKey, wallet, error, isEagerly })
        localStorage.removeItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
        const e = new Error(`[Wallet] ${error.message}`)
        e.name = 'Activate EVM failed'
        e.stack = ''
        captureException(e, {
          level: 'warning',
          extra: { error, walletKey, isEagerly },
        })
        throw error
      }
    },
    [],
  )

  const tryActivation: (walletKey: string, isEagerly?: boolean) => Promise<void> = useCallback(
    async (walletKey: string, isEagerly = false) => {
      const wallet = (SUPPORTED_WALLETS as any)[walletKey]
      if (!wallet.href) {
        await tryActivationEVM(walletKey, isEagerly)
      }
    },
    [tryActivationEVM],
  )

  return {
    tryActivation,
  }
}
