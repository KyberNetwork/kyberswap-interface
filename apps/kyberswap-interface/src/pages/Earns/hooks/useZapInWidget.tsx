import {
  OnSuccessProps,
  LiquidityWidget as ZapIn,
  ChainId as ZapInChainId,
  PoolType as ZapInPoolType,
} from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { CoreProtocol, EarnDex, Exchange, earnSupportedProtocols } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { DEFAULT_PARSED_POSITION } from 'pages/Earns/types'
import { getNftManagerContractAddress, getTokenId, isForkFrom, submitTransaction } from 'pages/Earns/utils'
import { listDexesWithVersion } from 'pages/Earns/utils/position'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

interface AddLiquidityPureParams {
  poolAddress: string
  chainId: ZapInChainId
  poolType: ZapInPoolType
  positionId?: string
  initialTick?: { tickUpper: number; tickLower: number }
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
  initialTick?: { tickUpper: number; tickLower: number }
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

const getEarnDexFromPoolType = (poolType: ZapInPoolType) => {
  const dexIndex = Object.values(zapInDexMapping).findIndex(
    (item, index) => item === poolType && earnSupportedProtocols.includes(Object.keys(zapInDexMapping)[index]),
  )
  if (dexIndex === -1) {
    console.error('Cannot find dex')
    return
  }
  const dex = Object.keys(zapInDexMapping)[dexIndex] as EarnDex

  return dex
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

      const dex = getEarnDexFromPoolType(poolType)
      if (!dex) return

      navigateToPositionAfterZap(library, txHash, chainId, dex, poolId, navigate)
    },
    [library, navigate],
  )

  const handleOpenZapIn = ({ pool, positionId, initialTick }: ZapInInfo) => {
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
      initialTick,
    })
  }

  const handleOpenZapMigration = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
      initialSlippage?: number,
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
            onSuccess: async (data: OnSuccessProps) => {
              if (!library) return

              const dex = getEarnDexFromPoolType(data.position.poolType)
              if (!dex) return

              const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)
              const isUniV4 = isForkFrom(dex, CoreProtocol.UniswapV4)

              const nftId =
                data.position.positionId ||
                (isUniv2 ? account || '' : ((await getTokenId(library, data.txHash, isUniV4)) || '').toString())

              const dexVersion = listDexesWithVersion.includes(dex) ? dex.split(' ').pop() || '' : ''

              const contract = getNftManagerContractAddress(dex, chainId)

              updateUnfinalizedPosition({
                ...DEFAULT_PARSED_POSITION,
                id: `${contract}-${nftId}`,
                tokenId: nftId,
                chain: {
                  id: chainId,
                  name: NETWORKS_INFO[chainId].name,
                  logo: NETWORKS_INFO[chainId].icon,
                },
                dex: {
                  id: dex,
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
