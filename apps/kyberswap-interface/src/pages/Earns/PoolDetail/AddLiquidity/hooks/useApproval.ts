import {
  APPROVAL_STATE,
  PermitNftResult,
  PermitNftState,
  useErc20Approvals,
  useNftApproval,
  useNftApprovalAll,
  usePermitNft,
} from '@kyber/hooks'
import { Token, ZapRouteDetail } from '@kyber/schema'
import { parseUnits } from '@kyber/utils/crypto'
import { useMemo } from 'react'

import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import { getNftManagerContractAddress } from 'pages/Earns/utils'

interface UseApprovalProps {
  tokensIn: Token[]
  amountsIn: string
  route?: ZapRouteDetail | null
}

export interface ApprovalState {
  permit: {
    state: PermitNftState
    data: PermitNftResult | null
    sign: () => Promise<PermitNftResult | null>
  }
  tokenApproval: {
    loading: boolean
    states: Record<string, APPROVAL_STATE>
    approve: (address: string, amount?: bigint) => Promise<void>
    addressToApprove: string
  }
  nftApproval: {
    pendingTx: string
    isChecking: boolean
    isApproved: boolean
    approve: () => Promise<void>
  }
  nftApprovalAll: {
    pendingTx: string
    isChecking: boolean
    isApproved: boolean
    approve: () => Promise<void>
  }
}

export default function useApproval({ tokensIn, amountsIn, route }: UseApprovalProps): ApprovalState {
  const {
    account,
    chainId,
    exchange,
    positionId,
    deadline,
    rpcUrl,
    library,
    txStatusMap,
    txHashMapping,
    submitApprovalTx,
  } = useAddLiquidityRuntimeContext()

  const nftManagerContract =
    exchange && chainId && positionId ? getNftManagerContractAddress(exchange, chainId) || '' : ''
  const dexName = exchange || ''

  const signTypedData = useMemo(
    () =>
      library && account
        ? (signingAccount: string, typedDataJson: string) =>
            library.send('eth_signTypedData_v4', [signingAccount.toLowerCase(), typedDataJson])
        : undefined,
    [account, library],
  )

  const amountsInWei = useMemo(() => {
    if (!amountsIn || tokensIn.length === 0) return []
    return amountsIn.split(',').map((amount, index) => {
      try {
        return parseUnits(amount || '0', tokensIn[index]?.decimals || 0).toString()
      } catch {
        return '0'
      }
    })
  }, [amountsIn, tokensIn])

  const tokensToApprove = useMemo(
    () => tokensIn.filter((_, index) => Number(amountsInWei[index]) > 0),
    [amountsInWei, tokensIn],
  )
  const tokenAddressesToApprove = useMemo(() => tokensToApprove.map(token => token.address || ''), [tokensToApprove])
  const tokenSymbolsToApprove = useMemo(() => tokensToApprove.map(token => token.symbol || ''), [tokensToApprove])
  const approvalAmounts = useMemo(() => amountsInWei.filter(amount => Number(amount) > 0), [amountsInWei])

  const { permitState, signPermitNft, permitData } = usePermitNft({
    nftManagerContract,
    tokenId: positionId,
    spender: route?.routerPermitAddress,
    account,
    chainId,
    rpcUrl,
    signTypedData,
  })

  const approvalSpender =
    permitData?.permitData && route?.routerPermitAddress ? route.routerPermitAddress : route?.routerAddress || ''

  const {
    loading: tokenApprovalLoading,
    approvalStates,
    approve: approveToken,
    addressToApprove,
  } = useErc20Approvals({
    amounts: approvalAmounts,
    addreses: tokenAddressesToApprove,
    owner: account || '',
    chainId,
    rpcUrl: rpcUrl || '',
    spender: approvalSpender,
    onSubmitTx: submitApprovalTx,
    txStatus: txStatusMap,
    txHashMapping,
    tokenSymbols: tokenSymbolsToApprove,
    dexName,
  })

  const {
    isApproved: isNftApproved,
    approve: approveNft,
    approvePendingTx,
    isChecking: isNftApprovalChecking,
  } = useNftApproval({
    chainId,
    rpcUrl: rpcUrl || '',
    nftManagerContract,
    tokenId: positionId ? Number(positionId) : undefined,
    spender: route?.routerAddress || '',
    userAddress: account || '',
    onSubmitTx: submitApprovalTx,
    txStatus: txStatusMap,
    txHashMapping,
    dexName,
  })

  const {
    isApproved: isNftApprovedAll,
    approveAll: approveNftAll,
    approvePendingTx: approveAllPendingTx,
    isChecking: isNftApprovalAllChecking,
  } = useNftApprovalAll({
    chainId,
    rpcUrl: rpcUrl || '',
    nftManagerContract,
    spender: route?.routerAddress || '',
    userAddress: account || '',
    onSubmitTx: submitApprovalTx,
    txStatus: txStatusMap,
    txHashMapping,
    dexName,
  })

  return {
    permit: {
      state: permitState,
      data: permitData,
      sign: () => signPermitNft(deadline || 0),
    },
    tokenApproval: {
      loading: tokenApprovalLoading,
      states: approvalStates as Record<string, APPROVAL_STATE>,
      approve: approveToken,
      addressToApprove,
    },
    nftApproval: {
      pendingTx: approvePendingTx,
      isChecking: isNftApprovalChecking,
      isApproved: isNftApproved,
      approve: approveNft,
    },
    nftApprovalAll: {
      pendingTx: approveAllPendingTx,
      isChecking: isNftApprovalAllChecking,
      isApproved: isNftApprovedAll,
      approve: approveNftAll,
    },
  }
}
