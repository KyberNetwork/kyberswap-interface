import { createContext, useContext } from 'react'

import { DetailedRouteSummary } from 'types/route'

type SwapFormContextProps = {
  slippage: number
  routeSummary: DetailedRouteSummary | undefined
  typedValue: string
  recipient: string | null
  isAdvancedMode: boolean
}

const SwapFormContext = createContext<SwapFormContextProps | undefined>(undefined)

const SwapFormContextProvider: React.FC<
  SwapFormContextProps & {
    children: React.ReactNode
  }
> = ({ children, ...props }) => {
  const contextValue: SwapFormContextProps = props
  return <SwapFormContext.Provider value={contextValue}>{children}</SwapFormContext.Provider>
}

const useSwapFormContext = (): SwapFormContextProps => {
  const context = useContext(SwapFormContext)
  if (!context) {
    throw new Error('hook is used outside of SwapFormContext')
  }

  return context
}

export { SwapFormContextProvider, useSwapFormContext }
