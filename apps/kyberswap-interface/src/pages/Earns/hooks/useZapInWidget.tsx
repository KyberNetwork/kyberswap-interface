import {
  LiquidityWidget as ZapIn,
  ChainId as ZapInChainId,
  PoolType as ZapInPoolType,
} from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EarnDex, Exchange, earnSupportedProtocols } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

interface AddLiquidityPureParams {
  poolAddress: string
  chainId: ZapInChainId
  poolType: ZapInPoolType
  positionId?: string
}

interface AddLiquidityParams extends AddLiquidityPureParams {
  source: string
  connectedAccount: {
    address?: string | undefined
    chainId: number
  }
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
    dex: EarnDex | Exchange
  }
  positionId?: string
}

const zapInDexMapping: Record<EarnDex | Exchange, ZapInPoolType> = {
  [EarnDex.DEX_UNISWAPV3]: ZapInPoolType.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapInPoolType.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapInPoolType.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapInPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapInPoolType.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapInPoolType.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: ZapInPoolType.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: ZapInPoolType.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: ZapInPoolType.DEX_UNISWAP_V4,
  [EarnDex.DEX_UNISWAP_V4_FAIRFLOW]: ZapInPoolType.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_UNISWAPV3]: ZapInPoolType.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: ZapInPoolType.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: ZapInPoolType.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: ZapInPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: ZapInPoolType.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: ZapInPoolType.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: ZapInPoolType.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: ZapInPoolType.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: ZapInPoolType.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: ZapInPoolType.DEX_UNISWAP_V4_FAIRFLOW,
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
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()

  const [addLiquidityPureParams, setAddLiquidityPureParams] = useState<AddLiquidityPureParams | null>(null)

  const handleCloseZapInWidget = useCallback(() => {
    searchParams.delete('exchange')
    searchParams.delete('poolChainId')
    searchParams.delete('poolAddress')
    setSearchParams(searchParams)
    setAddLiquidityPureParams(null)
  }, [searchParams, setSearchParams])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, poolType: ZapInPoolType, poolId: string) => {
      if (!library) return

      const dexIndex = Object.values(zapInDexMapping).findIndex(
        (item, index) => item === poolType && earnSupportedProtocols.includes(Object.keys(zapInDexMapping)[index]),
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(zapInDexMapping)[dexIndex] as EarnDex

      navigateToPositionAfterZap(library, txHash, chainId, dex, poolId, navigate)
    },
    [library, navigate],
  )

  const handleOpenZapIn = ({ pool, positionId }: ZapInInfo) => {
    const dex = zapInDexMapping[pool.dex]
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
    })
  }

  const handleOpenZapMigration = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
    ) => {
      if (!addLiquidityPureParams) return

      const dexIndex = Object.values(zapInDexMapping).findIndex(
        (item, index) =>
          item === addLiquidityPureParams.poolType &&
          earnSupportedProtocols.includes(Object.keys(zapInDexMapping)[index]),
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(zapInDexMapping)[dexIndex] as EarnDex

      onOpenZapMigration({
        from: {
          ...position,
          dex: position.exchange as EarnDex,
        },
        to: {
          poolId: addLiquidityPureParams.poolAddress,
          positionId: addLiquidityPureParams.positionId,
          dex: dex,
        },
        chainId: addLiquidityPureParams.chainId,
        initialTick,
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
            referral: refCode,
            onViewPosition: (txHash: string) => {
              const { chainId, poolType, poolAddress } = addLiquidityPureParams
              handleCloseZapInWidget()
              handleNavigateToPosition(txHash, chainId, poolType, poolAddress)
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
            onSubmitTx: async (txData: { from: string; to: string; data: string; value: string; gasLimit: string }) => {
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res

              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

              return txHash
            },
          }
        : null,
    [
      addLiquidityPureParams,
      refCode,
      account,
      chainId,
      toggleWalletModal,
      handleOpenZapMigration,
      handleCloseZapInWidget,
      handleNavigateToPosition,
      changeNetwork,
      library,
      onRefreshPosition,
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
    <Modal isOpen mobileFullWidth maxWidth={800} width={'800px'} onDismiss={handleCloseZapInWidget}>
      <ZapIn {...addLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapIn }
}

export default useZapInWidget
