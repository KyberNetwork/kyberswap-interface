export enum MultichainTransferStatus {
  Processing = 0,
  Success = 1,
  Failure = 2,
}

export type MultichainTransfer = {
  id: number
  walletAddress: string
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
  isReceiveAnyToken: boolean
}
