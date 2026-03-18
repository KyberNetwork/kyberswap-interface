import { APPROVAL_STATE, useErc20Approvals } from '@kyber/hooks'
import { Token, ZapRouteDetail } from '@kyber/schema'
import { parseUnits } from '@kyber/utils/crypto'
import { useMemo } from 'react'

import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'

type UseApprovalProps = {
  tokensIn: Token[]
  amountsIn: string
  route?: ZapRouteDetail | null
}

export type ApprovalState = {
  tokenApproval: {
    loading: boolean
    states: Record<string, APPROVAL_STATE>
    approve: (address: string, amount?: bigint) => Promise<void>
    addressToApprove: string
  }
}

export const useApproval = ({ tokensIn, amountsIn, route }: UseApprovalProps): ApprovalState => {
  const { account, chainId, exchange, rpcUrl, txStatusMap, txHashMapping, submitApprovalTx } =
    useAddLiquidityRuntimeContext()

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
    spender: route?.routerAddress || '',
    onSubmitTx: submitApprovalTx,
    txStatus: txStatusMap,
    txHashMapping,
    tokenSymbols: tokenSymbolsToApprove,
    dexName: exchange || '',
  })

  return {
    tokenApproval: {
      loading: tokenApprovalLoading,
      states: approvalStates as Record<string, APPROVAL_STATE>,
      approve: approveToken,
      addressToApprove,
    },
  }
}
