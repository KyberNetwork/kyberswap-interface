import { type ApprovalAdditionalInfo } from '@kyber/hooks'
import { TxStatus } from '@kyber/schema'
import { ReactNode, createContext, useContext } from 'react'
import { BuildZapInData } from 'services/zapInService'

export interface AddLiquiditySubmitTxData {
  from: string
  to: string
  value: string
  data: string
  gasLimit: string
}

interface BuildZapInRouteParams {
  chainId: number
  sender: string
  recipient: string
  route: unknown
  deadline: number
  permits?: Record<string, string>
  source: string
}

interface AddLiquidityRuntimeContextValue {
  buildRouteLoading: boolean
  buildZapInRoute: (args: BuildZapInRouteParams) => { unwrap: () => Promise<BuildZapInData> }
  txStatusMap: Record<string, TxStatus>
  txHashMapping: Record<string, string>
  submitApprovalTx: (txData: AddLiquiditySubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => Promise<string>
}

const AddLiquidityRuntimeContext = createContext<AddLiquidityRuntimeContextValue | null>(null)

export const AddLiquidityRuntimeProvider = ({
  value,
  children,
}: {
  value: AddLiquidityRuntimeContextValue
  children: ReactNode
}) => {
  return <AddLiquidityRuntimeContext.Provider value={value}>{children}</AddLiquidityRuntimeContext.Provider>
}

export const useAddLiquidityRuntimeContext = () => {
  const context = useContext(AddLiquidityRuntimeContext)

  if (!context) {
    throw new Error('useAddLiquidityRuntimeContext must be used within AddLiquidityRuntimeProvider')
  }

  return context
}

export type { AddLiquidityRuntimeContextValue, BuildZapInRouteParams }
