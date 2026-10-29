import { createContext, useContext } from 'react'

import { ERC8056TokenInfo } from 'hooks/useERC8056Token'
import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'

type SwapFormContextProps = {
  slippage: number
  routeSummary: DetailedRouteSummary | undefined
  /** Raw amount of the input token that is traded. */
  typedValue: string
  /** Input amount as shown in the input, in the input token's display units. */
  displayTypedValue: string
  /** Scale input/output-token amounts for display when either token is ERC-8056. */
  inputERC8056Info: ERC8056TokenInfo
  outputERC8056Info: ERC8056TokenInfo
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

/** ERC-8056 info of the token the platform fee is charged in, to show fee amounts in display units. */
const useFeeERC8056Info = (): ERC8056TokenInfo => {
  const { routeSummary, inputERC8056Info, outputERC8056Info } = useSwapFormContext()
  return routeSummary?.extraFee?.chargeFeeBy === ChargeFeeBy.CURRENCY_IN ? inputERC8056Info : outputERC8056Info
}

export { SwapFormContextProvider, useFeeERC8056Info, useSwapFormContext }
