import useSWR, { SWRConfiguration } from 'swr'

/**
 * NOTE
 * This endpoint returns a maximum of 100 transfers for each request,
 * which means, limit > 100 is useless
 */

// https://github.com/anyswap/CrossChain-Router/wiki/How-to-integrate-AnySwap-Router#cross-chain-steps
export enum BridgeTransferStatus {
  TxNotStable = -1,
  TxNotSwapped = 5,
  ExceedLimit = 3,
  Confirming = 8,
  Swapping = 9,
  Success = 10,
  BigAmount = 12,
  Failure = 14,
  Unknown = 16,
}

export type BridgeTransfer = {
  pairid: string
  txid: string
  txto: string
  // txheight:
  txtime: string
  from: string
  to: string
  // bind: string
  value: string
  swaptx: string
  //   swapheight: number
  swaptime: string
  swapvalue: string
  swaptype: number
  swapnonce: number
  status: BridgeTransferStatus
  statusmsg: string
  timestamp: number
  memo: string
  swapinfo: any
  confirmations: number
  srcChainID: string
  destChainID: string
  historyType: string
  formatswapvalue: string
  formatvalue: string
  formatfee: string
  time: string
  fromChainID: string
  toChainID: string
  logIndex: string
  label: string
  inittime: number | ''
}

type Response = {
  msg: string
  info: BridgeTransfer[]
}

type Params = {
  addr: string
  offset: number
  limit: number
  status?: number[]
}

const useGetBridgeTransfers = (params: Params, config?: SWRConfiguration) => {
  const { addr, offset, limit, status } = params
  const statusStr = status ? status.join(',') : ''

  return useSWR<Response>(
    `https://bridgeapi.anyswap.exchange/v2/all/history/${addr}/all/all/all?offset=${offset}&limit=${limit}${
      statusStr ? `&status=${statusStr}` : ''
    }`,
    async (url: string) => {
      if (!addr) {
        throw new Error('No address provided')
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data && data.info && typeof data.info.length === 'number') {
          return data
        }

        throw new Error(
          `No transfers found with params address=${addr}, offset=${offset}, limit=${limit}, status=${statusStr}`,
        )
      }

      throw new Error(
        `Fetching bridge transfers failed with params address=${addr}, offset=${offset}, limit=${limit}, status=${statusStr}`,
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
