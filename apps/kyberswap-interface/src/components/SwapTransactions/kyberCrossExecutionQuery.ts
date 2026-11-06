import { queryOptions, useQuery } from '@tanstack/react-query'
import { kyberCrossApi } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { chainIdToKyberCrossChainName } from 'services/crossChain/adapters/KyberCrossAdapter/types'
import { isExecutionFinished, mapRouteStateToSwapStatus } from 'services/crossChain/adapters/KyberCrossAdapter/utils'
import { normalizeAdapterName } from 'services/crossChain/utils'
import type { Hash } from 'viem'

import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { isProcessingTransactionStatus } from 'types/crossChain'

const DETAIL_POLLING_INTERVAL = 5_000

const getKyberCrossExecutionQueryOptions = (tx: HistoryTransaction) =>
  queryOptions({
    queryKey: ['kybercross-execution', tx.sourceChain, tx.sourceTxHash.toLowerCase()],
    queryFn: async () => {
      const response = await kyberCrossApi.scanTxStatus(tx.sourceTxHash as Hash)
      const execution = response.data.route_execution
      const sourceChain = typeof tx.sourceChain === 'number' ? chainIdToKyberCrossChainName[tx.sourceChain] : undefined

      if (
        !execution ||
        execution.source_tx_hash.toLowerCase() !== tx.sourceTxHash.toLowerCase() ||
        execution.source_chain !== sourceChain
      ) {
        throw new Error('KyberCross execution does not match the selected transaction')
      }

      return execution
    },
  })

export const getKyberCrossDetailQueryOptions = (tx: HistoryTransaction) =>
  queryOptions({
    ...getKyberCrossExecutionQueryOptions(tx),
    // Final executions stay cached for this page session and never trigger another automatic fetch.
    gcTime: Infinity,
    enabled: query => !query.state.data || !isExecutionFinished(query.state.data),
    retry: 1,
    // Opening prepares this cache; mounting the modal must not repeat that request.
    staleTime: DETAIL_POLLING_INTERVAL,
    retryOnMount: false,
    refetchInterval: query => {
      const { data } = query.state
      if (data && isExecutionFinished(data)) return false

      return DETAIL_POLLING_INTERVAL
    },
  })

/** History enriches incomplete Gas Drop data once, sharing execution cache with the polling detail modal. */
export const useHistoryGasDrop = (tx: HistoryTransaction) => {
  const hasLocalGasDrop = !!tx.gasDrop || !!tx.gasDropStatus
  const localGas = tx.gasDropStatus
  const hasFinalLocalGasDrop =
    localGas?.status === 'Failed' ||
    localGas?.status === 'NotExecuted' ||
    (localGas?.status === 'Delivered' && !!localGas.amount)
  const isKyberCross = normalizeAdapterName(tx.adapter) === 'kybercross'
  // Let the provider updater finish active local swaps before spending history's single lookup.
  const enabled =
    isKyberCross && !hasFinalLocalGasDrop && (!hasLocalGasDrop || !isProcessingTransactionStatus(tx.status))
  const { data: execution } = useQuery({
    ...getKyberCrossExecutionQueryOptions(tx),
    enabled,
    // Keep the one-time lookup (including errors) for this page session.
    gcTime: Infinity,
    staleTime: Infinity,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })

  if (hasFinalLocalGasDrop || !isKyberCross || !execution) return localGas

  const hasGasDrop =
    hasLocalGasDrop ||
    !!tx.kyberCrossRoute?.gasDropSwap ||
    !!execution.data.gas_drop ||
    execution.route_state === 'GAS_DROP_PENDING'
  return mapRouteStateToSwapStatus(execution, hasGasDrop).gasDropStatus
}
