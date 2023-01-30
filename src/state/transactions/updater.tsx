import { BigNumber } from '@ethersproject/bignumber'
import { ParsedTransactionWithMeta } from '@solana/web3.js'
import { findReplacementTx } from 'find-replacement-tx'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE, NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES } from 'hooks/useMixpanel'
import { NotificationType, useBlockNumber, useTransactionNotify } from 'state/application/hooks'
import { useSetClaimingCampaignRewardId } from 'state/campaigns/hooks'
import connection from 'state/connection/connection'
import { AppDispatch, AppState } from 'state/index'
import { findTx } from 'utils'

import { checkedTransaction, finalizeTransaction, removeTx, replaceTx } from './actions'
import { SerializableTransactionReceipt, TRANSACTION_TYPE, TransactionDetails } from './type'

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

  const { mixpanelHandler, subgraphMixpanelHandler } = useMixpanel()
  const transactionNotify = useTransactionNotify()
  const setClaimingCampaignRewardId = useSetClaimingCampaignRewardId()[1]

  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return
    const uniqueTransactions = [
      ...new Set(
        Object.values(transactions)
          .map((txs: TransactionDetails[] | TransactionDetails | undefined) =>
            Array.isArray(txs) ? txs.map(tx => tx.hash) : txs?.hash,
          )
          .flat(2)
          .filter(Boolean) as [string],
      ),
    ]

    uniqueTransactions
      .filter(hash => shouldCheck(lastBlockNumber, findTx(transactions, hash)))
      .forEach(hash => {
        if (isEVM) {
          // Check if tx was replaced
          library
            .getTransaction(hash)
            .then(res => {
              const transaction = findTx(transactions, hash)
              if (!transaction) return
              const { sentAtBlock, from, to, nonce, data } = transaction
              // this mean tx was drop
              if (res === null) {
                if (sentAtBlock && from && to && nonce && data)
                  findReplacementTx(library, sentAtBlock, {
                    from,
                    to,
                    nonce,
                    data,
                  })
                    .then(newTx => {
                      if (newTx) {
                        dispatch(
                          replaceTx({
                            chainId,
                            oldHash: hash,
                            newHash: newTx.hash,
                          }),
                        )
                      }
                    })
                    .catch(() => {
                      dispatch(removeTx({ chainId, hash }))
                    })
                else {
                  dispatch(removeTx({ chainId, hash }))
                }
              }
            })
            .catch(console.warn)
          library
            .getTransactionReceipt(hash)
            .then(receipt => {
              if (receipt) {
                const transaction = findTx(transactions, receipt.transactionHash)
                if (!transaction) return
                dispatch(
                  finalizeTransaction({
                    chainId,
                    hash: receipt.transactionHash,
                    receipt: {
                      blockHash: receipt.blockHash,
                      status: receipt.status,
                    },
                    needCheckSubgraph: NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES.includes(
                      transaction.type as TRANSACTION_TYPE,
                    ),
                  }),
                )

                transactionNotify({
                  hash: receipt.transactionHash,
                  notiType: receipt.status === 1 ? NotificationType.SUCCESS : NotificationType.ERROR,
                })
                if (receipt.status === 1 && transaction) {
                  const tracking = transaction.extraInfo?.tracking
                  switch (transaction.type) {
                    case TRANSACTION_TYPE.SWAP: {
                      if (tracking) {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                          tracking,
                          actual_gas: receipt.gasUsed || BigNumber.from(0),
                          gas_price: receipt.effectiveGasPrice || BigNumber.from(0),
                          tx_hash: receipt.transactionHash,
                        })
                      }
                      break
                    }
                    case TRANSACTION_TYPE.BRIDGE: {
                      if (tracking) {
                        mixpanelHandler(MIXPANEL_TYPE.BRIDGE_TRANSACTION_SUBMIT, {
                          ...tracking,
                          tx_hash: receipt.transactionHash,
                        })
                      }
                      break
                    }
                    case TRANSACTION_TYPE.ELASTIC_COLLECT_FEE: {
                      if (tracking) {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_COMPLETED, tracking)
                      }
                      break
                    }
                    case TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY: {
                      if (tracking) {
                        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED, {
                          ...tracking,
                          tx_hash: receipt.transactionHash,
                        })
                      }
                      break
                    }
                    case TRANSACTION_TYPE.CLAIM_REWARD: {
                      // claim campaign reward successfully
                      // reset id claiming when finished
                      if (window.location.pathname.startsWith(APP_PATHS.CAMPAIGN)) setClaimingCampaignRewardId(null)
                      break
                    }
                    case TRANSACTION_TYPE.CANCEL_LIMIT_ORDER: {
                      if (tracking) {
                        mixpanelHandler(MIXPANEL_TYPE.LO_CANCEL_ORDER_SUBMITTED, {
                          ...tracking,
                          tx_hash: receipt.transactionHash,
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
        if (isSolana) {
          connection
            .getParsedTransaction(hash, { maxSupportedTransactionVersion: 0 })
            .then((tx: ParsedTransactionWithMeta | null) => {
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
                })
                if (!tx.meta?.err && transaction) {
                  const tracking = transaction.extraInfo?.tracking
                  switch (transaction.type) {
                    case TRANSACTION_TYPE.SWAP: {
                      if (tracking) {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                          tracking,
                          gas_price: tx.meta?.fee,
                          tx_hash: hash,
                          actual_gas: BigNumber.from(tx.meta?.fee || 0),
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
  }, [chainId, library, transactions, lastBlockNumber, dispatch])

  return null
}
