import { readContract } from '@wagmi/core'
import { useCallback } from 'react'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { wagmiConfig } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import { useIsSmartAccount } from 'hooks/useIsSmartAccount'
import {
  getStartCopyAllowanceAuthorization,
  getStartCopyAuthorizationKind,
} from 'pages/CopyTrading/modals/StartCopyModal/authorization'
import {
  buildStartCopyPermitTypedData,
  encodeStartCopyPermitData,
} from 'pages/CopyTrading/modals/StartCopyModal/permit'
import { START_COPY_TOKEN_ABI, useStartCopyApproval } from 'pages/CopyTrading/modals/StartCopyModal/useApproval'
import { type Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

const PERMIT_VALIDITY_SECONDS = 24 * 60 * 60

export const useStartCopyAuthorization = () => {
  const { account, chainId } = useActiveWeb3React()
  const isSmartAccount = useIsSmartAccount()
  const approval = useStartCopyApproval()

  const requiresApprovalFallback = approval.isSmartConnector || isSmartAccount
  const getAuthorizationKind = useCallback(
    (action: PreparedAction) => getStartCopyAuthorizationKind(action, requiresApprovalFallback),
    [requiresApprovalFallback],
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

      await approval.syncPendingApproval(action, authorization)

      const ownerAddress = account as Address
      const currentAllowance = await approval.readAllowance(
        authorization.quoteTokenAddress,
        ownerAddress,
        authorization.spenderAddress,
      )
      const requiredAllowance = BigInt(authorization.requiredAllowanceRaw)
      if (currentAllowance >= requiredAllowance) return undefined

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

        return encodeStartCopyPermitData({
          authorization,
          deadline,
          nonce,
          rawSignature,
        })
      }

      await approval.approve({
        action,
        authorization,
        currentAllowance,
        ownerAddress,
      })

      return undefined
    },
    [account, approval, chainId, getAuthorizationKind],
  )

  return { authorize, getAuthorizationKind }
}
