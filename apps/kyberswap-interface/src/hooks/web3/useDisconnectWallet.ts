import { useCallback } from 'react'
import { useDisconnect as useDisconnectWagmi } from 'wagmi'

function useDisconnectWallet() {
  const { connectors, disconnect } = useDisconnectWagmi()
  const disconnectAll = useCallback(() => {
    connectors.forEach(connector => {
      disconnect({ connector })
    })
  }, [connectors, disconnect])

  return disconnectAll
}

export default useDisconnectWallet
