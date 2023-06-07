import { useWallet } from '@solana/wallet-adapter-react'
import { Connector } from '@web3-react/types'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'

import { metaMask } from 'connectors'
import { LOCALSTORAGE_LAST_WALLETKEY, SUPPORTED_WALLETS } from 'constants/wallets'
import { useWeb3React } from 'hooks'
import { useIsAcceptedTerm, useIsUserManuallyDisconnect } from 'state/user/hooks'
import { isEVMWallet } from 'utils'

async function connectEagerly(connector: Connector) {
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
  } catch (error) {
    console.debug(`web3-react eager connection error: ${error}`)
  }
}

export async function isAuthorized(getAccount = false): Promise<string | boolean> {
  // Check if previous connected to Coinbase Link
  if (localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY) === 'WALLET_CONNECT' && !getAccount) {
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
  const [isManuallyDisconnect] = useIsUserManuallyDisconnect()
  const [isAcceptedTerm] = useIsAcceptedTerm()

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
      isAuthorized()
        .then(isAuthorized => {
          if (tried) return
          setTried()
          if (isAuthorized && !isManuallyDisconnect) {
            const lastWalletKey = localStorage.getItem(LOCALSTORAGE_LAST_WALLETKEY)
            const wallet = lastWalletKey && SUPPORTED_WALLETS[lastWalletKey]
            if (wallet && isEVMWallet(wallet)) connectEagerly(wallet.connector)
            else connectEagerly(metaMask)
          } else if (isMobile && window.ethereum) {
            connectEagerly(metaMask)
          }
        })
        .catch(e => {
          console.log('Eagerly connect: authorize error', e)
          setTried()
        })
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
