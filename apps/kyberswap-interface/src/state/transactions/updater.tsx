import { ChainId } from '@kyberswap/ks-sdk-core'
import SafeAppsSDK, { TransactionStatus as SafeTransactionStatus } from '@safe-global/safe-apps-sdk'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TransactionNotFoundError, TransactionReceiptNotFoundError } from 'viem'
import { usePublicClient } from 'wagmi'

import { NotificationType } from 'components/Announcement/type'
import { CONNECTION } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES, TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { AppDispatch, AppState } from 'state'
import { useBlockNumber, useTransactionNotify } from 'state/application/hooks'
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
import { Address, Hash, decodeEventLog, formatUnits, keccak256, parseAbi, toBytes } from 'utils/viem'

const appsSdk = new SafeAppsSDK()

// Viem-native replacement detector. Mirrors what `find-replacement-tx` used to do:
// scan blocks since `sentAtBlock` for a transaction from the same sender with the
// same nonce as the original; if a match is found whose hash differs from the
// original, that is the replacement tx. A self-transfer with empty data signifies a
// wallet-side cancellation. Returns `null` if no replacement is detected.
//
// Block scan is bounded to 256 blocks to avoid runaway RPC pressure on long-pending
// transactions; nonce-advancement detection in `checkRemoveTxs` covers the tail.
async function findReplacementViaViem(args: {
  publicClient: any
  originalHash: string
  from: string
  nonce: number
  sentAtBlock: number
}): Promise<{ hash: string } | 'cancelled' | null> {
  const { publicClient, originalHash, from, nonce, sentAtBlock } = args
  const fromLower = from.toLowerCase()
  try {
    const currentNonce = await publicClient.getTransactionCount({
      address: from as Address,
      blockTag: 'latest',
    })
    if (currentNonce <= nonce) return null

    const latestBlock = await publicClient.getBlockNumber()
    const startBlock = BigInt(Math.max(sentAtBlock, Number(latestBlock) - 256))

    for (let blockNumber = startBlock; blockNumber <= latestBlock; blockNumber++) {
      let block
      try {
        block = await publicClient.getBlock({ blockNumber, includeTransactions: true })
      } catch {
        continue
      }
      const match = block?.transactions?.find(
        (tx: any) => tx?.from?.toLowerCase?.() === fromLower && Number(tx?.nonce) === nonce,
      )
      if (!match) continue
      if (match.hash?.toLowerCase?.() === originalHash.toLowerCase()) return null
      const isSelfTransferEmpty =
        match.to && (match.to as string).toLowerCase() === fromLower && (!match.input || match.input === '0x')
      return isSelfTransferEmpty ? 'cancelled' : { hash: match.hash as string }
    }
    return null
  } catch {
    return null
  }
}

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
  const publicClient = usePublicClient({ chainId: chainId as number })

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
      // viem `getTransactionReceipt` returns `status: 'success' | 'reverted'`.
      // The Safe path (`toSafeReceipt`) already normalizes to numeric 0/1.
      // SerializableTransactionReceipt + downstream consumers (e.g.
      // `getTransactionStatus`) expect the ethers-style numeric form, so
      // normalize here as well.
      const numericStatus = receipt.status === 'success' || receipt.status === 1 ? 1 : 0
      dispatch(
        finalizeTransaction({
          chainId,
          hash: receipt.transactionHash,
          receipt: {
            blockHash: receipt.blockHash,
            status: numericStatus,
          },
          needCheckSubgraph: NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES.includes(transaction.type),
        }),
      )

      transactionNotify({
        hash: receipt.transactionHash,
        type: numericStatus === 1 ? NotificationType.SUCCESS : NotificationType.ERROR,
        account: accountRef.current ?? '',
      })
      if (numericStatus === 1) {
        // Swapped (address sender, address srcToken, address dstToken, address dstReceiver, uint256 spentAmount, uint256 returnAmount)
        const swapEventTopic = keccak256(toBytes('Swapped(address,address,address,address,uint256,uint256)'))
        const swapLogs = receipt.logs.filter((log: any) => log.topics[0] === swapEventTopic)
        // take the last swap event
        const lastSwapEvent = swapLogs.slice(-1)[0]

        if (lastSwapEvent) {
          const parsed = decodeEventLog({
            abi: parseAbi([
              'event Swapped(address sender, address srcToken, address dstToken, address dstReceiver, uint256 spentAmount, uint256 returnAmount)',
            ]),
            data: lastSwapEvent.data as `0x${string}`,
            topics: lastSwapEvent.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
          })

          if (
            (transaction.extraInfo as any)?.tokenAmountOut &&
            transaction.extraInfo?.arbitrary?.outputDecimals !== undefined
          ) {
            const extraInfo = { ...transaction.extraInfo }
            ;(extraInfo as any).tokenAmountOut = formatUnits(
              parsed.args.returnAmount,
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
              actual_gas: receipt.gasUsed || 0n,
              gas_price: receipt.effectiveGasPrice || 0n,
              tx_hash: receipt.transactionHash,
              feeInfo: arbitrary.feeInfo,
            })
            if (arbitrary.tipLink) {
              trackingHandler(TRACKING_EVENT_TYPE.TIP_LINK_TRADE, {
                trade_type: 'swap',
                trade_status: 'completed',
                tip_charged: true,
                ...arbitrary.tipLink,
                input_token: arbitrary.inputSymbol,
                output_token: arbitrary.outputSymbol,
                input_token_address: arbitrary.inputAddress,
                output_token_address: arbitrary.outputAddress,
                pair:
                  arbitrary.inputSymbol && arbitrary.outputSymbol
                    ? `${arbitrary.inputSymbol}/${arbitrary.outputSymbol}`
                    : undefined,
                chain: arbitrary.chain,
                volume: arbitrary.volume,
                tx_hash: receipt.transactionHash,
              })
            }
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
    if (!publicClient || !lastBlockNumber) return

    uniqueTransactions
      .filter(hash => shouldCheck(lastBlockNumber, findTx(transactions, hash)))
      .forEach(hash => {
        let txHash = hash

        // Check if tx was replaced. viem throws when the tx isn't yet seen; treat that as
        // "no result" so the replacement-detection path below kicks in (matches old ethers
        // behaviour where `getTransaction` returned `null`).
        publicClient
          .getTransaction({ hash: hash as Hash })
          .catch(error => {
            // viem throws when the tx/receipt isn't yet seen; treat that as null
            // (matches the old ethers contract). Re-throw genuine RPC errors so
            // the outer `.catch` logs them.
            if (error instanceof TransactionNotFoundError || error instanceof TransactionReceiptNotFoundError) {
              return null
            }
            throw error
          })
          .then(res => {
            const transaction = findTx(transactions, hash)

            if (!transaction || !!res) return // !res this mean tx was drop (cancel/replace)

            const { sentAtBlock, from, nonce, addedTime } = transaction
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
                  const currentNonce = await publicClient.getTransactionCount({
                    address: from as Address,
                    blockTag: 'latest',
                  })
                  if (nonce !== undefined && currentNonce > nonce) {
                    dispatch(removeTx({ chainId, hash }))
                  }
                } catch {
                  // RPC failure — skip, will retry on next block
                }
              }
            }

            if (sentAtBlock && from && nonce !== undefined) {
              findReplacementViaViem({
                publicClient,
                originalHash: hash,
                from,
                nonce,
                sentAtBlock,
              })
                .then(replacement => {
                  if (replacement === 'cancelled') {
                    dispatch(removeTx({ chainId, hash }))
                    return
                  }
                  if (replacement) {
                    txHash = replacement.hash
                    dispatch(
                      replaceTx({
                        chainId,
                        oldHash: hash,
                        newHash: replacement.hash,
                      }),
                    )
                    return
                  }
                  checkRemoveTxs()
                })
                .catch(checkRemoveTxs)
            } else {
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
          publicClient
            .getTransactionReceipt({ hash: txHash as Hash })
            .catch(error => {
              // viem throws when the tx/receipt isn't yet seen; treat that as null
              // (matches the old ethers contract). Re-throw genuine RPC errors so
              // the outer `.catch` logs them.
              if (error instanceof TransactionNotFoundError || error instanceof TransactionReceiptNotFoundError) {
                return null
              }
              throw error
            })
            .then(receipt => {
              handleTransactionReceipt(txHash, receipt)
            })
            .catch((error: any) => {
              console.error(`failed to check transaction hash: ${txHash}`, error)
            })
        }
      })

    // eslint-disable-next-line
  }, [chainId, publicClient, transactions, lastBlockNumber, dispatch])

  // Fast polling: poll every 2s only when there are pending transactions
  // This is independent of block-based polling and provides faster tx status detection
  const pendingTxHashesRef = useRef(pendingTxHashes)
  pendingTxHashesRef.current = pendingTxHashes
  const hasPendingTxs = pendingTxHashes.length > 0

  useEffect(() => {
    if (!publicClient || !hasPendingTxs) return

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
          publicClient
            .getTransactionReceipt({ hash: hash as Hash })
            .catch(error => {
              // viem throws when the tx/receipt isn't yet seen; treat that as null
              // (matches the old ethers contract). Re-throw genuine RPC errors so
              // the outer `.catch` logs them.
              if (error instanceof TransactionNotFoundError || error instanceof TransactionReceiptNotFoundError) {
                return null
              }
              throw error
            })
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
  }, [publicClient, hasPendingTxs, connector?.id, handleTransactionReceipt])

  return null
}
