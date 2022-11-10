import { Log } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { Fraction } from '@namgold/ks-sdk-core'
import { ParsedTransactionMeta, ParsedTransactionWithMeta } from '@solana/web3.js'
import { ethers } from 'ethers'
import { findReplacementTx } from 'find-replacement-tx'
import JSBI from 'jsbi'
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

const parseEVMTransactionSummary = ({
  tx,
  logs,
}: {
  tx: TransactionDetails | undefined
  logs?: Log[]
}): string | undefined => {
  let log = undefined
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
}

const parseSolanaTransactionSummary = ({
  tx,
  meta,
}: {
  tx: TransactionDetails | null
  meta?: ParsedTransactionMeta | null
}): string | undefined => {
  console.log({ meta })
  // Parse summary message for Swapped event
  if (!tx || !tx?.arbitrary) return tx?.summary

  const inputSymbol = tx?.arbitrary?.inputSymbol
  const outputSymbol = tx?.arbitrary?.outputSymbol
  const inputDecimals = tx?.arbitrary?.inputDecimals
  const outputDecimals = tx?.arbitrary?.outputDecimals

  if (!inputSymbol || !outputSymbol || !inputDecimals || !outputDecimals) return tx?.summary

  let inputAmount: string | undefined, outputAmount: string | undefined
  const preBalanceMap: { [mint: string]: Fraction } = {}
  meta?.preTokenBalances?.forEach(tokenBalance => {
    if (tokenBalance.mint && tokenBalance.owner === tx.from)
      preBalanceMap[tokenBalance.mint] = new Fraction(JSBI.BigInt(tokenBalance.uiTokenAmount.amount)).divide(
        JSBI.BigInt(10 ** tokenBalance.uiTokenAmount.decimals),
      )
  })
  meta?.postTokenBalances?.forEach(tokenBalance => {
    if (tokenBalance.mint && tokenBalance.owner === tx.from) {
      const preBalance = preBalanceMap[tokenBalance.mint]
      const postBalance = new Fraction(JSBI.BigInt(tokenBalance.uiTokenAmount.amount)).divide(
        JSBI.BigInt(10 ** tokenBalance.uiTokenAmount.decimals),
      )
      if (preBalance.lessThan(postBalance)) {
        outputAmount = postBalance.subtract(preBalance).toSignificant(9)
      } else if (preBalance.greaterThan(postBalance)) {
        inputAmount = preBalance.subtract(postBalance).toSignificant(9)
      }
    }
  })
  if (!inputAmount || !outputAmount) return tx?.summary

  return `${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
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
                    needCheckSubgraph: NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES.includes(transaction.type || ''),
                  }),
                )

                transactionNotify({
                  hash: receipt.transactionHash,
                  notiType: receipt.status === 1 ? NotificationType.SUCCESS : NotificationType.ERROR,
                  type: parseTransactionType(hash),
                  summary: parseEVMTransactionSummary({ tx: transaction, logs: receipt.logs }),
                })
                if (receipt.status === 1 && transaction) {
                  switch (transaction.type) {
                    case 'Swap': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                          arbitrary: transaction.arbitrary,
                          actual_gas: receipt.gasUsed || BigNumber.from(0),
                          gas_price: receipt.effectiveGasPrice || BigNumber.from(0),
                          tx_hash: receipt.transactionHash,
                        })
                      }
                      break
                    }
                    case 'Bridge': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.BRIDGE_TRANSACTION_SUBMIT, {
                          ...transaction.arbitrary,
                          tx_hash: receipt.transactionHash,
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
                          tx_hash: receipt.transactionHash,
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
                  type: parseTransactionType(hash),
                  summary: parseSolanaTransactionSummary({ tx: transaction, meta: tx.meta }),
                })
                if (!tx.meta?.err && transaction) {
                  switch (transaction.type) {
                    case 'Swap': {
                      if (transaction.arbitrary) {
                        mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                          arbitrary: transaction.arbitrary,
                          gas_price: tx.meta?.fee,
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
                dispatch(removeTx({ chainId, hash }))
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
  }, [chainId, library, transactions, lastBlockNumber, dispatch, parseEVMTransactionSummary, parseTransactionType])

  return null
}
