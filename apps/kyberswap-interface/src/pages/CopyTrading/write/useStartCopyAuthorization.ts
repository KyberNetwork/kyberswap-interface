import { ChainId } from '@kyberswap/ks-sdk-core'
import { getPublicClient, readContract } from '@wagmi/core'
import { useCallback, useRef } from 'react'
import type { PreparedAction } from 'services/copyTrading/types'

import { wagmiConfig } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useIsSmartAccount } from 'hooks/useIsSmartAccount'
import {
  buildStartCopyPermitTypedData,
  encodeStartCopyPermitData,
  getStartCopyAllowanceAuthorization,
  getStartCopyAuthorizationKind,
} from 'pages/CopyTrading/write/startCopyAuthorization'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { type Address, type Hash, encodeFunctionData, parseAbi } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

const START_COPY_TOKEN_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function nonces(address owner) view returns (uint256)',
])

const PERMIT_VALIDITY_SECONDS = 24 * 60 * 60
const ALLOWANCE_REFRESH_ATTEMPTS = 6
const ALLOWANCE_REFRESH_DELAY_MS = 750

type PendingApproval = {
  chainId: number
  expectedAllowanceRaw: string
  hash: Hash
  ownerAddress: Address
  spenderAddress: Address
  tokenAddress: Address
}

type StartCopyApprovalExtra = {
  arbitrary?: { startCopyApprovalAmountRaw?: unknown }
  contract?: string
  tokenAddress?: string
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

export const useStartCopyAuthorization = () => {
  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const isSmartAccount = useIsSmartAccount()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions()
  const pendingApprovalRef = useRef<PendingApproval | undefined>(undefined)
  const requiresApprovalFallback = isSmartConnector || isSmartAccount
  const getAuthorizationKind = useCallback(
    (action: PreparedAction) => getStartCopyAuthorizationKind(action, requiresApprovalFallback),
    [requiresApprovalFallback],
  )

  const recoverPendingApproval = useCallback(
    (action: PreparedAction) => {
      if (pendingApprovalRef.current || !account) return
      const authorization = getStartCopyAllowanceAuthorization(action)
      const candidate = Object.values(allTransactions || {})
        .flatMap(transactions => transactions || [])
        .map(transaction => ({
          transaction,
          extraInfo: transaction.extraInfo as StartCopyApprovalExtra | undefined,
        }))
        .filter(
          ({ transaction, extraInfo }) =>
            !transaction.receipt &&
            transaction.type === TRANSACTION_TYPE.APPROVE &&
            transaction.chainId === authorization.chainId &&
            extraInfo?.tokenAddress?.toLowerCase() === authorization.quoteTokenAddress.toLowerCase() &&
            extraInfo?.contract?.toLowerCase() === authorization.spenderAddress.toLowerCase() &&
            typeof extraInfo.arbitrary?.startCopyApprovalAmountRaw === 'string',
        )
        .sort((a, b) => b.transaction.addedTime - a.transaction.addedTime)[0]
      const expectedAllowanceRaw = candidate?.extraInfo?.arbitrary?.startCopyApprovalAmountRaw
      if (!candidate || typeof expectedAllowanceRaw !== 'string') return

      pendingApprovalRef.current = {
        chainId: authorization.chainId,
        expectedAllowanceRaw,
        hash: candidate.transaction.hash as Hash,
        ownerAddress: account as Address,
        spenderAddress: authorization.spenderAddress,
        tokenAddress: authorization.quoteTokenAddress,
      }
    },
    [account, allTransactions],
  )

  const readAllowance = useCallback(
    async (tokenAddress: Address, ownerAddress: Address, spenderAddress: Address) => {
      return (await readContract(wagmiConfig, {
        address: tokenAddress,
        abi: START_COPY_TOKEN_ABI,
        functionName: 'allowance',
        args: [ownerAddress, spenderAddress],
        chainId: chainId as number,
      })) as bigint
    },
    [chainId],
  )

  const waitForAllowance = useCallback(
    async (
      tokenAddress: Address,
      ownerAddress: Address,
      spenderAddress: Address,
      predicate: (allowance: bigint) => boolean,
    ) => {
      for (let attempt = 0; attempt < ALLOWANCE_REFRESH_ATTEMPTS; attempt++) {
        const allowance = await readAllowance(tokenAddress, ownerAddress, spenderAddress)
        if (predicate(allowance)) return allowance
        if (attempt < ALLOWANCE_REFRESH_ATTEMPTS - 1) await wait(ALLOWANCE_REFRESH_DELAY_MS)
      }
      throw new Error('The token allowance has not updated on-chain yet. Check its confirmation before trying again.')
    },
    [readAllowance],
  )

  const confirmPendingApproval = useCallback(
    async (action: PreparedAction) => {
      const pending = pendingApprovalRef.current
      if (!pending) return
      if (pending.chainId !== Number(action.chainId) || pending.ownerAddress.toLowerCase() !== account?.toLowerCase()) {
        throw new Error('A token approval from another Start Copy attempt is still awaiting confirmation.')
      }

      const publicClient = getPublicClient(wagmiConfig, { chainId: pending.chainId })
      if (!publicClient) throw new Error('The public client is unavailable for the selected chain.')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: pending.hash })
      if (receipt.status !== 'success') {
        pendingApprovalRef.current = undefined
        throw new Error('The token approval reverted on-chain.')
      }

      const expectedAllowance = BigInt(pending.expectedAllowanceRaw)
      await waitForAllowance(
        pending.tokenAddress,
        pending.ownerAddress,
        pending.spenderAddress,
        allowance => allowance === expectedAllowance || (expectedAllowance > 0n && allowance >= expectedAllowance),
      )
      pendingApprovalRef.current = undefined
    },
    [account, waitForAllowance],
  )

  const authorize = useCallback(
    async (action: PreparedAction) => {
      if (!account || action.expectedAccount?.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The Start Copy authorization sender does not match your wallet.')
      }

      const authorization = getStartCopyAllowanceAuthorization(action)
      const authorizationKind = getAuthorizationKind(action)
      if (chainId !== authorization.chainId) {
        throw new Error('Switch to the prepared chain before authorizing the quote token.')
      }

      recoverPendingApproval(action)
      await confirmPendingApproval(action)

      const ownerAddress = account as Address
      const currentAllowance = await readAllowance(
        authorization.quoteTokenAddress,
        ownerAddress,
        authorization.spenderAddress,
      )
      const requiredAllowance = BigInt(authorization.requiredAllowanceRaw)
      if (currentAllowance >= requiredAllowance) {
        return undefined
      }

      if (authorizationKind === 'permit') {
        const nonce = (await readContract(wagmiConfig, {
          address: authorization.quoteTokenAddress,
          abi: START_COPY_TOKEN_ABI,
          functionName: 'nonces',
          args: [ownerAddress],
          chainId: authorization.chainId,
        })) as bigint
        const deadline = Math.floor(Date.now() / 1000) + PERMIT_VALIDITY_SECONDS
        const typedData = buildStartCopyPermitTypedData({
          account: ownerAddress,
          authorization,
          deadline,
          nonce,
        })

        const rawSignature = await signTypedDataRaw({
          account: ownerAddress,
          chainId: authorization.chainId,
          typedData,
        })
        const createPermitData = encodeStartCopyPermitData({
          authorization,
          deadline,
          nonce,
          rawSignature,
        })
        return createPermitData
      }

      const submitApproval = async (allowance: bigint) => {
        const result = await sendEVMTransaction({
          account,
          contractAddress: authorization.quoteTokenAddress,
          encodedData: encodeFunctionData({
            abi: START_COPY_TOKEN_ABI,
            functionName: 'approve',
            args: [authorization.spenderAddress, allowance],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: undefined },
          isSmartConnector,
          chainId: authorization.chainId as ChainId,
        })
        if (!result?.hash) throw new Error('The token approval was not submitted.')

        const hash = result.hash as Hash
        pendingApprovalRef.current = {
          chainId: authorization.chainId,
          expectedAllowanceRaw: allowance.toString(),
          hash,
          ownerAddress,
          spenderAddress: authorization.spenderAddress,
          tokenAddress: authorization.quoteTokenAddress,
        }
        void addTransactionWithType({
          hash,
          desiredChainId: authorization.chainId as ChainId,
          type: TRANSACTION_TYPE.APPROVE,
          extraInfo: {
            tokenAddress: authorization.quoteTokenAddress,
            tokenSymbol: action.startCopy?.quoteToken?.symbol || '',
            contract: authorization.spenderAddress,
            arbitrary: { startCopyApprovalAmountRaw: allowance.toString() },
          },
        })
        await confirmPendingApproval(action)
      }

      if (authorization.approvalScheme === 'START_COPY_APPROVAL_SCHEME_ZERO_THEN_SET' && currentAllowance > 0n) {
        await submitApproval(0n)
      }

      const refreshedAllowance = await readAllowance(
        authorization.quoteTokenAddress,
        ownerAddress,
        authorization.spenderAddress,
      )
      if (refreshedAllowance < requiredAllowance) await submitApproval(requiredAllowance)

      return undefined
    },
    [
      account,
      addTransactionWithType,
      chainId,
      confirmPendingApproval,
      getAuthorizationKind,
      isSmartConnector,
      readAllowance,
      recoverPendingApproval,
    ],
  )

  return { authorize, getAuthorizationKind }
}
