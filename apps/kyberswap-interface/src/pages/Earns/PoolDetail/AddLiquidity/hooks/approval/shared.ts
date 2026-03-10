import { parseUnits } from '@ethersproject/units'
import { NATIVE_TOKEN_ADDRESS, Token, TxStatus } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import { AppJsonRpcProvider } from 'constants/providers'

export enum APPROVAL_STATE {
  UNKNOWN = 'unknown',
  PENDING = 'pending',
  APPROVED = 'approved',
  NOT_APPROVED = 'not_approved',
}

export interface ApprovalAdditionalInfo {
  type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all'
  tokenAddress: string
  tokenSymbol?: string
  dexName?: string
}

export interface SubmitTxData {
  from: string
  to: string
  value: string
  data: string
  gasLimit: string
}

export interface ApprovalRequest {
  address: string
  amount: string
  symbol: string
}

export interface ApprovalTxState {
  txStatus?: Record<string, TxStatus>
  txHashMapping?: Record<string, string>
}

export const getReadProvider = (chainId?: number, rpcUrl?: string) => {
  if (!rpcUrl) return null
  if (chainId !== undefined) return new AppJsonRpcProvider(rpcUrl, chainId as ChainId)
  return new ethers.providers.StaticJsonRpcProvider(rpcUrl)
}

export const parseApprovalAmounts = (tokensIn: Token[], amountsIn: string) => {
  const rawAmounts = amountsIn.split(',')

  return tokensIn.reduce<ApprovalRequest[]>((acc, token, index) => {
    const amount = rawAmounts[index]?.trim()
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return acc

    try {
      const amountInWei = parseUnits(amount, token.decimals).toString()
      if (BigInt(amountInWei) <= 0n) return acc

      acc.push({
        address: token.address,
        amount: amountInWei,
        symbol: token.symbol,
      })
    } catch {
      return acc
    }

    return acc
  }, [])
}

export const getInitialApprovalState = (approvalRequests: ApprovalRequest[]) =>
  approvalRequests.reduce<Record<string, APPROVAL_STATE>>((acc, { address }) => {
    acc[address] =
      address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.UNKNOWN
    return acc
  }, {})
