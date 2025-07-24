import { useWalletSelector } from '@near-wallet-selector/react-hook'
import * as nearAPI from 'near-api-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCrossChainTransactions, useNearTokens } from 'state/crossChainSwap'

const TTL = 30 // 30s
let lastUpdated = Date.now() / 1000
let cached: Record<string, string> = {}

// A flag to ensure we only have one in-flight request
let isBalanceFetchInProgress = false

// Add this for sleep/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Public RPCs to rotate (add more if needed)
const RPC_URLS = [
  'https://rpc.mainnet.near.org',
  'https://near.drpc.org',
  'https://near.lava.build',
  'https://nearinner.deltarpc.com',
]

// Helper to get next RPC URL
let rpcIndex = 0
const getNextRpcUrl = (): string => {
  const url = RPC_URLS[rpcIndex]
  rpcIndex = (rpcIndex + 1) % RPC_URLS.length
  return url
}

// Reusable custom view function with dynamic RPC
const customViewFunction = async (
  rpcUrl: string,
  contractId: string,
  method: string,
  args: Record<string, any>,
): Promise<string> => {
  const near = await nearAPI.connect({ networkId: 'mainnet', nodeUrl: rpcUrl })
  const account = await near.account('') // Empty account for view-only calls
  const result = await account.viewFunction({ contractId, methodName: method, args })

  return result
}

export const useNearBalances = () => {
  const { nearTokens } = useNearTokens()
  const [transactions] = useCrossChainTransactions()

  const tokenOnNears = useMemo(
    () =>
      nearTokens.filter(token => {
        return token.blockchain === 'near'
      }),
    [nearTokens],
  )

  const { signedAccountId, getBalance } = useWalletSelector()

  const [balances, setBalances] = useState<Record<string, string>>({})

  // Track completed transactions to avoid multiple refreshes
  const completedTxsRef = useRef<Set<string>>(new Set())

  const getBalances = useCallback(
    async (options: { nocache: boolean }) => {
      if (isBalanceFetchInProgress) return
      if (!signedAccountId || !tokenOnNears.length) {
        setBalances({})
        return
      }

      if (!options.nocache && Date.now() / 1000 < lastUpdated + TTL && Object.values(cached).length) {
        setBalances(cached)
        return
      }
      isBalanceFetchInProgress = true

      let nativeBalance: string
      try {
        nativeBalance = (await getBalance(signedAccountId)).toString()
      } catch (error) {
        nativeBalance = '0'
      }

      const res: string[] = []
      const maxRetries = 3
      const batchSize = 5 // Process 5 tokens at a time to avoid burst

      for (let i = 0; i < tokenOnNears.length; i += batchSize) {
        const batch = tokenOnNears.slice(i, i + batchSize)
        const batchPromises = batch.map(async token => {
          if (token.contractAddress === '') {
            return nativeBalance
          }

          let tokenBalance = '0'
          let localRetries = 0
          while (localRetries <= maxRetries) {
            try {
              // Rotate RPC per token call to distribute load
              const rpcUrl = getNextRpcUrl()
              tokenBalance = await customViewFunction(rpcUrl, token.contractAddress, 'ft_balance_of', {
                account_id: signedAccountId,
              })
              break
            } catch (error: any) {
              if (error.message?.includes('429') && localRetries < maxRetries) {
                // Exponential backoff on 429 (1s, 2s, 4s)
                await sleep(1000 * Math.pow(2, localRetries))
                localRetries++
              } else {
                console.error(`Error fetching ${token.contractAddress}:`, error)
                break
              }
            }
          }
          return tokenBalance
        })

        const batchResults = await Promise.all(batchPromises)
        res.push(...batchResults)

        // Delay between batches for throttling (~500ms)
        if (i + batchSize < tokenOnNears.length) {
          await sleep(500)
        }
      }

      const b = tokenOnNears.reduce((acc, token, index) => {
        return {
          ...acc,
          [token.assetId]: res[index] || '0',
        }
      }, {} as Record<string, string>)
      lastUpdated = Date.now() / 1000
      cached = b
      setBalances(b)
      isBalanceFetchInProgress = false
    },
    [signedAccountId, tokenOnNears, getBalance],
  )

  // Watch for completed cross-chain swap transactions and refresh balances
  useEffect(() => {
    if (!signedAccountId || !transactions.length) return

    const completedTxs = transactions.filter(tx => tx.status === 'Success')
    const newlyCompletedTxs = completedTxs.filter(tx => !completedTxsRef.current.has(tx.id))

    if (newlyCompletedTxs.length > 0) {
      // Check if any of the completed transactions involve NEAR tokens
      const nearRelatedTxs = newlyCompletedTxs.filter(tx => tx.targetChain === 'near' || tx.sourceChain === 'near')

      if (nearRelatedTxs.length > 0) {
        getBalances({ nocache: true })
      }

      // Mark these transactions as processed
      newlyCompletedTxs.forEach(tx => completedTxsRef.current.add(tx.id))
    }
  }, [transactions, signedAccountId, getBalances])

  useEffect(() => {
    getBalances({ nocache: false })

    const i = setInterval(() => {
      getBalances({ nocache: false })
    }, 30_000) // refresh every 30s

    return () => {
      clearInterval(i)
    }
  }, [getBalances])

  return {
    balances,
    getBalances,
  }
}
