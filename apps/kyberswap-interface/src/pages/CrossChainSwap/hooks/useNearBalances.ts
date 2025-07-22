import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCrossChainTransactions, useNearTokens } from 'state/crossChainSwap'

const TTL = 30 // 30s
let lastUpdated = Date.now() / 1000
let cached: Record<string, string> = {}

// A flag to ensure we only have one in-flight request
let isBalanceFetchInProgress = false

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

  const { signedAccountId, viewFunction, getBalance } = useWalletSelector()

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

      const nativeBalance = await getBalance(signedAccountId)
      const res: string[] = await Promise.all(
        tokenOnNears.map(async token => {
          if (token.contractAddress === '') {
            return nativeBalance.toString()
          }
          const tokenBalance = await viewFunction({
            contractId: token.contractAddress,
            method: 'ft_balance_of',
            args: { account_id: signedAccountId },
          }).catch(() => '0')
          return tokenBalance as string
        }),
      )
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
    [signedAccountId, viewFunction, tokenOnNears, getBalance],
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
    }, 10_000) // refresh every 10s
    return () => {
      clearInterval(i)
    }
  }, [getBalances])

  return {
    balances,
    getBalances,
  }
}
