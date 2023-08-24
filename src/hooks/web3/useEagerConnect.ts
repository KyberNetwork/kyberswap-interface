import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'

import { LOCALSTORAGE_LAST_WALLETKEY_EVM, LOCALSTORAGE_LAST_WALLETKEY_SOLANA } from 'constants/wallets'
import { useWeb3React } from 'hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'

import { useActivationWallet } from './useActivationWallet'
import useDisconnectWallet from './useDisconnectWallet'

// make sure this hook will be ran only once globally
let trying = false
let tried = false
export function useEagerConnect() {
  const { active } = useWeb3React()
  const disconnect = useDisconnectWallet()
  const [, reRender] = useState({})
  const [isAcceptedTerm] = useIsAcceptedTerm()
  const { tryActivation } = useActivationWallet()

  const setTried = () => {
    tried = true
    reRender({})
  }

  useEffect(() => {
    const func = async () => {
      // If not accepted Terms or Terms changed: block eager connect for EVM wallets and disconnect manually for Solana wallet
      if (!isAcceptedTerm) {
        setTried()
        disconnect()
        return
      }
      try {
        if (trying || tried) return
        trying = true
        let activated = false
        try {
          await tryActivation('SAFE', true)
          activated = true
          tried = true
        } catch {}
        const lastWalletKeyEVM = localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
        const lastWalletKeySolana = localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA)
        await Promise.all([
          (async () => {
            if (lastWalletKeyEVM) {
              await tryActivation(lastWalletKeyEVM, true)
              activated = true
            }
          })(),
          (async () => {
            if (lastWalletKeySolana) {
              await tryActivation(lastWalletKeySolana)
              activated = true
            }
          })(),
        ])
        if (!activated) {
          if (isMobile && window.ethereum) {
            await tryActivation('INJECTED', true)
          }
        }
      } catch (e) {
        console.log('Eagerly connect: authorize error', e)
      } finally {
        setTried()
      }
    }
    func()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only running on mount

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried()
    }
  }, [active])

  return tried
}
