import useSWR, { SWRConfiguration } from 'swr'

import { KS_SETTING_API } from 'constants/env'
import useParsedQueryString from 'hooks/useParsedQueryString'

/**
 * NOTE
 * This endpoint returns a maximum of 100 transfers for each request,
 * which means, limit > 100 is useless
 */

export enum MultichainTransferStatus {
  Processing = 0,
  Success = 1,
  Failure = 2,
}

export type MultichainTransfer = {
  id: number
  userAddress: string
  srcChainID: number
  dstChainID: number
  srcTxHash: string
  dstTxHash: string
  srcTokenSymbol: string
  dstTokenSymbol: string
  srcAmount: string
  dstAmount: string
  status: number
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

type Params = {
  addr: string
  page: number
  pageSize: number
  status?: number
}

const useGetBridgeTransfers = (params: Params, config?: SWRConfiguration) => {
  const { addr, page, pageSize, status } = params
  const { account } = useParsedQueryString()

  // todo remove / for QC testing
  return useSWR<Response>(
    `${KS_SETTING_API}/v1/multichain-transfers?userAddress=${account || addr}&page=${page}&pageSize=${pageSize}${
      status !== undefined ? `&status=${status}` : ''
    }`,
    // `https://dede-118-70-48-11.ngrok.io/api/v1/multichain-transfers?userAddress=${
    //   account || addr
    // }&page=${page}&pageSize=${pageSize}${status !== undefined ? `&status=${status}` : ''}`,
    async (url: string) => {
      if (!account && !addr) {
        throw new Error('No address provided')
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          return data
        }

        throw new Error(
          `No transfers found with params address=${addr}, page=${page}, pageSize=${pageSize}, status=${status}`,
        )
      }

      throw new Error(
        `Fetching bridge transfers failed with params address=${addr}, page=${page}, pageSize=${pageSize}, status=${status}`,
      )
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60_000,
      ...config,
    },
  )
}

export default useGetBridgeTransfers
