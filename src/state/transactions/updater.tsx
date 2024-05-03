import { BigNumber } from '@ethersproject/bignumber'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { findReplacementTx } from 'find-replacement-tx'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE, NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES } from 'hooks/useMixpanel'
import { useBlockNumber, useKyberSwapConfig, useTransactionNotify } from 'state/application/hooks'
import { AppDispatch, AppState } from 'state/index'
import { revokePermit } from 'state/user/actions'
import { findTx } from 'utils'

import { checkedTransaction, finalizeTransaction, modifyTransaction, removeTx, replaceTx } from './actions'
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
  const { chainId, account } = useActiveWeb3React()
  const { readProvider } = useKyberSwapConfig(chainId)

  const lastBlockNumber = useBlockNumber()
  const dispatch = useDispatch<AppDispatch>()
  const transactionsState = useSelector<AppState, AppState['transactions'][ChainId]>(
    state => state.transactions[chainId],
  )

  const transactions = useMemo(() => transactionsState ?? {}, [transactionsState])

  // show popup on confirm

  const { mixpanelHandler, subgraphMixpanelHandler } = useMixpanel()
  const transactionNotify = useTransactionNotify()

  useEffect(() => {
    if (!readProvider || !lastBlockNumber) return
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
        // Check if tx was replaced
        readProvider
          .getTransaction(hash)
          .then(res => {
            const transaction = findTx(transactions, hash)

            if (!transaction || !!res) return // !res this mean tx was drop (cancel/replace)

            const { sentAtBlock, from, to, nonce, data, addedTime } = transaction
            const checkRemoveTxs = () => {
              // pending >1 days
              if (Date.now() - addedTime > 86_400_000) dispatch(removeTx({ chainId, hash }))
            }

            if (sentAtBlock && from && to && nonce && data)
              findReplacementTx(readProvider, sentAtBlock, {
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
                  checkRemoveTxs()
                })
            else {
              checkRemoveTxs()
            }
          })
          .catch(console.warn)
        readProvider
          .getTransactionReceipt(hash)
          .then(receipt => {
            if (!receipt) {
              dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
              return
            }

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
                needCheckSubgraph: NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES.includes(transaction.type),
              }),
            )

            transactionNotify({
              hash: receipt.transactionHash,
              type: receipt.status === 1 ? NotificationType.SUCCESS : NotificationType.ERROR,
              account: account ?? '',
            })
            if (receipt.status === 1) {
              // Swapped (address sender, address srcToken, address dstToken, address dstReceiver, uint256 spentAmount, uint256 returnAmount)
              const swapEventTopic = ethers.utils.id('Swapped(address,address,address,address,uint256,uint256)')
              const swapLogs = receipt.logs.filter(log => log.topics[0] === swapEventTopic)
              // take the last swap event
              const lastSwapEvent = swapLogs.slice(-1)[0]

              // decode the data
              const swapInterface = new ethers.utils.Interface([
                'event Swapped (address sender, address srcToken, address dstToken, address dstReceiver, uint256 spentAmount, uint256 returnAmount)',
              ])
              const parsed = swapInterface.parseLog(lastSwapEvent)

              if (
                (transaction.extraInfo as any)?.tokenAmountOut &&
                transaction.extraInfo?.arbitrary?.outputDecimals !== undefined
              ) {
                const extraInfo = { ...transaction.extraInfo }
                ;(extraInfo as any).tokenAmountOut = ethers.utils.formatUnits(
                  parsed.args.returnAmount.toString(),
                  transaction.extraInfo?.arbitrary?.outputDecimals,
                )
                dispatch(
                  modifyTransaction({
                    chainId: transaction.chainId,
                    hash: transaction.hash,
                    extraInfo,
                  }),
                )
              }

              const arbitrary = transaction.extraInfo?.arbitrary
              switch (transaction.type) {
                case TRANSACTION_TYPE.SWAP: {
                  if (!arbitrary) return
                  if (account && arbitrary.isPermitSwap) {
                    dispatch(revokePermit({ chainId, address: arbitrary.inputAddress, account }))
                  }
                  mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                    arbitrary,
                    actual_gas: receipt.gasUsed || BigNumber.from(0),
                    gas_price: receipt.effectiveGasPrice || BigNumber.from(0),
                    tx_hash: receipt.transactionHash,
                    feeInfo: arbitrary.feeInfo,
                  })
                  break
                }
                case TRANSACTION_TYPE.BRIDGE: {
                  if (arbitrary) {
                    mixpanelHandler(MIXPANEL_TYPE.BRIDGE_TRANSACTION_SUBMIT, {
                      ...arbitrary,
                      tx_hash: receipt.transactionHash,
                    })
                  }
                  break
                }
                case TRANSACTION_TYPE.ELASTIC_COLLECT_FEE: {
                  if (arbitrary) {
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_COMPLETED, arbitrary)
                  }
                  break
                }
                case TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY: {
                  if (arbitrary) {
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED, {
                      ...arbitrary,
                      tx_hash: receipt.transactionHash,
                    })
                  }
                  break
                }
                case TRANSACTION_TYPE.CANCEL_LIMIT_ORDER: {
                  if (arbitrary) {
                    mixpanelHandler(MIXPANEL_TYPE.LO_CANCEL_ORDER_SUBMITTED, {
                      ...arbitrary,
                      tx_hash: receipt.transactionHash,
                    })
                  }
                  break
                }
                default:
                  break
              }
            }
          })
          .catch((error: any) => {
            console.error(`failed to check transaction hash: ${hash}`, error)
          })
      })
    uniqueTransactions
      .filter(hash => findTx(transactions, hash)?.extraInfo?.needCheckSubgraph)
      .forEach(async (hash: string) => {
        const transaction = findTx(transactions, hash)
        try {
          transaction && subgraphMixpanelHandler(transaction)
        } catch (error) {
          console.log(error)
        }
      })

    // eslint-disable-next-line
  }, [chainId, readProvider, transactions, lastBlockNumber, dispatch])

  return null
}
