import { getConnections } from '@wagmi/core'
import { useCallback } from 'react'
import { useConfig, useDisconnect as useDisconnectWagmi } from 'wagmi'

// Returns a callback whose identity holds across renders: `config` is a singleton and `disconnect` is
// react-query's memoized `mutate`. Reading the live connections at call time is what makes that possible —
// wagmi's `useDisconnect().connectors` is a new array on every render, and an effect keyed on this
// callback would otherwise fire on every render until the store flips, sending the wallet one
// `wallet_revokePermissions` per render.
function useDisconnectWallet() {
  const config = useConfig()
  const { disconnect } = useDisconnectWagmi()

  return useCallback(() => {
    for (const { connector } of getConnections(config)) {
      disconnect({ connector })
    }
  }, [config, disconnect])
}

export default useDisconnectWallet
