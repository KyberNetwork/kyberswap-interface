import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useId } from 'react'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'

import { wagmiConfig } from 'components/Web3Provider'
import { getPreparedReasonMessage } from 'pages/CopyTrading/helpers'
import { getCapitalInputQuoteToken } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { getApiErrorMessage, validatePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { type Address, formatUnits } from 'utils/viem'

export const useWithdrawalInventory = (copyRun: CopyRunListItem, isOpen: boolean) => {
  const { currentData: inventory, isFetching } = copyAccountApi.useGetCopyAccountWalletInventoryQuery(
    { chainId: copyRun.chainId, copyAccount: copyRun.copyAccount },
    { skip: !isOpen, refetchOnMountOrArgChange: false },
  )
  const quoteToken = getCapitalInputQuoteToken(copyRun.chainId)
  const pinned = inventory?.pinnedStableBalance
  const stable =
    pinned?.status === 'PINNED_STABLE_BALANCE_STATUS_PRESENT' &&
    pinned.balance?.tokenAddress.toLowerCase() === quoteToken?.address.toLowerCase()
      ? pinned.balance
      : undefined
  return { inventory, stable, quoteToken, loading: isFetching && !inventory }
}

export type WithdrawalInventory = ReturnType<typeof useWithdrawalInventory>

// This query only supplies display data. Submission always prepares a fresh call.
export const useWithdrawalPreview = (copyRun: CopyRunListItem, account: string | undefined, enabled: boolean) => {
  const modalInstanceId = useId()
  const [prepare] = preparedActionApi.usePrepareWithdrawTokensMutation()
  const owner = account?.toLowerCase()
  const scope = [modalInstanceId, owner, copyRun.chainId, copyRun.copyAccount.toLowerCase(), copyRun.copyRunId]
  const previewQuery = useQuery({
    queryKey: ['withdraw-tokens-preview', ...scope],
    enabled: enabled && !!owner,
    queryFn: async () => {
      if (!owner) throw new Error('Connect your wallet first.')
      const response = await prepare({
        ownerAddress: owner,
        copyRunId: copyRun.copyRunId,
        selection: 'WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS',
      }).unwrap()
      return response.data
    },
    // One request per modal instance, with no polling or reuse on the next open.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const action = previewQuery.data
  const invalid =
    action &&
    validatePreparedAction(action, {
      account: owner || '',
      chainId: copyRun.chainId,
      copyAccount: copyRun.copyAccount,
      callKinds: ['PREPARED_CALL_KIND_WITHDRAW_TOKENS'],
      preview: 'withdrawTokens',
    })
  const gasQuery = useQuery({
    queryKey: ['withdraw-tokens-gas', ...scope, previewQuery.dataUpdatedAt],
    enabled: enabled && !!owner && !!action && !invalid && action.status === 'PREPARED_ACTION_STATUS_READY',
    queryFn: async () => {
      const client = getPublicClient(wagmiConfig, { chainId: copyRun.chainId })
      if (!owner || !client?.chain || !action?.call?.to || !action.call.data)
        throw new Error('Gas estimate unavailable.')
      const [gas, price] = await Promise.all([
        client.estimateGas({
          account: owner as Address,
          to: action.call.to as Address,
          data: action.call.data,
          value: BigInt(action.call.valueRaw || '0'),
        }),
        client.getGasPrice(),
      ])
      return `~${formatUnits(gas * price, client.chain.nativeCurrency.decimals)} ${client.chain.nativeCurrency.symbol}`
    },
    staleTime: Infinity,
    gcTime: 0,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })
  return {
    preview: action?.withdrawTokens,
    gas: gasQuery.data,
    loading: previewQuery.isFetching,
    gasLoading: gasQuery.isFetching,
    error: previewQuery.error
      ? getApiErrorMessage(previewQuery.error)
      : action && action.status !== 'PREPARED_ACTION_STATUS_READY'
      ? getPreparedReasonMessage(action.reason)
      : undefined,
  }
}
