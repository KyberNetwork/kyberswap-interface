import { queryOptions } from '@tanstack/react-query'
import { kyberCrossApi } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { chainIdToKyberCrossChainName } from 'services/crossChain/adapters/KyberCrossAdapter/types'
import type { Hash } from 'viem'

import { isExecutionFinished } from 'components/SwapTransactions/TransactionDetail/kyberCrossDetail'
import type { HistoryTransaction } from 'components/SwapTransactions/history'

const DETAIL_POLLING_INTERVAL = 5_000

export const getKyberCrossDetailQueryOptions = (tx: HistoryTransaction) =>
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

    retry: 1,
    // Opening prepares this cache; mounting the modal must not repeat that request.
    staleTime: DETAIL_POLLING_INTERVAL,
    retryOnMount: false,
    refetchInterval: query => {
      const { data, status } = query.state
      if (status !== 'error' && data && isExecutionFinished(data)) return false

      return DETAIL_POLLING_INTERVAL
    },
  })
