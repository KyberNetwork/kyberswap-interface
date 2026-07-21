// PoolType is needed as a value by the DEX map below. The widget package only re-exports @kyber/schema's
// enum, so taking it from the source keeps the exact same values without dragging the widget in with it.
import { PoolType as CompoundingPoolType } from '@kyber/schema'
import type { ChainId as CompoundingChainId, SupportedLocale } from '@kyberswap/compounding-widget'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPoolDetail, navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

// The widget only renders inside the modal below, so keep it out of every /earn route chunk that calls this
// hook and load it — with its stylesheet — when the modal actually mounts.
const CompoundingWidget = lazy(async () => {
  const [widget] = await Promise.all([
    import('@kyberswap/compounding-widget'),
    import('@kyberswap/compounding-widget/dist/style.css'),
  ])
  return { default: widget.CompoundingWidget }
})

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
  onOpenPoolDetail?: (pool: { chainId: number; poolAddress: string; dexId?: string }) => void
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
  [Exchange.DEX_AERODROMECL2]: CompoundingPoolType.DEX_AERODROMECL2,
  [Exchange.DEX_AERODROMECL3]: CompoundingPoolType.DEX_AERODROMECL3,
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
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const { isSmartConnector } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [compoundingPureParams, setCompoundingPureParams] = useState<CompoundingPureParams | null>(null)
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()
  const { rpc: compoundingRpcUrl } = useKyberSwapConfig(compoundingPureParams?.chainId as ChainId | undefined)

  const handleCloseCompounding = useCallback(() => {
    setCompoundingPureParams(null)
    clearTracking()
  }, [clearTracking])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, poolType: CompoundingPoolType, poolId: string, tokenId: number) => {
      const dexIndex = Object.values(compoundingDexMapping).findIndex(
        (item, index) => item === poolType && EARN_DEXES[Object.keys(compoundingDexMapping)[index] as Exchange],
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(compoundingDexMapping)[dexIndex]

      navigateToPositionAfterZap(txHash, chainId, dex, poolId, navigate, tokenId)
    },
    [navigate],
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
            txStatus,
            txHashMapping: originalToCurrentHash,
            onSwitchChain: () => changeNetwork(compoundingPureParams.chainId as number),
            onOpenPoolDetail: (pool: { chainId: number; poolAddress: string; dexId?: string }) => {
              if (!pool.dexId) return
              handleCloseCompounding()
              navigateToPoolDetail(pool, navigate)
            },
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
              additionalInfo?:
                | {
                    type: 'zap'
                    tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>
                    pool: string
                    dexLogo: string
                  }
                | {
                    type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all'
                    tokenAddress: string
                    tokenSymbol?: string
                    dexName?: string
                  },
            ) => {
              const res = await submitTransaction({
                account,
                chainId: compoundingPureParams.chainId,
                txData,
                isSmartConnector,
              })
              const { txHash, error } = res
              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

              if (additionalInfo?.type === 'zap') {
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
                      pool: additionalInfo.pool || '',
                      positionId: compoundingPureParams.positionId || '',
                      tokensIn: additionalInfo.tokensIn || [],
                      dexLogoUrl: additionalInfo.dexLogo,
                      dex,
                    },
                  })
                }
              } else if (additionalInfo?.type === 'erc20_approval') {
                addTransactionWithType({
                  hash: txHash,
                  type: TRANSACTION_TYPE.APPROVE,
                  extraInfo: {
                    tokenAddress: additionalInfo.tokenAddress,
                    summary: additionalInfo.tokenSymbol,
                  },
                })
              } else if (additionalInfo?.type === 'nft_approval' || additionalInfo?.type === 'nft_approval_all') {
                addTransactionWithType({
                  hash: txHash,
                  type: TRANSACTION_TYPE.APPROVE,
                  extraInfo: {
                    tokenAddress: additionalInfo.tokenAddress,
                    summary: additionalInfo.dexName || EARN_DEXES[compoundingPureParams.dexId].name,
                  },
                })
              }

              addTrackedTxHash(txHash)
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
      navigate,
      isSmartConnector,
      onRefreshPosition,
      toggleWalletModal,
      onCloseClaimModal,
      addTransactionWithType,
      txStatus,
      originalToCurrentHash,
      addTrackedTxHash,
    ],
  )

  useAccountChanged(handleCloseCompounding)

  const widget = compoundingParams ? (
    <Modal isOpen mobileFullWidth maxWidth={768} width={'768px'} onDismiss={handleCloseCompounding}>
      <Suspense fallback={<LocalLoader />}>
        <CompoundingWidget {...compoundingParams} />
      </Suspense>
    </Modal>
  ) : null

  return { widget, handleOpenCompounding }
}

export default useCompounding
