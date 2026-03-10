import { parseUnits } from '@ethersproject/units'
import { NATIVE_TOKEN_ADDRESS, Token, TxStatus, ZapRouteDetail } from '@kyber/schema'
import { getFunctionSelector } from '@kyber/utils/dist/crypto'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { AppJsonRpcProvider } from 'constants/providers'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import { Exchange } from 'pages/Earns/constants'
import { getNftManagerContractAddress } from 'pages/Earns/utils'

export enum APPROVAL_STATE {
  UNKNOWN = 'unknown',
  PENDING = 'pending',
  APPROVED = 'approved',
  NOT_APPROVED = 'not_approved',
}

interface ApprovalAdditionalInfo {
  type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all'
  tokenAddress: string
  tokenSymbol?: string
  dexName?: string
}

interface SubmitTxData {
  from: string
  to: string
  value: string
  data: string
  gasLimit: string
}

const getReadProvider = (chainId?: number, rpcUrl?: string) => {
  if (!rpcUrl) return null
  if (chainId !== undefined) return new AppJsonRpcProvider(rpcUrl, chainId as ChainId)
  return new ethers.providers.StaticJsonRpcProvider(rpcUrl)
}

const parseApprovalAmounts = (tokensIn: Token[], amountsIn: string) => {
  const rawAmounts = amountsIn.split(',')

  return tokensIn.reduce<{ tokens: Token[]; amounts: string[] }>(
    (acc, token, index) => {
      const amount = rawAmounts[index]?.trim()
      if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return acc

      try {
        const amountInWei = parseUnits(amount, token.decimals).toString()
        if (BigInt(amountInWei) <= 0n) return acc

        acc.tokens.push(token)
        acc.amounts.push(amountInWei)
      } catch {
        return acc
      }

      return acc
    },
    { tokens: [], amounts: [] },
  )
}

const useErc20Approvals = ({
  amounts,
  addresses,
  owner,
  spender,
  chainId,
  rpcUrl,
  onSubmitTx,
  txStatus,
  txHashMapping,
  tokenSymbols,
  dexName,
}: {
  amounts: string[]
  addresses: string[]
  owner: string
  spender: string
  chainId?: number
  rpcUrl: string
  onSubmitTx: (txData: SubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => Promise<string>
  txStatus?: Record<string, TxStatus>
  txHashMapping?: Record<string, string>
  tokenSymbols?: string[]
  dexName?: string
}) => {
  const [loading, setLoading] = useState(false)
  const [approvalStates, setApprovalStates] = useState<Record<string, APPROVAL_STATE>>(() =>
    addresses.reduce(
      (acc, token) => ({
        ...acc,
        [token]:
          token.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.UNKNOWN,
      }),
      {},
    ),
  )
  const [pendingTx, setPendingTx] = useState('')
  const [addressToApprove, setAddressToApprove] = useState('')
  const serializedAddresses = useMemo(() => JSON.stringify(addresses), [addresses])
  const serializedAmounts = useMemo(() => JSON.stringify(amounts), [amounts])
  const stableAddresses = useMemo(() => JSON.parse(serializedAddresses) as string[], [serializedAddresses])
  const stableAmounts = useMemo(() => JSON.parse(serializedAmounts) as string[], [serializedAmounts])

  const approve = useCallback(
    async (address: string, amount?: bigint) => {
      if (!ethers.utils.isAddress(address) || !owner || !spender) return
      setAddressToApprove(address)

      const approveFunctionSig = getFunctionSelector('approve(address,uint256)')
      const paddedSpender = spender.replace('0x', '').padStart(64, '0')
      const paddedAmount = (
        amount ? amount.toString(16) : 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      ).padStart(64, '0')

      const txData = {
        from: owner,
        to: address,
        value: '0x0',
        data: `0x${approveFunctionSig}${paddedSpender}${paddedAmount}`,
      }

      try {
        const tokenIndex = addresses.findIndex(item => item.toLowerCase() === address.toLowerCase())
        const tokenSymbol = tokenIndex >= 0 && tokenSymbols ? tokenSymbols[tokenIndex] : undefined
        const txHash = await onSubmitTx(
          {
            ...txData,
            gasLimit: '0x0',
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
    [addresses, dexName, onSubmitTx, owner, spender, tokenSymbols],
  )

  const currentPendingTx = pendingTx ? txHashMapping?.[pendingTx] ?? pendingTx : ''
  const readProvider = useMemo(() => getReadProvider(chainId, rpcUrl), [chainId, rpcUrl])

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
    if (txStatus || !currentPendingTx || !addressToApprove) return

    if (!readProvider) return

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
    if (!owner || !spender || !rpcUrl || stableAddresses.length !== stableAmounts.length) return

    setLoading(true)

    Promise.all(
      stableAddresses.map(async (address, index) => {
        if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) return APPROVAL_STATE.APPROVED

        const amountToApprove = BigInt(stableAmounts[index] || '0')
        if (!readProvider) return APPROVAL_STATE.UNKNOWN

        const methodSignature = getFunctionSelector('allowance(address,address)')
        const encodedOwner = owner.slice(2).padStart(64, '0')
        const encodedSpender = spender.slice(2).padStart(64, '0')
        const data = `0x${methodSignature}${encodedOwner}${encodedSpender}`

        try {
          const raw = await readProvider.call({ to: address, data })
          const allowance = BigInt(raw || '0x0')
          return amountToApprove <= allowance ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.NOT_APPROVED
        } catch {
          return APPROVAL_STATE.UNKNOWN
        }
      }),
    )
      .then(result => {
        setApprovalStates(
          stableAddresses.reduce<Record<string, APPROVAL_STATE>>((acc, address, index) => {
            acc[address] = result[index]
            return acc
          }, {}),
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [owner, readProvider, rpcUrl, spender, stableAddresses, stableAmounts])

  return {
    loading,
    approvalStates,
    approve,
    addressToApprove,
    pendingTx,
    currentPendingTx,
  }
}

const useNftApproval = ({
  chainId,
  rpcUrl,
  nftManagerContract,
  tokenId,
  spender,
  userAddress,
  onSubmitTx,
  txStatus,
  txHashMapping,
  dexName,
}: {
  chainId?: number
  rpcUrl: string
  nftManagerContract: string
  tokenId?: number
  spender?: string
  userAddress: string
  onSubmitTx: (txData: SubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => Promise<string>
  txStatus?: Record<string, TxStatus>
  txHashMapping?: Record<string, string>
  dexName?: string
}) => {
  const [isChecking, setIsChecking] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [approvePendingTx, setApprovePendingTx] = useState('')

  const approve = useCallback(async () => {
    if (!userAddress || !spender || !tokenId || !nftManagerContract) return

    const methodSignature = getFunctionSelector('approve(address,uint256)')
    const encodedSpenderAddress = spender.slice(2).padStart(64, '0')
    const encodedTokenId = tokenId.toString(16).padStart(64, '0')
    const txData = {
      from: userAddress,
      to: nftManagerContract,
      data: `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`,
      value: '0x0',
    }

    const txHash = await onSubmitTx(
      {
        ...txData,
        gasLimit: '0x0',
      },
      {
        type: 'nft_approval',
        tokenAddress: nftManagerContract,
        dexName,
      },
    )
    setApprovePendingTx(txHash)
  }, [dexName, nftManagerContract, onSubmitTx, spender, tokenId, userAddress])

  const currentApprovePendingTx = approvePendingTx ? txHashMapping?.[approvePendingTx] ?? approvePendingTx : ''
  const readProvider = useMemo(() => getReadProvider(chainId, rpcUrl), [chainId, rpcUrl])

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
    if (txStatus || !currentApprovePendingTx) return

    if (!readProvider) return

    const interval = setInterval(() => {
      readProvider.getTransactionReceipt(currentApprovePendingTx).then(receipt => {
        if (!receipt) return
        setApprovePendingTx('')
        setIsApproved(Boolean(receipt.status))
      })
    }, 8_000)

    return () => clearInterval(interval)
  }, [currentApprovePendingTx, readProvider, txStatus])

  const checkApproval = useCallback(async () => {
    if (!spender || !userAddress || !tokenId || approvePendingTx || !nftManagerContract) return
    setIsChecking(true)

    const methodSignature = getFunctionSelector('getApproved(uint256)')
    const encodedTokenId = tokenId.toString(16).padStart(64, '0')
    const data = `0x${methodSignature}${encodedTokenId}`

    try {
      if (!readProvider) {
        setIsApproved(false)
        return
      }

      const result = await readProvider.call({ to: nftManagerContract, data })
      const approvedAddress = result && result !== '0x' ? ethers.utils.getAddress(`0x${result.slice(-40)}`) : ''
      setIsApproved(approvedAddress.toLowerCase() === spender.toLowerCase())
    } catch {
      setIsApproved(false)
    } finally {
      setIsChecking(false)
    }
  }, [approvePendingTx, nftManagerContract, readProvider, spender, tokenId, userAddress])

  useEffect(() => {
    void checkApproval()
  }, [checkApproval])

  return {
    isChecking,
    isApproved,
    approve,
    approvePendingTx,
    currentApprovePendingTx,
    checkApproval,
  }
}

export default function useAddLiquidityApproval({
  account,
  chainId,
  exchange,
  positionId,
  tokensIn,
  amountsIn,
  route,
  deadline,
  rpcUrl,
  txStatus,
  txHashMapping,
  onSubmitTx,
}: {
  account?: string
  chainId?: number
  exchange?: Exchange
  positionId?: string
  tokensIn: Token[]
  amountsIn: string
  route?: ZapRouteDetail | null
  deadline?: number
  rpcUrl?: string
  txStatus?: Record<string, TxStatus>
  txHashMapping?: Record<string, string>
  onSubmitTx: (txData: SubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => Promise<string>
}) {
  const parsedApprovalData = useMemo(() => parseApprovalAmounts(tokensIn, amountsIn), [amountsIn, tokensIn])
  const nftManagerContract =
    exchange && chainId && positionId ? getNftManagerContractAddress(exchange, chainId) || '' : ''
  const dexName = exchange || ''

  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: nftManagerContract,
    tokenId: positionId || '',
    spender: route?.routerPermitAddress || '',
    deadline: deadline || 0,
  })

  const approvalSpender =
    permitData?.permitData && route?.routerPermitAddress ? route.routerPermitAddress : route?.routerAddress || ''

  const tokenApproval = useErc20Approvals({
    amounts: parsedApprovalData.amounts,
    addresses: parsedApprovalData.tokens.map(token => token.address),
    owner: account || '',
    spender: approvalSpender,
    chainId,
    rpcUrl: rpcUrl || '',
    onSubmitTx,
    txStatus,
    txHashMapping,
    tokenSymbols: parsedApprovalData.tokens.map(token => token.symbol),
    dexName,
  })

  const nftApproval = useNftApproval({
    chainId,
    rpcUrl: rpcUrl || '',
    nftManagerContract,
    tokenId: positionId ? Number(positionId) : undefined,
    spender: route?.routerAddress || '',
    userAddress: account || '',
    onSubmitTx,
    txStatus,
    txHashMapping,
    dexName,
  })

  const nextTokenToApprove = useMemo(
    () =>
      parsedApprovalData.tokens.find(
        token =>
          tokenApproval.approvalStates[token.address] === APPROVAL_STATE.NOT_APPROVED ||
          tokenApproval.approvalStates[token.address] === APPROVAL_STATE.UNKNOWN,
      ),
    [parsedApprovalData.tokens, tokenApproval.approvalStates],
  )

  const tokenApprovalPending = Boolean(
    tokenApproval.addressToApprove ||
      Object.values(tokenApproval.approvalStates).some(state => state === APPROVAL_STATE.PENDING),
  )
  const permitEnabled = Boolean(positionId && route?.routerPermitAddress)
  const needsPermitSignature =
    permitEnabled &&
    (permitState === PermitNftState.READY_TO_SIGN ||
      permitState === PermitNftState.ERROR ||
      permitState === PermitNftState.SIGNING)
  const needsNftApproval =
    Boolean(positionId && route?.routerAddress) &&
    !needsPermitSignature &&
    !nftApproval.isApproved &&
    permitState !== PermitNftState.SIGNED

  return {
    nextTokenToApprove,
    tokenApprovalPending,
    tokenApprovalLoading: tokenApproval.loading,
    approveToken: tokenApproval.approve,
    needsPermitSignature,
    permitState,
    permitData,
    signPermit: signPermitNft,
    needsNftApproval,
    nftApprovalPending: Boolean(nftApproval.approvePendingTx),
    nftApprovalChecking: nftApproval.isChecking,
    approveNft: nftApproval.approve,
  }
}
