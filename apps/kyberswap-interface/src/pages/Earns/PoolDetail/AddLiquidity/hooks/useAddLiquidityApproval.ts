import { Token, TxStatus, ZapRouteDetail } from '@kyber/schema'
import { useMemo } from 'react'

import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import {
  APPROVAL_STATE,
  ApprovalAdditionalInfo,
  SubmitTxData,
  parseApprovalAmounts,
} from 'pages/Earns/PoolDetail/AddLiquidity/hooks/approval/shared'
import useErc20Approvals from 'pages/Earns/PoolDetail/AddLiquidity/hooks/approval/useErc20Approvals'
import useNftApproval from 'pages/Earns/PoolDetail/AddLiquidity/hooks/approval/useNftApproval'
import { Exchange } from 'pages/Earns/constants'
import { getNftManagerContractAddress } from 'pages/Earns/utils'

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
  const approvalRequests = useMemo(() => parseApprovalAmounts(tokensIn, amountsIn), [amountsIn, tokensIn])
  const approvalKey = useMemo(
    () => approvalRequests.map(({ address, amount }) => `${address.toLowerCase()}:${amount}`).join('|'),
    [approvalRequests],
  )
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
    approvalRequests,
    approvalKey,
    owner: account || '',
    spender: approvalSpender,
    chainId,
    rpcUrl: rpcUrl || '',
    onSubmitTx,
    txStatus,
    txHashMapping,
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
      approvalRequests.find(
        ({ address }) =>
          tokenApproval.approvalStates[address] === APPROVAL_STATE.NOT_APPROVED ||
          tokenApproval.approvalStates[address] === APPROVAL_STATE.UNKNOWN,
      ),
    [approvalRequests, tokenApproval.approvalStates],
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
