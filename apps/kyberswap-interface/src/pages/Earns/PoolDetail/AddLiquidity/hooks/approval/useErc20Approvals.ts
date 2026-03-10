import { NATIVE_TOKEN_ADDRESS, TxStatus } from '@kyber/schema'
import { getFunctionSelector } from '@kyber/utils/dist/crypto'
import { ethers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  APPROVAL_STATE,
  ApprovalAdditionalInfo,
  ApprovalRequest,
  ApprovalTxState,
  SubmitTxData,
  getInitialApprovalState,
  getReadProvider,
} from 'pages/Earns/PoolDetail/AddLiquidity/hooks/approval/shared'

interface UseErc20ApprovalsProps extends ApprovalTxState {
  approvalRequests: ApprovalRequest[]
  approvalKey: string
  owner: string
  spender: string
  chainId?: number
  rpcUrl: string
  dexName?: string
  onSubmitTx: (txData: SubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => Promise<string>
}

export default function useErc20Approvals({
  approvalRequests,
  approvalKey,
  owner,
  spender,
  chainId,
  rpcUrl,
  dexName,
  onSubmitTx,
  txStatus,
  txHashMapping,
}: UseErc20ApprovalsProps) {
  const [loading, setLoading] = useState(false)
  const [approvalStates, setApprovalStates] = useState<Record<string, APPROVAL_STATE>>({})
  const [pendingTx, setPendingTx] = useState('')
  const [addressToApprove, setAddressToApprove] = useState('')
  const currentPendingTx = pendingTx ? txHashMapping?.[pendingTx] ?? pendingTx : ''
  const readProvider = useMemo(() => getReadProvider(chainId, rpcUrl), [chainId, rpcUrl])

  const approve = useCallback(
    async (address: string, amount?: bigint) => {
      if (!ethers.utils.isAddress(address) || !owner || !spender) return
      setAddressToApprove(address)

      const approveFunctionSig = getFunctionSelector('approve(address,uint256)')
      const paddedSpender = spender.replace('0x', '').padStart(64, '0')
      const paddedAmount = (
        amount ? amount.toString(16) : 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      ).padStart(64, '0')

      try {
        const tokenSymbol = approvalRequests.find(item => item.address.toLowerCase() === address.toLowerCase())?.symbol
        const txHash = await onSubmitTx(
          {
            from: owner,
            to: address,
            value: '0x0',
            gasLimit: '0x0',
            data: `0x${approveFunctionSig}${paddedSpender}${paddedAmount}`,
          },
          {
            type: 'erc20_approval',
            tokenAddress: address,
            tokenSymbol,
            dexName,
          },
        )

        setApprovalStates(prev => ({
          ...prev,
          [address]: APPROVAL_STATE.PENDING,
        }))
        setPendingTx(txHash)
      } catch {
        setAddressToApprove('')
      }
    },
    [approvalRequests, dexName, onSubmitTx, owner, spender],
  )

  useEffect(() => {
    setApprovalStates(getInitialApprovalState(approvalRequests))
    setAddressToApprove('')
    setPendingTx('')
  }, [approvalKey, approvalRequests])

  useEffect(() => {
    if (!txStatus || !pendingTx || !addressToApprove) return

    const status = txStatus[pendingTx]
    if (status === TxStatus.SUCCESS) {
      setPendingTx('')
      setAddressToApprove('')
      setApprovalStates(prev => ({
        ...prev,
        [addressToApprove]: APPROVAL_STATE.APPROVED,
      }))
    } else if (status === TxStatus.FAILED || status === TxStatus.CANCELLED) {
      setPendingTx('')
      setApprovalStates(prev => ({
        ...prev,
        [addressToApprove]: APPROVAL_STATE.NOT_APPROVED,
      }))
    }
  }, [addressToApprove, pendingTx, txStatus])

  useEffect(() => {
    if (txStatus || !currentPendingTx || !addressToApprove || !readProvider) return

    const interval = setInterval(() => {
      readProvider.getTransactionReceipt(currentPendingTx).then(receipt => {
        if (!receipt) return

        setPendingTx('')
        if (receipt.status) setAddressToApprove('')
        setApprovalStates(prev => ({
          ...prev,
          [addressToApprove]: receipt.status ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.NOT_APPROVED,
        }))
      })
    }, 8_000)

    return () => clearInterval(interval)
  }, [addressToApprove, currentPendingTx, readProvider, txStatus])

  useEffect(() => {
    if (!owner || !spender || !rpcUrl || !approvalRequests.length) return

    setLoading(true)

    Promise.all(
      approvalRequests.map(async ({ address, amount }) => {
        if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) return APPROVAL_STATE.APPROVED
        if (!readProvider) return APPROVAL_STATE.UNKNOWN

        const methodSignature = getFunctionSelector('allowance(address,address)')
        const encodedOwner = owner.slice(2).padStart(64, '0')
        const encodedSpender = spender.slice(2).padStart(64, '0')
        const data = `0x${methodSignature}${encodedOwner}${encodedSpender}`

        try {
          const allowance = BigInt(await readProvider.call({ to: address, data }))
          return BigInt(amount || '0') <= allowance ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.NOT_APPROVED
        } catch {
          return APPROVAL_STATE.UNKNOWN
        }
      }),
    )
      .then(result => {
        setApprovalStates(
          approvalRequests.reduce<Record<string, APPROVAL_STATE>>((acc, { address }, index) => {
            acc[address] = result[index]
            return acc
          }, {}),
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [approvalKey, approvalRequests, owner, readProvider, rpcUrl, spender])

  return {
    loading,
    approvalStates,
    approve,
    addressToApprove,
    pendingTx,
  }
}
