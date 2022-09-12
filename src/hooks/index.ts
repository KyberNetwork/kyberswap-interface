import { ChainId, ChainType, getChainType } from '@namgold/ks-sdk-core'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useSelector } from 'react-redux'
import { useLocalStorage } from 'react-use'

import { injected } from 'connectors'
import { EVM_NETWORK, EVM_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { AppState } from 'state'

export const providers: {
  [chainId in EVM_NETWORK]: ethers.providers.JsonRpcProvider
} = EVM_NETWORKS.reduce(
  (acc, val) => {
    acc[val] = new ethers.providers.JsonRpcProvider(NETWORKS_INFO[val].rpcUrl)
    return acc
  },
  {} as {
    [chainId in EVM_NETWORK]: ethers.providers.JsonRpcProvider
  },
)

export function useActiveWeb3React(): { chainId: ChainId; account?: string } {
  const chainIdState = useSelector<AppState, ChainId>(state => state.user.chainId)
  const chainType = getChainType(chainIdState)
  const { account } = useWeb3ReactCore()
  const { publicKey } = useWallet()

  const address = useMemo(
    () => (chainType === ChainType.EVM ? account ?? undefined : publicKey?.toBase58()),
    [account, chainType, publicKey],
  )

  return { chainId: chainIdState, account: address }
}

async function isAuthorized(): Promise<boolean> {
  if (!window.ethereum) {
    return false
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })

    if (accounts?.length > 0) {
      return true
    }
    return false
  } catch {
    return false
  }
}

let globalTried = false

export function useEagerConnect() {
  const { chainId } = useActiveWeb3React()
  const chainType = getChainType(chainId)
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does
  const [tried, setTried] = useState(false)
  const [isManuallyDisconnect] = useLocalStorage('user-manually-disconnect')

  useEffect(() => {
    globalTried = tried
  }, [tried])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!globalTried) setTried(true)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (chainType === ChainType.SOLANA) setTried(true)
    else {
      try {
        isAuthorized()
          .then(isAuthorized => {
            if (isAuthorized && !isManuallyDisconnect) {
              activate(injected, undefined, true).catch(() => {
                setTried(true)
              })
            } else {
              if (isMobile && window.ethereum) {
                activate(injected, undefined, true).catch(() => {
                  setTried(true)
                })
              } else {
                setTried(true)
              }
            }
          })
          .catch(e => {
            console.log('Eagerly connect: authorize error', e)
            setTried(true)
          })
      } catch (e) {
        console.log('Eagerly connect: authorize error', e)
        setTried(true)
      }
    }
  }, [activate, chainType, isManuallyDisconnect]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried(true)
    }
  }, [active])

  return tried
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network theyre on
 */
export function useInactiveListener(suppress = false) {
  const { active, error, activate } = useWeb3ReactCore() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleChainChanged = () => {
        // eat errors
        activate(injected, undefined, true).catch(error => {
          console.error('Failed to activate after chain changed', error)
        })
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          // eat errors
          activate(injected, undefined, true).catch(error => {
            console.error('Failed to activate after accounts changed', error)
          })
        }
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    return undefined
  }, [active, error, suppress, activate])
}
