import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'

import { LOCALSTORAGE_LAST_WALLETKEY_EVM, LOCALSTORAGE_LAST_WALLETKEY_SOLANA } from 'constants/wallets'
import { useWeb3React } from 'hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'

import { useActivationWallet } from './useActivationWallet'

export async function isAuthorized(getAccount = false): Promise<string | boolean> {
  // Check if previous connected to Coinbase Link
  if (localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY_EVM) === 'WALLET_CONNECT' && !getAccount) {
    return true
  }
  if (!window.ethereum) {
    return false
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts?.length > 0) return accounts[0]
    return false
  } catch {
    return false
  }
}

// make sure this hook will be ran only once globally
let tried = false
export function useEagerConnect() {
  const { active } = useWeb3React()
  const { disconnect } = useWallet()
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
        setTried()
        if (isMobile && window.ethereum) {
          await tryActivation('METAMASK', true)
        } else {
          const lastWalletKeyEVM = localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY_EVM)
          const lastWalletKeySolana = localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY_SOLANA)
          if (lastWalletKeyEVM) return await tryActivation(lastWalletKeyEVM, true)
          if (lastWalletKeySolana) return await tryActivation(lastWalletKeySolana)
        }
      } catch (e) {
        console.log('Eagerly connect: authorize error', e)
        setTried()
      }
    }
    func()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried()
    }
  }, [active])

  return tried
}
