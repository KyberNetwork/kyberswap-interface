import { TxStatus } from '@kyber/schema'
import { getFunctionSelector } from '@kyber/utils/dist/crypto'
import { ethers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ApprovalAdditionalInfo,
  ApprovalTxState,
  SubmitTxData,
  getReadProvider,
} from 'pages/Earns/PoolDetail/AddLiquidity/hooks/approval/shared'

interface UseNftApprovalProps extends ApprovalTxState {
  chainId?: number
  rpcUrl: string
  nftManagerContract: string
  tokenId?: number
  spender?: string
  userAddress: string
  dexName?: string
  onSubmitTx: (txData: SubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => Promise<string>
}

export default function useNftApproval({
  chainId,
  rpcUrl,
  nftManagerContract,
  tokenId,
  spender,
  userAddress,
  dexName,
  onSubmitTx,
  txStatus,
  txHashMapping,
}: UseNftApprovalProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [approvePendingTx, setApprovePendingTx] = useState('')
  const currentApprovePendingTx = approvePendingTx ? txHashMapping?.[approvePendingTx] ?? approvePendingTx : ''
  const readProvider = useMemo(() => getReadProvider(chainId, rpcUrl), [chainId, rpcUrl])

  const approve = useCallback(async () => {
    if (!userAddress || !spender || !tokenId || !nftManagerContract) return

    const methodSignature = getFunctionSelector('approve(address,uint256)')
    const encodedSpenderAddress = spender.slice(2).padStart(64, '0')
    const encodedTokenId = tokenId.toString(16).padStart(64, '0')
    const txHash = await onSubmitTx(
      {
        from: userAddress,
        to: nftManagerContract,
        value: '0x0',
        gasLimit: '0x0',
        data: `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`,
      },
      {
        type: 'nft_approval',
        tokenAddress: nftManagerContract,
        dexName,
      },
    )

    setApprovePendingTx(txHash)
  }, [dexName, nftManagerContract, onSubmitTx, spender, tokenId, userAddress])

  const checkApproval = useCallback(async () => {
    if (!spender || !userAddress || !tokenId || approvePendingTx || !nftManagerContract) return

    setIsChecking(true)
    const methodSignature = getFunctionSelector('getApproved(uint256)')
    const encodedTokenId = tokenId.toString(16).padStart(64, '0')

    try {
      if (!readProvider) {
        setIsApproved(false)
        return
      }

      const result = await readProvider.call({ to: nftManagerContract, data: `0x${methodSignature}${encodedTokenId}` })
      const approvedAddress = result && result !== '0x' ? ethers.utils.getAddress(`0x${result.slice(-40)}`) : ''
      setIsApproved(approvedAddress.toLowerCase() === spender.toLowerCase())
    } catch {
      setIsApproved(false)
    } finally {
      setIsChecking(false)
    }
  }, [approvePendingTx, nftManagerContract, readProvider, spender, tokenId, userAddress])

  useEffect(() => {
    if (!txStatus || !approvePendingTx) return

    const status = txStatus[approvePendingTx]
    if (status === TxStatus.SUCCESS) {
      setApprovePendingTx('')
      setIsApproved(true)
    } else if (status === TxStatus.FAILED || status === TxStatus.CANCELLED) {
      setApprovePendingTx('')
      setIsApproved(false)
    }
  }, [approvePendingTx, txStatus])

  useEffect(() => {
    if (txStatus || !currentApprovePendingTx || !readProvider) return

    const interval = setInterval(() => {
      readProvider.getTransactionReceipt(currentApprovePendingTx).then(receipt => {
        if (!receipt) return
        setApprovePendingTx('')
        setIsApproved(Boolean(receipt.status))
      })
    }, 8_000)

    return () => clearInterval(interval)
  }, [currentApprovePendingTx, readProvider, txStatus])

  useEffect(() => {
    void checkApproval()
  }, [checkApproval])

  return {
    isChecking,
    isApproved,
    approve,
    approvePendingTx,
  }
}
