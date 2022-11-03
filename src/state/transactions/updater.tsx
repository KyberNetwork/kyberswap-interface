import { Log } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AGGREGATOR_ROUTER_SWAPPED_EVENT_TOPIC, APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE, NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES } from 'hooks/useMixpanel'
import { NotificationType, useBlockNumber, useTransactionNotify } from 'state/application/hooks'
import { useSetClaimingCampaignRewardId } from 'state/campaigns/hooks'
import connection from 'state/connection/connection'
import { AppDispatch, AppState } from 'state/index'
import { findTx } from 'utils'
import { getFullDisplayBalance } from 'utils/formatBalance'

import { checkedTransaction, finalizeTransaction } from './actions'
import { SerializableTransactionReceipt, TRANSACTION_TYPE } from './type'

function shouldCheck(
  lastBlockNumber: number,
  tx?: { addedTime: number; receipt?: SerializableTransactionReceipt; lastCheckedBlockNumber?: number },
): boolean {
  if (!tx) return false
  if (tx.receipt) return false
  if (!tx.lastCheckedBlockNumber) return true
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) return false
  const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60
  if (minutesPending > 60) {
    // every 10 blocks if pending for longer than an hour
    return blocksSinceCheck > 9
  } else if (minutesPending > 5) {
    // every 3 blocks if pending more than 5 minutes
    return blocksSinceCheck > 2
  } else {
    // otherwise every block
    return true
  }
}

export default function Updater(): null {
  const { chainId, isEVM, isSolana } = useActiveWeb3React()
  const { library } = useWeb3React()

  const lastBlockNumber = useBlockNumber()
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const transactions = useMemo(() => (chainId ? state[chainId] ?? {} : {}), [chainId, state])

  // show popup on confirm

  const parseTransactionType = useCallback(
    (hash: string): TRANSACTION_TYPE | undefined => {
      return findTx(transactions, hash)?.type
    },
    [transactions],
  )

  const parseTransactionSummary = useCallback(
    ({ hash, logs }: { hash: string; logs?: Log[] }): string | undefined => {
      let log = undefined
      const tx = findTx(transactions, hash)
      if (!logs) return tx?.summary

      for (let i = 0; i < logs.length; i++) {
        if (logs[i].topics.includes(AGGREGATOR_ROUTER_SWAPPED_EVENT_TOPIC)) {
          log = logs[i]
          break
        }
      }

      // No event log includes Swapped event topic
      if (!log) return tx?.summary

      // Parse summary message for Swapped event
      if (!tx || !tx?.arbitrary) return tx?.summary

      const inputSymbol = tx?.arbitrary?.inputSymbol
      const outputSymbol = tx?.arbitrary?.outputSymbol
      const inputDecimals = tx?.arbitrary?.inputDecimals
      const outputDecimals = tx?.arbitrary?.outputDecimals
      const withRecipient = tx?.arbitrary?.withRecipient

      if (!inputSymbol || !outputSymbol || !inputDecimals || !outputDecimals) {
        return tx?.summary
      }

      const decodedValues = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'address', 'address', 'uint256', 'uint256'],
        log.data,
      )

      const inputAmount = getFullDisplayBalance(BigNumber.from(decodedValues[4].toString()), inputDecimals, 3)
      const outputAmount = getFullDisplayBalance(BigNumber.from(decodedValues[5].toString()), outputDecimals, 3)

      const base = `${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`

      return `${base} ${withRecipient ?? ''}`
    },
    [transactions],
  )
  const { mixpanelHandler, subgraphMixpanelHandler } = useMixpanel()
  const transactionNotify = useTransactionNotify()
  const setClaimingCampaignRewardId = useSetClaimingCampaignRewardId()[1]

  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return
    const uniqueTransactions = [
      ...new Set(
        Object.values(transactions)
          .map(txs => txs?.map(tx => tx.hash))
          .flat(2)
          .filter(Boolean) as [string],
      ),
    ]

    uniqueTransactions
      .filter(hash => shouldCheck(lastBlockNumber, findTx(transactions, hash)))
      .forEach(hash => {
        if (isEVM) {
          library
            .getTransactionReceipt(hash)
            .then(receipt => {
              if (receipt) {
                const transaction = findTx(transactions, receipt.transactionHash)
                if (!transaction) return
                dispatch(
                  finalizeTransaction({
                    chainId,
                    hash,
                    receipt: {
                      blockHash: receipt.blockHash,
                      status: receipt.status,
                    },
                    needCheckSubgraph: NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES.includes(transaction.type || ''),
                  }),
                )

                transactionNotify({
                  hash,
                  notiType: receipt.status === 1 ? NotificationType.SUCCESS : NotificationType.ERROR,
                  type: parseTransactionType(hash),
                  summary: parseTransactionSummary({ hash, logs: receipt.logs }),
                })
                if (receipt.status === 1 && transaction) {
                  switch (transaction.type) {
                    case 'Swap': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                          arbitrary: transaction.arbitrary,
                          actual_gas: receipt.gasUsed || BigNumber.from(0),
                          gas_price: receipt.effectiveGasPrice || BigNumber.from(0),
                          tx_hash: hash,
                        })
                      }
                      break
                    }
                    case 'Bridge': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.BRIDGE_TRANSACTION_SUBMIT, {
                          ...transaction.arbitrary,
                          tx_hash: hash,
                        })
                      }
                      break
                    }
                    case 'Collect fee': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_COMPLETED, transaction.arbitrary)
                      }
                      break
                    }
                    case 'Increase liquidity': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED, {
                          ...transaction.arbitrary,
                          tx_hash: hash,
                        })
                      }
                      break
                    }
                    case 'Claim': {
                      // claim campaign reward successfully
                      // reset id claiming when finished
                      if (window.location.pathname.startsWith(APP_PATHS.CAMPAIGN)) setClaimingCampaignRewardId(null)
                      break
                    }
                    default:
                      break
                  }
                }
              } else {
                dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
              }
            })
            .catch((error: any) => {
              console.error(`failed to check transaction hash: ${hash}`, error)
            })
        }
        if (isSolana) {
          connection
            .getTransaction(hash)
            .then(tx => {
              if (tx) {
                const transaction = findTx(transactions, hash)
                if (!transaction) return
                dispatch(
                  finalizeTransaction({
                    chainId,
                    hash,
                    receipt: {
                      blockHash: tx.transaction.message.recentBlockhash,
                      status: tx.meta?.err ? 0 : 1,
                    },
                    needCheckSubgraph: false,
                  }),
                )

                transactionNotify({
                  hash,
                  notiType: tx.meta?.err ? NotificationType.ERROR : NotificationType.SUCCESS,
                  type: parseTransactionType(hash),
                  summary: parseTransactionSummary({ hash }),
                })
                if (!tx.meta?.err && transaction) {
                  switch (transaction.type) {
                    case 'Swap': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                          arbitrary: transaction.arbitrary,
                          tx_hash: hash,
                        })
                      }
                      break
                    }
                    default:
                      break
                  }
                }
              } else {
                dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
              }
            })
            .catch((error: any) => {
              console.error(`failed to check transaction hash: ${hash}`, error)
            })
        }
      })
    uniqueTransactions
      .filter(hash => findTx(transactions, hash)?.needCheckSubgraph)
      .forEach(async (hash: string) => {
        const transaction = findTx(transactions, hash)
        try {
          transaction && subgraphMixpanelHandler(transaction)
        } catch (error) {
          console.log(error)
        }
      })

    // eslint-disable-next-line
  }, [chainId, library, transactions, lastBlockNumber, dispatch, parseTransactionSummary, parseTransactionType])

  return null
}
