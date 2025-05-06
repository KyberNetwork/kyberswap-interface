import {
  ChainId as ZapInChainId,
  LiquidityWidget as ZapIn,
  PoolType as ZapInPoolType,
} from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
import { CoreProtocol, EarnDex, EarnDex2, earnSupportedProtocols, NFT_MANAGER_CONTRACT } from 'pages/Earns/constants'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { getTokenId, isForkFrom } from 'pages/Earns/utils'
import { OpenZapMigrationArgs } from './useZapMigrationWidget'

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

const zapInDexMapping: Record<EarnDex | EarnDex2, ZapInPoolType> = {
  [EarnDex.DEX_UNISWAPV3]: ZapInPoolType.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapInPoolType.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapInPoolType.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapInPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapInPoolType.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapInPoolType.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: ZapInPoolType.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: ZapInPoolType.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: ZapInPoolType.DEX_UNISWAP_V4,
  [EarnDex2.DEX_UNISWAPV3]: ZapInPoolType.DEX_UNISWAPV3,
  [EarnDex2.DEX_PANCAKESWAPV3]: ZapInPoolType.DEX_PANCAKESWAPV3,
  [EarnDex2.DEX_SUSHISWAPV3]: ZapInPoolType.DEX_SUSHISWAPV3,
  [EarnDex2.DEX_QUICKSWAPV3ALGEBRA]: ZapInPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex2.DEX_CAMELOTV3]: ZapInPoolType.DEX_CAMELOTV3,
  [EarnDex2.DEX_THENAFUSION]: ZapInPoolType.DEX_THENAFUSION,
  [EarnDex2.DEX_KODIAK_V3]: ZapInPoolType.DEX_KODIAK_V3,
  [EarnDex2.DEX_UNISWAPV2]: ZapInPoolType.DEX_UNISWAPV2,
  [EarnDex2.DEX_UNISWAP_V4]: ZapInPoolType.DEX_UNISWAP_V4,
}

const useZapInWidget = ({ onOpenZapMigration }: { onOpenZapMigration: (props: OpenZapMigrationArgs) => void }) => {
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { filters } = useFilter()
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

      let url
      const dexIndex = Object.values(zapInDexMapping).findIndex(
        (item, index) => item === poolType && earnSupportedProtocols.includes(Object.keys(zapInDexMapping)[index]),
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(zapInDexMapping)[dexIndex] as EarnDex

      const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)

      if (isUniv2) {
        url =
          APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolId)
            .replace(':chainId', chainId.toString())
            .replace(':protocol', dex) + '?forceLoading=true'
      } else {
        const tokenId = await getTokenId(library, txHash)
        if (!tokenId) {
          navigate(APP_PATHS.EARN_POSITIONS)
          return
        }
        const nftContractObj = NFT_MANAGER_CONTRACT[dex]
        const nftContract =
          typeof nftContractObj === 'string'
            ? nftContractObj
            : nftContractObj[chainId as unknown as keyof typeof nftContractObj]
        url =
          APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', `${nftContract}-${tokenId}`)
            .replace(':chainId', chainId.toString())
            .replace(':protocol', dex) + '?forceLoading=true'
      }

      navigate(url)
    },
    [library, navigate],
  )

  const handleOpenZapIn = (pool: { exchange: string; chainId?: number; address: string }, positionId?: string) => {
    const dex = zapInDexMapping[pool.exchange as keyof typeof zapInDexMapping]
    if (!dex) {
      notify(
        {
          title: `Open pool detail failed`,
          summary: `Protocol ${pool.exchange} on ${
            NETWORKS_INFO[String(pool?.chainId || filters.chainId) as unknown as keyof typeof NETWORKS_INFO]?.name ||
            'this network'
          } is not supported`,
          type: NotificationType.ERROR,
        },
        8000,
      )
      return
    }
    setAddLiquidityPureParams({
      poolAddress: pool.address,
      chainId: (pool.chainId || filters.chainId) as ZapInChainId,
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
        from: position,
        to: {
          poolId: addLiquidityPureParams.poolAddress,
          positionId: addLiquidityPureParams.positionId,
          exchange: dex,
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
            onClose: () => handleCloseZapInWidget(),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(addLiquidityPureParams.chainId as number),
            onOpenZapMigration: handleOpenZapMigration,
            onSubmitTx: async (txData: { from: string; to: string; data: string; value: string; gasLimit: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
                await library.estimateGas(txData)
                const res = await library?.getSigner().sendTransaction(txData)
                if (!res) throw new Error('Transaction failed')
                return res.hash
              } catch (e) {
                console.log(e)
                throw e
              }
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
    ],
  )

  const previousAccount = usePreviousDistinct(account)

  useEffect(() => {
    if (account && previousAccount) handleCloseZapInWidget()
  }, [account, previousAccount, handleCloseZapInWidget])

  const widget = addLiquidityParams ? (
    <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={handleCloseZapInWidget}>
      <ZapIn {...addLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapIn }
}

export default useZapInWidget
