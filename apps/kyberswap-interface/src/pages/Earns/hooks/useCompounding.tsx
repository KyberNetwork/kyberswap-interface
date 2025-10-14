import {
  ChainId as CompoundingChainId,
  PoolType as CompoundingPoolType,
  CompoundingWidget,
  TxStatus,
} from '@kyberswap/compounding-widget'
import '@kyberswap/compounding-widget/dist/style.css'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { SupportedLocale } from 'constants/locales'
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
  const { rpc: compoundingRpcUrl } = useKyberSwapConfig(compoundingPureParams?.chainId as ChainId | undefined)

  const compoundingStatus = useMemo(() => {
    if (!allTransactions || !compoundingTxHash.length) return {}

    return compoundingTxHash.reduce((acc: Record<string, TxStatus>, txHash) => {
      const zapTx = allTransactions[txHash]
      if (zapTx?.[0].receipt) {
        acc[txHash as keyof typeof acc] = zapTx?.[0].receipt.status === 1 ? TxStatus.SUCCESS : TxStatus.FAILED
      } else acc[txHash as keyof typeof acc] = TxStatus.PENDING
      return acc
    }, {})
  }, [allTransactions, compoundingTxHash])

  const handleCloseCompounding = useCallback(() => {
    setCompoundingPureParams(null)
    setCompoundingTxHash([])
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
