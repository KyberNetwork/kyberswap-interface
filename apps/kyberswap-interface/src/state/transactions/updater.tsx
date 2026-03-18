import { BigNumber } from '@ethersproject/bignumber'
import { ChainId } from '@kyberswap/ks-sdk-core'
import SafeAppsSDK, { TransactionStatus as SafeTransactionStatus } from '@safe-global/safe-apps-sdk'
import { ethers } from 'ethers'
import { TxValidationError, findReplacementTx } from 'find-replacement-tx'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NotificationType } from 'components/Announcement/type'
import { CONNECTION } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES, TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useBlockNumber, useKyberSwapConfig, useTransactionNotify } from 'state/application/hooks'
import { AppDispatch, AppState } from 'state/index'
import { revokePermit } from 'state/swap/actions'
import {
  checkedTransaction,
  finalizeTransaction,
  modifyTransaction,
  removeTx,
  replaceTx,
} from 'state/transactions/actions'
import {
  SerializableTransactionReceipt,
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraInfo1Token,
} from 'state/transactions/type'
import { findTx } from 'utils'

const appsSdk = new SafeAppsSDK()

const toSafeReceipt = (hash: string, receipt: any) =>
  receipt
    ? {
        ...receipt,
        transactionHash: hash,
        blockHash: '',
        status: receipt.txStatus === SafeTransactionStatus.SUCCESS ? 1 : 0,
      }
    : undefined

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
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const { connector } = useWeb3React()
  const { readProvider } = useKyberSwapConfig(chainId)

  const lastBlockNumber = useBlockNumber()
  const dispatch = useDispatch<AppDispatch>()
  const transactionsState = useSelector<AppState, AppState['transactions'][ChainId]>(
    state => state.transactions[chainId],
  )

  const transactions = useMemo(() => transactionsState ?? {}, [transactionsState])

  const uniqueTransactions = useMemo(() => {
    return [
      ...new Set(
        Object.values(transactions)
          .map((txs: TransactionDetails[] | TransactionDetails | undefined) =>
            Array.isArray(txs) ? txs.map(tx => tx.hash) : txs?.hash,
          )
          .flat(2)
          .filter(Boolean) as [string],
      ),
    ]
  }, [transactions])

  const pendingTxHashes = useMemo(() => {
    return uniqueTransactions.filter(hash => {
      const tx = findTx(transactions, hash)
      return tx && !tx.receipt
    })
  }, [uniqueTransactions, transactions])

  // show popup on confirm

  const { trackingHandler } = useTracking()
  const transactionNotify = useTransactionNotify()

  // Use refs to stabilize handleTransactionReceipt so it doesn't recreate
  // on every block or transaction state change, which would tear down the fast-polling interval
  const networkInfoRef = useRef(networkInfo)
  networkInfoRef.current = networkInfo
  const lastBlockNumberRef = useRef(lastBlockNumber)
  lastBlockNumberRef.current = lastBlockNumber
  const transactionsRef = useRef(transactions)
  transactionsRef.current = transactions
  const accountRef = useRef(account)
  accountRef.current = account

  const handleTransactionReceipt = useCallback(
    (hash: string, receipt: any) => {
      const currentBlockNumber = lastBlockNumberRef.current
      if (!currentBlockNumber) return
      if (
        !receipt ||
        receipt?.txStatus === SafeTransactionStatus.AWAITING_EXECUTION ||
        receipt?.txStatus === SafeTransactionStatus.AWAITING_CONFIRMATIONS
      ) {
        dispatch(checkedTransaction({ chainId, hash, blockNumber: currentBlockNumber }))
        return
      }

      const transaction = findTx(transactionsRef.current, receipt.transactionHash)
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
        account: accountRef.current ?? '',
      })
      if (receipt.status === 1) {
        // Swapped (address sender, address srcToken, address dstToken, address dstReceiver, uint256 spentAmount, uint256 returnAmount)
        const swapEventTopic = ethers.utils.id('Swapped(address,address,address,address,uint256,uint256)')
        const swapLogs = receipt.logs.filter((log: any) => log.topics[0] === swapEventTopic)
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
            if (accountRef.current && arbitrary.isPermitSwap) {
              dispatch(revokePermit({ chainId, address: arbitrary.inputAddress, account: accountRef.current }))
            }
            trackingHandler(TRACKING_EVENT_TYPE.SWAP_COMPLETED, {
              arbitrary,
              actual_gas: receipt.gasUsed || BigNumber.from(0),
              gas_price: receipt.effectiveGasPrice || BigNumber.from(0),
              tx_hash: receipt.transactionHash,
              feeInfo: arbitrary.feeInfo,
            })
            break
          }
          case TRANSACTION_TYPE.APPROVE: {
            const extraInfo = transaction.extraInfo as TransactionExtraInfo1Token | undefined
            trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_COMPLETED, {
              token_symbol: extraInfo?.tokenSymbol,
              token_address: extraInfo?.tokenAddress,
              spender_address: extraInfo?.contract,
              tx_hash: receipt.transactionHash,
              chain: networkInfoRef.current?.name,
            })
            break
          }
          // case TRANSACTION_TYPE.ELASTIC_COLLECT_FEE: {
          //   if (arbitrary) {
          //     trackingHandler(TRACKING_EVENT_TYPE.ELASTIC_COLLECT_FEES_COMPLETED, arbitrary)
          //   }
          //   break
          // }
          case TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY: {
            if (arbitrary) {
              trackingHandler(TRACKING_EVENT_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED, {
                ...arbitrary,
                tx_hash: receipt.transactionHash,
              })
            }
            break
          }
          case TRANSACTION_TYPE.CANCEL_LIMIT_ORDER: {
            if (arbitrary) {
              trackingHandler(TRACKING_EVENT_TYPE.LO_CANCEL_ORDER_SUBMITTED, {
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
    },
    // Stable deps only — mutable values accessed via refs
    // eslint-disable-next-line
    [chainId, dispatch, trackingHandler, transactionNotify],
  )

  useEffect(() => {
    if (!readProvider || !lastBlockNumber) return

    uniqueTransactions
      .filter(hash => shouldCheck(lastBlockNumber, findTx(transactions, hash)))
      .forEach(hash => {
        let txHash = hash

        // Check if tx was replaced
        readProvider
          .getTransaction(hash)
          .then(res => {
            const transaction = findTx(transactions, hash)

            if (!transaction || !!res) return // !res this mean tx was drop (cancel/replace)

            const { sentAtBlock, from, to, nonce, data, addedTime } = transaction
            const checkRemoveTxs = async () => {
              // pending >1 days
              if (Date.now() - addedTime > 86_400_000) {
                dispatch(removeTx({ chainId, hash }))
                return
              }

              // Nonce-based detection: if the account's current nonce has moved past
              // this transaction's nonce, the tx is no longer valid (dropped, cancelled
              // by wallet, or rejected by sequencer e.g. Base pre-validation).
              if (from) {
                try {
                  const currentNonce = await readProvider.getTransactionCount(from, 'latest')
                  if (nonce !== undefined && currentNonce > nonce) {
                    dispatch(removeTx({ chainId, hash }))
                  }
                } catch {
                  // RPC failure — skip, will retry on next block
                }
              }
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
                    txHash = newTx.hash
                    dispatch(
                      replaceTx({
                        chainId,
                        oldHash: hash,
                        newHash: newTx.hash,
                      }),
                    )
                  }
                })
                .catch((error: unknown) => {
                  // Transaction was canceled (sent 0 ETH to self with empty data)
                  if (error instanceof TxValidationError && error.message === 'Transaction canceled.') {
                    dispatch(removeTx({ chainId, hash }))
                  } else {
                    checkRemoveTxs()
                  }
                })
            else {
              checkRemoveTxs()
            }
          })
          .catch(console.warn)

        if (connector?.id === CONNECTION.SAFE_CONNECTOR_ID) {
          appsSdk.txs
            .getBySafeTxHash(txHash)
            .then(receipt => {
              handleTransactionReceipt(txHash, toSafeReceipt(txHash, receipt))
            })
            .catch((error: any) => {
              console.error(`failed to check transaction hash: ${txHash}`, error)
            })
        } else {
          readProvider
            .getTransactionReceipt(txHash)
            .then(receipt => {
              handleTransactionReceipt(txHash, receipt)
            })
            .catch((error: any) => {
              console.error(`failed to check transaction hash: ${txHash}`, error)
            })
        }
      })

    // eslint-disable-next-line
  }, [chainId, readProvider, transactions, lastBlockNumber, dispatch])

  // Fast polling: poll every 2s only when there are pending transactions
  // This is independent of block-based polling and provides faster tx status detection
  const pendingTxHashesRef = useRef(pendingTxHashes)
  pendingTxHashesRef.current = pendingTxHashes
  const hasPendingTxs = pendingTxHashes.length > 0

  useEffect(() => {
    if (!readProvider || !hasPendingTxs) return

    const isSafe = connector?.id === CONNECTION.SAFE_CONNECTOR_ID

    const intervalId = setInterval(() => {
      pendingTxHashesRef.current.forEach(hash => {
        if (isSafe) {
          appsSdk.txs
            .getBySafeTxHash(hash)
            .then(receipt => {
              handleTransactionReceipt(hash, toSafeReceipt(hash, receipt))
            })
            .catch((error: any) => {
              console.warn(`fast-poll: failed to check safe tx: ${hash}`, error)
            })
        } else {
          readProvider
            .getTransactionReceipt(hash)
            .then(receipt => {
              if (receipt) handleTransactionReceipt(hash, receipt)
            })
            .catch((error: any) => {
              console.warn(`fast-poll: failed to check tx: ${hash}`, error)
            })
        }
      })
    }, 2_000)

    return () => clearInterval(intervalId)
    // eslint-disable-next-line
  }, [readProvider, hasPendingTxs, connector?.id, handleTransactionReceipt])

  return null
}
