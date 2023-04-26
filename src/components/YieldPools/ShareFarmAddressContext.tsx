import { createContext, useContext, useState } from 'react'

type ShareFarmAddressContextValues = {
  address: string
  setAddress: React.Dispatch<React.SetStateAction<string>>
}
const ShareFarmAddressContext = createContext<ShareFarmAddressContextValues | undefined>(undefined)

export const useShareFarmAddressContext = () => {
  const context = useContext(ShareFarmAddressContext)
  if (!context) {
    throw new Error('useShareFarmAddressContext is used without a Provider')
  }

  return context
}

export const ShareFarmAddressContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('')

  return <ShareFarmAddressContext.Provider value={{ address, setAddress }}>{children}</ShareFarmAddressContext.Provider>
}
