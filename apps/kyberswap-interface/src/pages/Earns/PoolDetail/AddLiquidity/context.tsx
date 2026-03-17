import { PoolType, TxStatus } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext } from 'react'
import { NavigateFunction } from 'react-router-dom'
import { BuildZapInData } from 'services/zapInService'

import { Exchange } from 'pages/Earns/constants'

export interface AddLiquidityApprovalInfo {
  type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all'
  tokenAddress: string
  tokenSymbol?: string
  dexName?: string
}

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
  referral?: string
}

interface AddLiquidityRuntimeContextValue {
  account?: string
  chainId?: ChainId
  walletChainId?: number
  exchange?: Exchange
  poolAddress?: string
  poolType?: PoolType
  positionId?: string
  deadline?: number
  referral?: string
  rpcUrl?: string
  isDegenMode: boolean
  library?: any
  navigate: NavigateFunction
  buildRouteLoading: boolean
  buildZapInRoute: (args: BuildZapInRouteParams) => { unwrap: () => Promise<BuildZapInData> }
  toggleWalletModal: () => void
  changeNetwork: (
    chainId: number,
    callback?: (() => void) | undefined,
    onError?: (() => void) | undefined,
    request?: boolean | undefined,
  ) => Promise<void>
  txStatusMap: Record<string, TxStatus>
  txHashMapping: Record<string, string>
  clearTracking: () => void
  addTrackedTxHash: (hash: string) => void
  addTransactionWithType: (transaction: any) => void
  submitApprovalTx: (txData: AddLiquiditySubmitTxData, additionalInfo?: AddLiquidityApprovalInfo) => Promise<string>
}

const AddLiquidityRuntimeContext = createContext<AddLiquidityRuntimeContextValue | null>(null)

export function AddLiquidityRuntimeProvider({
  value,
  children,
}: {
  value: AddLiquidityRuntimeContextValue
  children: ReactNode
}) {
  return <AddLiquidityRuntimeContext.Provider value={value}>{children}</AddLiquidityRuntimeContext.Provider>
}

export function useAddLiquidityRuntimeContext() {
  const context = useContext(AddLiquidityRuntimeContext)

  if (!context) {
    throw new Error('useAddLiquidityRuntimeContext must be used within AddLiquidityRuntimeProvider')
  }

  return context
}

export type { AddLiquidityRuntimeContextValue, BuildZapInRouteParams }
