import {
  ChainId as CompoundingChainId,
  PoolType as CompoundingPoolType,
  CompoundingWidget,
} from '@kyberswap/compounding-widget'
import '@kyberswap/compounding-widget/dist/style.css'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EarnDex, Exchange, earnSupportedProtocols } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
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
    dex: EarnDex | Exchange
  }
  positionId: string
  initDepositTokens: string
  initAmounts: string
  compoundType?: 'COMPOUND_TYPE_REWARD'
}

const compoundingDexMapping: Record<EarnDex | Exchange, CompoundingPoolType> = {
  [EarnDex.DEX_UNISWAPV3]: CompoundingPoolType.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: CompoundingPoolType.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: CompoundingPoolType.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: CompoundingPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: CompoundingPoolType.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: CompoundingPoolType.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: CompoundingPoolType.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: CompoundingPoolType.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: CompoundingPoolType.DEX_UNISWAP_V4,
  [EarnDex.DEX_UNISWAP_V4_FAIRFLOW]: CompoundingPoolType.DEX_UNISWAP_V4_FAIRFLOW,
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
}

const useCompounding = ({
  onRefreshPosition,
  onCloseClaimModal,
}: {
  onRefreshPosition?: () => void
  onCloseClaimModal: () => void
}) => {
  const addTransactionWithType = useTransactionAdder()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [compoundingPureParams, setCompoundingPureParams] = useState<CompoundingPureParams | null>(null)
  const [dex, setDex] = useState<EarnDex | Exchange | null>(null)

  const handleCloseCompounding = useCallback(() => {
    setCompoundingPureParams(null)
    setDex(null)
  }, [])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, poolType: CompoundingPoolType, poolId: string, tokenId: number) => {
      if (!library) return

      const dexIndex = Object.values(compoundingDexMapping).findIndex(
        (item, index) =>
          item === poolType && earnSupportedProtocols.includes(Object.keys(compoundingDexMapping)[index]),
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(compoundingDexMapping)[dexIndex] as EarnDex

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
      setDex(pool.dex as EarnDex | Exchange)
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
            connectedAccount: {
              address: account,
              chainId: chainId,
            },
            onConnectWallet: toggleWalletModal,
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

              if (additionalInfo)
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
                    dex: dex as EarnDex | Exchange,
                  },
                })
              return txHash
            },
          }
        : null,
    [
      account,
      chainId,
      changeNetwork,
      compoundingPureParams,
      handleCloseCompounding,
      handleNavigateToPosition,
      library,
      onRefreshPosition,
      toggleWalletModal,
      onCloseClaimModal,
      addTransactionWithType,
      dex,
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
