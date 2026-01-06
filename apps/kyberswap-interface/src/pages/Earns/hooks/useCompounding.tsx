import {
  ChainId as CompoundingChainId,
  PoolType as CompoundingPoolType,
  CompoundingWidget,
  SupportedLocale,
  TxStatus,
} from '@kyberswap/compounding-widget'
import '@kyberswap/compounding-widget/dist/style.css'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

interface CompoundingPureParams {
  poolAddress: string
  positionId: string
  poolType: CompoundingPoolType
  chainId: CompoundingChainId
  initDepositTokens: string
  initAmounts: string
  compoundType?: 'COMPOUND_TYPE_REWARD'
  dexId: Exchange
}

interface CompoundingParams extends CompoundingPureParams {
  rpcUrl?: string
  locale?: SupportedLocale
  connectedAccount: {
    address?: string | undefined
    chainId: number
  }
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>
  onViewPosition?: (txHash: string) => void
}

export interface CompoundingInfo {
  pool: {
    chainId: number
    address: string
    dex: Exchange
  }
  positionId: string
  initDepositTokens: string
  initAmounts: string
  compoundType?: 'COMPOUND_TYPE_REWARD'
}

const compoundingDexMapping: Record<Exchange, CompoundingPoolType> = {
  [Exchange.DEX_UNISWAPV3]: CompoundingPoolType.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: CompoundingPoolType.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: CompoundingPoolType.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: CompoundingPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: CompoundingPoolType.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: CompoundingPoolType.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: CompoundingPoolType.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: CompoundingPoolType.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: CompoundingPoolType.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: CompoundingPoolType.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: CompoundingPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: CompoundingPoolType.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL_LO]: CompoundingPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_BREVIS]: CompoundingPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_ALPHA]: CompoundingPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_DYNAMIC]: CompoundingPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_AERODROMECL]: CompoundingPoolType.DEX_AERODROMECL,
}

const useCompounding = ({
  onRefreshPosition,
  onCloseClaimModal,
}: {
  onRefreshPosition?: () => void
  onCloseClaimModal: () => void
}) => {
  const locale = useActiveLocale()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [compoundingPureParams, setCompoundingPureParams] = useState<CompoundingPureParams | null>(null)
  const [compoundingTxHash, setCompoundingTxHash] = useState<string[]>([])
  // Track original hash -> current hash mapping for replacements
  const [originalToCurrentHash, setOriginalToCurrentHash] = useState<Record<string, string>>({})
  const prevAllTransactionsRef = useRef<typeof allTransactions>()
  const { rpc: compoundingRpcUrl } = useKyberSwapConfig(compoundingPureParams?.chainId as ChainId | undefined)

  // Handle transaction replacement (speed up, cancel)
  useEffect(() => {
    if (!allTransactions || compoundingTxHash.length === 0) {
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
    const needsUpdate = compoundingTxHash.some(hash => !currentTxKeys.has(hash))

    if (!needsUpdate) {
      // No replacement detected, just update ref for next comparison
      prevAllTransactionsRef.current = allTransactions
      return
    }

    // Find new keys that weren't in previous state
    const newKeys = [...currentTxKeys].filter(key => !prevTxKeys.has(key))

    const updatedHashes = compoundingTxHash.map(trackedHash => {
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

      // Not replaced, keep the old hash
      return trackedHash
    })

    const hasChange = updatedHashes.some((hash, index) => hash !== compoundingTxHash[index])

    if (hasChange) {
      setCompoundingTxHash(updatedHashes)

      // Update original->current hash mapping for widget compatibility
      const newMapping: Record<string, string> = { ...originalToCurrentHash }
      compoundingTxHash.forEach((originalHash, index) => {
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
  }, [allTransactions, compoundingTxHash, originalToCurrentHash])

  const compoundingStatus = useMemo(() => {
    if (!allTransactions || !compoundingTxHash.length) return {}

    const status = compoundingTxHash.reduce((acc: Record<string, TxStatus>, txHash) => {
      const zapTx = allTransactions[txHash]
      if (zapTx?.[0].receipt) {
        acc[txHash] = zapTx?.[0].receipt.status === 1 ? TxStatus.SUCCESS : TxStatus.FAILED
      } else acc[txHash] = TxStatus.PENDING
      return acc
    }, {})

    // Also include original hashes pointing to their replacement's status
    // This allows the widget to look up status by the original hash it received
    Object.entries(originalToCurrentHash).forEach(([originalHash, currentHash]) => {
      if (status[currentHash] !== undefined && originalHash !== currentHash) {
        status[originalHash] = status[currentHash]
      }
    })

    return status
  }, [allTransactions, compoundingTxHash, originalToCurrentHash])

  const handleCloseCompounding = useCallback(() => {
    setCompoundingPureParams(null)
    setCompoundingTxHash([])
    setOriginalToCurrentHash({})
  }, [])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, poolType: CompoundingPoolType, poolId: string, tokenId: number) => {
      if (!library) return

      const dexIndex = Object.values(compoundingDexMapping).findIndex(
        (item, index) => item === poolType && EARN_DEXES[Object.keys(compoundingDexMapping)[index] as Exchange],
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(compoundingDexMapping)[dexIndex]

      navigateToPositionAfterZap(library, txHash, chainId, dex, poolId, navigate, tokenId)
    },
    [library, navigate],
  )

  const handleOpenCompounding = useCallback(
    ({ pool, positionId, initDepositTokens, initAmounts, compoundType }: CompoundingInfo) => {
      const dex = compoundingDexMapping[pool.dex]
      if (!dex) {
        notify(
          {
            title: `Protocol ${pool.dex} is not supported!`,
            type: NotificationType.ERROR,
          },
          5_000,
        )
        return
      }
      setCompoundingPureParams({
        poolAddress: pool.address,
        chainId: pool.chainId as CompoundingChainId,
        poolType: dex,
        positionId,
        initDepositTokens,
        initAmounts,
        compoundType,
        dexId: pool.dex,
      })
    },
    [notify],
  )

  const compoundingParams: CompoundingParams | null = useMemo(
    () =>
      compoundingPureParams
        ? {
            ...compoundingPureParams,
            rpcUrl: compoundingRpcUrl,
            locale,
            connectedAccount: {
              address: account,
              chainId: chainId,
            },
            onConnectWallet: toggleWalletModal,
            zapStatus: compoundingStatus,
            txHashMapping: originalToCurrentHash,
            onSwitchChain: () => changeNetwork(compoundingPureParams.chainId as number),
            onViewPosition: (txHash: string) => {
              const { chainId, poolType, poolAddress, positionId } = compoundingPureParams
              handleCloseCompounding()
              handleNavigateToPosition(txHash, chainId, poolType, poolAddress, Number(positionId))
              onCloseClaimModal()
            },
            onClose: () => {
              handleCloseCompounding()
              onRefreshPosition?.()
            },
            onSubmitTx: async (
              txData: { from: string; to: string; data: string; value: string; gasLimit: string },
              additionalInfo?: {
                tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>
                pool: string
                dexLogo: string
              },
            ) => {
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res
              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

              if (additionalInfo) {
                const dexIndex = Object.values(compoundingDexMapping).findIndex(
                  (item, index) =>
                    item === compoundingPureParams.poolType &&
                    EARN_DEXES[Object.keys(compoundingDexMapping)[index] as Exchange],
                )
                if (dexIndex === -1) {
                  console.error('Cannot find dex')
                } else {
                  const dex = Object.keys(compoundingDexMapping)[dexIndex] as Exchange

                  addTransactionWithType({
                    hash: txHash,
                    type:
                      compoundingPureParams.compoundType === 'COMPOUND_TYPE_REWARD'
                        ? TRANSACTION_TYPE.EARN_COMPOUND_REWARD
                        : TRANSACTION_TYPE.EARN_COMPOUND_FEE,
                    extraInfo: {
                      pool: additionalInfo?.pool || '',
                      positionId: compoundingPureParams.positionId || '',
                      tokensIn: additionalInfo?.tokensIn || [],
                      dexLogoUrl: additionalInfo?.dexLogo,
                      dex,
                    },
                  })
                }
              }

              setCompoundingTxHash(prev => [...prev, txHash])
              // Initialize mapping: original hash points to itself (no replacement yet)
              setOriginalToCurrentHash(prev => ({ ...prev, [txHash]: txHash }))
              return txHash
            },
          }
        : null,
    [
      account,
      chainId,
      changeNetwork,
      compoundingPureParams,
      compoundingRpcUrl,
      handleCloseCompounding,
      handleNavigateToPosition,
      locale,
      library,
      onRefreshPosition,
      toggleWalletModal,
      onCloseClaimModal,
      addTransactionWithType,
      compoundingStatus,
      originalToCurrentHash,
    ],
  )

  useAccountChanged(handleCloseCompounding)

  const widget = compoundingParams ? (
    <Modal isOpen mobileFullWidth maxWidth={768} width={'768px'} onDismiss={handleCloseCompounding}>
      <CompoundingWidget {...compoundingParams} />
    </Modal>
  ) : null

  return { widget, handleOpenCompounding }
}

export default useCompounding
