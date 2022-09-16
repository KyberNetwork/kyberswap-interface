import React, { useContext } from 'react'

export const EthPowAckModalContext = React.createContext<[string, (t: string) => void]>([
  '',
  () => {
    // empty
  },
])
export const useEthPowAckModalContext = () => {
  return useContext(EthPowAckModalContext)
}
