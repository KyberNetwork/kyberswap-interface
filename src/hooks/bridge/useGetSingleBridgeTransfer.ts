import useSWRImmutable from 'swr/immutable'

export type SingleBridgeTransferDetail = {
  pairid: string
  txid: string
  txto: string
  txheight: number
  txtime: string
  from: string
  to: string
  bind: string
  value: string
  swaptx: string
  swapheight: number
  swaptime: string
  swapvalue: string
  swaptype: number
  swapnonce: number
  status: number
  statusmsg: string
  timestamp: number
  memo: string
  swapinfo: string
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
  inittime: number
}

type Response = {
  msg: string
  info: SingleBridgeTransferDetail
}

const useGetSingleBridgeTransfer = (txHash: string, skip?: boolean) => {
  return useSWRImmutable<Response>(
    `https://bridgeapi.anyswap.exchange/v2/history/details?params=${txHash}`,
    async (url: string) => {
      if (skip) {
        throw new Error('skip request')
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data && data.info) {
          return data
        }

        const err = `No transfer data found with txHash=${txHash}`
        throw err
      }

      const err = `Fetching bridge transfer failed with txHash=${txHash}`
      throw err
    },
  )
}

export default useGetSingleBridgeTransfer
