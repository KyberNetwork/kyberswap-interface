import { TxStatus } from '@kyber/schema'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAllTransactions } from 'state/transactions/hooks'

/**
 * Hook to track transaction replacements (speed up, cancel) and compute transaction statuses.
 * When a user speeds up or cancels a transaction, the original hash is replaced with a new one.
 * This hook detects such replacements and maintains a mapping from original to current hash.
 */
export default function useTransactionReplacement() {
  const allTransactions = useAllTransactions()

  const [trackedTxHash, setTrackedTxHash] = useState<string[]>([])
  const [originalToCurrentHash, setOriginalToCurrentHash] = useState<Record<string, string>>({})
  const [cancelledTxHashes, setCancelledTxHashes] = useState<Set<string>>(new Set())
  const prevAllTransactionsRef = useRef<typeof allTransactions>()

  // Handle transaction replacement (speed up, cancel)
  useEffect(() => {
    if (!allTransactions || trackedTxHash.length === 0) {
      prevAllTransactionsRef.current = allTransactions
      return
    }

    // Skip if allTransactions hasn't actually changed (same reference)
    if (prevAllTransactionsRef.current === allTransactions) {
      return
    }

    const prevTxs = prevAllTransactionsRef.current
    if (!prevTxs) {
      prevAllTransactionsRef.current = allTransactions
      return
    }

    const prevTxKeys = new Set(Object.keys(prevTxs))
    const currentTxKeys = new Set(Object.keys(allTransactions))

    // Check if any tracked hash is missing (potentially replaced)
    const needsUpdate = trackedTxHash.some(hash => !currentTxKeys.has(hash))

    if (!needsUpdate) {
      // No replacement detected, just update ref for next comparison
      prevAllTransactionsRef.current = allTransactions
      return
    }

    // Find new keys that weren't in previous state
    const newKeys = [...currentTxKeys].filter(key => !prevTxKeys.has(key))

    const newCancelledHashes = new Set(cancelledTxHashes)
    const updatedHashes = trackedTxHash.map(trackedHash => {
      // If still exists, no change
      if (currentTxKeys.has(trackedHash)) {
        return trackedHash
      }

      // Hash disappeared from keys, check if it was replaced
      // Check each new key to see if it's related to our tracked hash
      for (const newKey of newKeys) {
        const txGroup = allTransactions[newKey]
        const oldTxGroup = prevTxs[trackedHash]

        if (!txGroup || !oldTxGroup) continue

        // Compare transaction metadata to identify if this is the same tx
        // (same nonce, from, to, data means same transaction)
        const newTx = txGroup[0]
        const oldTx = oldTxGroup[0]

        if (
          newTx &&
          oldTx &&
          newTx.from === oldTx.from &&
          newTx.to === oldTx.to &&
          newTx.nonce === oldTx.nonce &&
          newTx.data === oldTx.data
        ) {
          return newKey
        }
      }

      // Hash disappeared and no replacement found - transaction was cancelled
      if (prevTxKeys.has(trackedHash) && !currentTxKeys.has(trackedHash)) {
        newCancelledHashes.add(trackedHash)
      }

      // Not replaced, keep the old hash
      return trackedHash
    })

    // Update cancelled hashes if changed
    if (newCancelledHashes.size !== cancelledTxHashes.size) {
      setCancelledTxHashes(newCancelledHashes)
    }

    const hasChange = updatedHashes.some((hash, index) => hash !== trackedTxHash[index])

    if (hasChange) {
      setTrackedTxHash(updatedHashes)

      // Update original->current hash mapping for widget compatibility
      const newMapping: Record<string, string> = { ...originalToCurrentHash }
      trackedTxHash.forEach((originalHash, index) => {
        const currentHash = updatedHashes[index]
        if (originalHash !== currentHash) {
          // Find the original hash that this chain started from
          const rootOriginal = Object.entries(newMapping).find(([, v]) => v === originalHash)?.[0] || originalHash
          newMapping[rootOriginal] = currentHash
        }
      })
      setOriginalToCurrentHash(newMapping)
    }

    // Update ref AFTER all logic to avoid desync
    prevAllTransactionsRef.current = allTransactions
  }, [allTransactions, trackedTxHash, originalToCurrentHash, cancelledTxHashes])

  // Compute transaction statuses
  const txStatus = useMemo(() => {
    if (!allTransactions || !trackedTxHash.length) return {}

    const status = trackedTxHash.reduce((acc: Record<string, TxStatus>, txHash) => {
      // Check if tx was cancelled first
      if (cancelledTxHashes.has(txHash)) {
        acc[txHash] = TxStatus.CANCELLED
        return acc
      }

      const tx = allTransactions[txHash]
      if (tx?.[0].receipt) {
        acc[txHash] = tx?.[0].receipt.status === 1 ? TxStatus.SUCCESS : TxStatus.FAILED
      } else acc[txHash] = TxStatus.PENDING
      return acc
    }, {})

    // Also include original hashes pointing to their replacement's status
    // This allows the widget to look up status by the original hash it received
    Object.entries(originalToCurrentHash).forEach(([originalHash, currentHash]) => {
      // Check if the current hash was cancelled
      if (cancelledTxHashes.has(currentHash)) {
        status[originalHash] = TxStatus.CANCELLED
      } else if (status[currentHash] !== undefined && originalHash !== currentHash) {
        status[originalHash] = status[currentHash]
      }
    })

    return status
  }, [allTransactions, trackedTxHash, originalToCurrentHash, cancelledTxHashes])

  // Add a transaction hash to tracking
  const addTrackedTxHash = useCallback((txHash: string) => {
    setTrackedTxHash(prev => [...prev, txHash])
    // Initialize mapping: original hash points to itself (no replacement yet)
    setOriginalToCurrentHash(prev => ({ ...prev, [txHash]: txHash }))
  }, [])

  // Clear all tracking state
  const clearTracking = useCallback(() => {
    setTrackedTxHash([])
    setOriginalToCurrentHash({})
    setCancelledTxHashes(new Set())
  }, [])

  return {
    trackedTxHash,
    originalToCurrentHash,
    txStatus,
    addTrackedTxHash,
    clearTracking,
  }
}
