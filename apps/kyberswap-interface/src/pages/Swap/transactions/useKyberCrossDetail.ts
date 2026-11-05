import { useQuery } from '@tanstack/react-query'
import type { Hash } from 'viem'

import { kyberCrossApi } from 'pages/Swap/crossChain/adapters/KyberCrossAdapter/api'
import { chainIdToKyberCrossChainName } from 'pages/Swap/crossChain/adapters/KyberCrossAdapter/types'
import type { HistoryTransaction } from 'pages/Swap/transactions/history'
import { isExecutionFinished } from 'pages/Swap/transactions/kyberCrossDetail'

const DETAIL_POLLING_INTERVAL = 5_000

export const useKyberCrossDetail = (tx: HistoryTransaction) =>
  useQuery({
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
    refetchOnMount: 'always',
    refetchInterval: query => {
      const { data, status } = query.state
      if (status !== 'error' && data && isExecutionFinished(data)) return false

      return DETAIL_POLLING_INTERVAL
    },
  })
