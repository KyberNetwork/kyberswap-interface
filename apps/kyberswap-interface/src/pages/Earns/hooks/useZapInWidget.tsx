import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  OnSuccessProps,
  SupportedLocale,
  TxStatus,
  LiquidityWidget as ZapIn,
  ChainId as ZapInChainId,
  PoolType as ZapInPoolType,
} from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ZAPIN_DEX_MAPPING, getDexFromPoolType } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { DEFAULT_PARSED_POSITION } from 'pages/Earns/types'
import { getNftManagerContractAddress, getTokenId, submitTransaction } from 'pages/Earns/utils'
import { getDexVersion } from 'pages/Earns/utils/position'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getCookieValue } from 'utils'

interface AddLiquidityPureParams {
  poolAddress: string
  chainId: ZapInChainId
  poolType: ZapInPoolType
  dexId: Exchange
  positionId?: string
  initialTick?: { tickUpper: number; tickLower: number }
}

interface AddLiquidityParams extends AddLiquidityPureParams {
  source: string
  rpcUrl?: string
  connectedAccount: {
    address?: string | undefined
    chainId: number
  }
  locale?: SupportedLocale
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onOpenZapMigration?: (position: { exchange: string; poolId: string; positionId: string | number }) => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>
}

export interface ZapInInfo {
  pool: {
    chainId: number
    address: string
    dex: Exchange
  }
  positionId?: string
  initialTick?: { tickUpper: number; tickLower: number }
}

const useZapInWidget = ({
  onOpenZapMigration,
  onRefreshPosition,
  triggerClose,
  setTriggerClose,
}: {
  onOpenZapMigration: (props: ZapMigrationInfo) => void
  onRefreshPosition?: () => void
  triggerClose?: boolean
  setTriggerClose?: (value: boolean) => void
}) => {
  const locale = useActiveLocale()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()

  const [addLiquidityPureParams, setAddLiquidityPureParams] = useState<AddLiquidityPureParams | null>(null)
  const [zapTxHash, setZapTxHash] = useState<string[]>([])
  // Track original hash -> current hash mapping for replacements
  const [originalToCurrentHash, setOriginalToCurrentHash] = useState<Record<string, string>>({})
  const prevAllTransactionsRef = useRef<typeof allTransactions>()
  const { rpc: zapInRpcUrl } = useKyberSwapConfig(addLiquidityPureParams?.chainId as ChainId | undefined)

  // Handle transaction replacement (speed up, cancel)
  useEffect(() => {
    if (!allTransactions || zapTxHash.length === 0) {
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
    const needsUpdate = zapTxHash.some(hash => !currentTxKeys.has(hash))

    if (!needsUpdate) {
      // No replacement detected, just update ref for next comparison
      prevAllTransactionsRef.current = allTransactions
      return
    }

    // Find new keys that weren't in previous state
    const newKeys = [...currentTxKeys].filter(key => !prevTxKeys.has(key))

    const updatedHashes = zapTxHash.map(trackedHash => {
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

    const hasChange = updatedHashes.some((hash, index) => hash !== zapTxHash[index])

    if (hasChange) {
      setZapTxHash(updatedHashes)

      // Update original->current hash mapping for widget compatibility
      const newMapping: Record<string, string> = { ...originalToCurrentHash }
      zapTxHash.forEach((originalHash, index) => {
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
  }, [allTransactions, zapTxHash, originalToCurrentHash])

  const zapStatus = useMemo(() => {
    if (!allTransactions || !zapTxHash.length) return {}

    const status = zapTxHash.reduce((acc: Record<string, TxStatus>, txHash) => {
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
  }, [allTransactions, zapTxHash, originalToCurrentHash])

  const handleCloseZapInWidget = useCallback(() => {
    searchParams.delete('exchange')
    searchParams.delete('poolChainId')
    searchParams.delete('poolAddress')
    setSearchParams(searchParams)
    setAddLiquidityPureParams(null)
    setZapTxHash([])
    setOriginalToCurrentHash({})
  }, [searchParams, setSearchParams])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, dex: Exchange, poolId: string) => {
      if (!library) return

      navigateToPositionAfterZap(library, txHash, chainId, dex, poolId, navigate)
    },
    [library, navigate],
  )

  const handleOpenZapIn = ({ pool, positionId, initialTick }: ZapInInfo) => {
    const dex = ZAPIN_DEX_MAPPING[pool.dex]
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
    setAddLiquidityPureParams({
      poolAddress: pool.address,
      chainId: pool.chainId as ZapInChainId,
      poolType: dex,
      positionId,
      initialTick,
      dexId: pool.dex,
    })
  }

  const handleOpenZapMigration = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
      initialSlippage?: number,
    ) => {
      if (!addLiquidityPureParams) return

      const dex = getDexFromPoolType(addLiquidityPureParams.poolType)
      if (!dex) return
      onOpenZapMigration({
        from: {
          poolType: position.exchange as Exchange,
          poolAddress: position.poolId,
          positionId: position.positionId.toString(),
          dexId: position.exchange as Exchange,
        },
        to: {
          poolAddress: addLiquidityPureParams.poolAddress,
          positionId: addLiquidityPureParams.positionId,
          poolType: dex,
          dexId: addLiquidityPureParams.dexId,
        },
        chainId: addLiquidityPureParams.chainId,
        initialTick,
        initialSlippage,
      })
    },
    [addLiquidityPureParams, onOpenZapMigration],
  )

  const addLiquidityParams: AddLiquidityParams | null = useMemo(
    () =>
      addLiquidityPureParams
        ? {
            ...addLiquidityPureParams,
            source: 'kyberswap-earn',
            rpcUrl: zapInRpcUrl,
            signTypedData: library
              ? (account: string, typedDataJson: string) =>
                  library.send('eth_signTypedData_v4', [account.toLowerCase(), typedDataJson])
              : undefined,
            referral: refCode,
            zapStatus,
            txHashMapping: originalToCurrentHash,
            locale,
            onViewPosition: (txHash: string) => {
              const { chainId, dexId, poolAddress } = addLiquidityPureParams
              handleCloseZapInWidget()
              handleNavigateToPosition(txHash, chainId, dexId, poolAddress)
            },
            connectedAccount: {
              address: account,
              chainId: chainId,
            },
            onClose: () => {
              handleCloseZapInWidget()
              onRefreshPosition?.()
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(addLiquidityPureParams.chainId as number),
            onOpenZapMigration: handleOpenZapMigration,
            onSuccess: async (data: OnSuccessProps) => {
              if (!library) return

              const dex = getDexFromPoolType(data.position.poolType)
              if (!dex) return

              const isUniv2 = EARN_DEXES[dex as Exchange]?.isForkFrom === CoreProtocol.UniswapV2

              const nftId =
                data.position.positionId ||
                (isUniv2 ? account || '' : ((await getTokenId(library, data.txHash, dex)) || '').toString())

              const dexVersion = getDexVersion(dex)
              const contract = getNftManagerContractAddress(dex, chainId)

              updateUnfinalizedPosition({
                ...DEFAULT_PARSED_POSITION,
                id: !isUniv2 ? `${contract}-${nftId}` : data.position.pool.address,
                tokenId: !isUniv2 ? nftId : '-1',
                chain: {
                  id: chainId,
                  name: NETWORKS_INFO[chainId].name,
                  logo: NETWORKS_INFO[chainId].icon,
                },
                dex: {
                  id: dex,
                  name: EARN_DEXES[dex].name,
                  logo: data.position.dexLogo,
                  version: dexVersion,
                },
                pool: {
                  ...DEFAULT_PARSED_POSITION.pool,
                  address: data.position.pool.address,
                  fee: data.position.pool.fee,
                  isUniv2: isUniv2,
                },
                token0: {
                  ...DEFAULT_PARSED_POSITION.token0,
                  address: data.position.token0.address,
                  totalProvide: data.position.token0.amount,
                  logo: data.position.token0.logo,
                  symbol: data.position.token0.symbol,
                },
                token1: {
                  ...DEFAULT_PARSED_POSITION.token1,
                  address: data.position.token1.address,
                  totalProvide: data.position.token1.amount,
                  logo: data.position.token1.logo,
                  symbol: data.position.token1.symbol,
                },
                totalValueTokens: [
                  {
                    address: data.position.token0.address,
                    symbol: data.position.token0.symbol,
                    amount: data.position.token0.amount,
                  },
                  {
                    address: data.position.token1.address,
                    symbol: data.position.token1.symbol,
                    amount: data.position.token1.amount,
                  },
                ],
                totalProvidedValue: data.position.value,
                totalValue: data.position.value,
                createdTime: data.position.createdAt,
                txHash: data.txHash,
                isUnfinalized: true,
                isValueUpdating: !!data.position.positionId,
              })
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

              const dex = getDexFromPoolType(addLiquidityPureParams.poolType)
              if (additionalInfo && dex) {
                addTransactionWithType({
                  hash: txHash,
                  type: addLiquidityPureParams.positionId
                    ? TRANSACTION_TYPE.EARN_INCREASE_LIQUIDITY
                    : TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
                  extraInfo: {
                    pool: additionalInfo?.pool || '',
                    positionId: addLiquidityPureParams.positionId || '',
                    tokensIn: additionalInfo?.tokensIn || [],
                    dexLogoUrl: additionalInfo?.dexLogo,
                    dex,
                  },
                })
              }

              setZapTxHash(prev => [...prev, txHash])
              return txHash
            },
          }
        : null,
    [
      addLiquidityPureParams,
      zapInRpcUrl,
      refCode,
      zapStatus,
      originalToCurrentHash,
      account,
      chainId,
      toggleWalletModal,
      handleOpenZapMigration,
      handleCloseZapInWidget,
      handleNavigateToPosition,
      onRefreshPosition,
      changeNetwork,
      library,
      addTransactionWithType,
      locale,
    ],
  )

  useAccountChanged(handleCloseZapInWidget)

  useEffect(() => {
    if (triggerClose && addLiquidityPureParams) {
      handleCloseZapInWidget()
      setTriggerClose?.(false)
    }
  }, [triggerClose, handleCloseZapInWidget, setTriggerClose, addLiquidityPureParams])

  const widget = addLiquidityParams ? (
    <Modal isOpen mobileFullWidth maxWidth={840} width={'840px'} onDismiss={handleCloseZapInWidget}>
      <ZapIn {...addLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapIn }
}

export default useZapInWidget
