import useSWRImmutable from 'swr/immutable'

/**
 * NOTE:
 * This endpoint returns a maximum of 100 transfers for each request,
 * which means, pageSize > 100 is useless
 */

export enum MultichainTransferStatus {
  Processing = 0,
  Success = 1,
  Failure = 2,
}

export type MultichainTransfer = {
  id: number
  userAddress: string
  srcChainId: string
  dstChainId: string
  srcTxHash: string
  dstTxHash: string
  srcTokenSymbol: string
  dstTokenSymbol: string
  srcAmount: string
  dstAmount: string
  status: number
  createdAt: number
}

type Response = {
  code: number
  message: string
  data: {
    transfers: MultichainTransfer[]
    pagination: {
      totalItems: number
    }
  }
}

const useGetBridgeTransfers = (swrKey: string | null) => {
  return useSWRImmutable<Response>(swrKey, async (url: string) => {
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (data) {
        return data
      }

      throw new Error(`No transfers found with url = ${swrKey}`)
    }

    throw new Error(`Fetching bridge transfers failed with url = ${swrKey}`)
  })
}

export default useGetBridgeTransfers
