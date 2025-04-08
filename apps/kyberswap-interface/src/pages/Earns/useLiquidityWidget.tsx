import { ChainId, LiquidityWidget, PoolType, ZapOut } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { ZapMigration, ChainId as ZapMigrationChainId, Dex as ZapMigrationDex } from '@kyberswap/zap-migration-widgets'
import '@kyberswap/zap-migration-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
import { CoreProtocol, EarnDex, EarnDex2, NFT_MANAGER_CONTRACT } from 'pages/Earns/constants'

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

interface AddLiquidityPureParams {
  poolAddress: string
  chainId: ChainId
  poolType: PoolType
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

interface MigrateLiquidityPureParams {
  from: {
    dex: ZapMigrationDex
    poolId: string
    positionId: string | number
  }
  to: {
    dex: ZapMigrationDex
    poolId: string
    positionId?: string | number
  }
  chainId: ZapMigrationChainId
  initialTick?: { tickUpper: number; tickLower: number }
}

interface MigrateLiquidityParams extends MigrateLiquidityPureParams {
  client: string
  connectedAccount: {
    address: string | undefined
    chainId: ZapMigrationChainId
  }
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string }) => Promise<string>
}

const zapDexMapping: Record<EarnDex | EarnDex2, PoolType> = {
  [EarnDex.DEX_UNISWAPV3]: PoolType.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: PoolType.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: PoolType.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: PoolType.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: PoolType.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: PoolType.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: PoolType.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: PoolType.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: PoolType.DEX_UNISWAP_V4,
  [EarnDex2.DEX_UNISWAPV3]: PoolType.DEX_UNISWAPV3,
  [EarnDex2.DEX_PANCAKESWAPV3]: PoolType.DEX_PANCAKESWAPV3,
  [EarnDex2.DEX_SUSHISWAPV3]: PoolType.DEX_SUSHISWAPV3,
  [EarnDex2.DEX_QUICKSWAPV3ALGEBRA]: PoolType.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex2.DEX_CAMELOTV3]: PoolType.DEX_CAMELOTV3,
  [EarnDex2.DEX_THENAFUSION]: PoolType.DEX_THENAFUSION,
  [EarnDex2.DEX_KODIAK_V3]: PoolType.DEX_KODIAK_V3,
  [EarnDex2.DEX_UNISWAPV2]: PoolType.DEX_UNISWAPV2,
  [EarnDex2.DEX_UNISWAP_V4]: PoolType.DEX_UNISWAP_V4,
}

const zapMigrationDexMapping: Record<PoolType | EarnDex, ZapMigrationDex | null> = {
  [PoolType.DEX_UNISWAPV3]: ZapMigrationDex.DEX_UNISWAPV3,
  [PoolType.DEX_PANCAKESWAPV3]: ZapMigrationDex.DEX_PANCAKESWAPV3,
  [PoolType.DEX_SUSHISWAPV3]: ZapMigrationDex.DEX_SUSHISWAPV3,
  [PoolType.DEX_UNISWAPV2]: ZapMigrationDex.DEX_UNISWAPV2,
  [PoolType.DEX_PANCAKESWAPV2]: null,
  [PoolType.DEX_SUSHISWAPV2]: null,
  [PoolType.DEX_QUICKSWAPV2]: null,
  [PoolType.DEX_PANGOLINSTANDARD]: null,
  [PoolType.DEX_THRUSTERV2]: null,
  [PoolType.DEX_SWAPMODEV2]: null,
  [PoolType.DEX_METAVAULTV3]: null,
  [PoolType.DEX_LINEHUBV3]: null,
  [PoolType.DEX_SWAPMODEV3]: null,
  [PoolType.DEX_KOICL]: null,
  [PoolType.DEX_THRUSTERV3]: null,
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: ZapMigrationDex.DEX_QUICKSWAPV3ALGEBRA,
  [PoolType.DEX_CAMELOTV3]: ZapMigrationDex.DEX_CAMELOTV3,
  [PoolType.DEX_THENAFUSION]: ZapMigrationDex.DEX_THENAFUSION,
  [PoolType.DEX_KODIAK_V3]: ZapMigrationDex.DEX_KODIAK_V3,
  [PoolType.DEX_KODIAK_V2]: null,
  [PoolType.DEX_SQUADSWAP_V3]: null,
  [PoolType.DEX_SQUADSWAP_V2]: null,
  [PoolType.DEX_UNISWAP_V4]: ZapMigrationDex.DEX_UNISWAP_V4,
  [EarnDex.DEX_UNISWAPV3]: ZapMigrationDex.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapMigrationDex.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapMigrationDex.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapMigrationDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapMigrationDex.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapMigrationDex.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: ZapMigrationDex.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: ZapMigrationDex.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: ZapMigrationDex.DEX_UNISWAP_V4,
}

const useLiquidityWidget = () => {
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
  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)

  const handleCloseZapInWidget = useCallback(() => {
    searchParams.delete('exchange')
    searchParams.delete('poolChainId')
    searchParams.delete('poolAddress')
    setSearchParams(searchParams)
    setAddLiquidityPureParams(null)
  }, [searchParams, setSearchParams])

  const handleNavigateToPosition = useCallback(
    async (txHash: string) => {
      if (!library || !addLiquidityPureParams) return
      let url
      const chainId = addLiquidityPureParams.chainId
      const dexIndex = Object.values(zapDexMapping).findIndex(item => item === addLiquidityPureParams.poolType)
      const dex = Object.keys(zapDexMapping)[dexIndex] as EarnDex
      const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)
      if (isUniv2) {
        const poolAddress = addLiquidityPureParams.poolAddress
        url =
          APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolAddress)
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
            : nftContractObj[addLiquidityPureParams.chainId as unknown as keyof typeof nftContractObj]
        url =
          APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', `${nftContract}-${tokenId}`)
            .replace(':chainId', chainId.toString())
            .replace(':protocol', dex) + '?forceLoading=true'
      }

      navigate(url)
    },
    [addLiquidityPureParams, library, navigate],
  )

  const handleOpenZapMigrationWidget = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
    ) => {
      if (!addLiquidityPureParams) return
      const zapFromDex = zapMigrationDexMapping[position.exchange as keyof typeof zapMigrationDexMapping]
      const zapToDex = zapMigrationDexMapping[addLiquidityPureParams.poolType as keyof typeof zapMigrationDexMapping]
      if (!zapFromDex) {
        notify(
          {
            title: `Open liquidity migration widget failed`,
            summary: `Protocol ${position.exchange} is not supported`,
            type: NotificationType.ERROR,
          },
          8000,
        )
        return
      }
      if (!zapToDex) {
        notify(
          {
            title: `Open liquidity migration widget failed`,
            summary: `Protocol ${addLiquidityPureParams.poolType} is not supported`,
            type: NotificationType.ERROR,
          },
          8000,
        )
        return
      }
      const paramsToSet = {
        from: {
          dex: zapFromDex,
          poolId: position.poolId,
          positionId: position.positionId,
        },
        to: {
          dex: zapToDex,
          poolId: addLiquidityPureParams.poolAddress,
          positionId: addLiquidityPureParams.positionId,
        },
        chainId: addLiquidityPureParams.chainId as ZapMigrationChainId,
        initialTick,
      }
      setMigrateLiquidityPureParams(paramsToSet)
    },
    [addLiquidityPureParams, notify],
  )

  const handleOpenZapInWidget = (
    pool: { exchange: string; chainId?: number; address: string },
    positionId?: string,
  ) => {
    const dex = zapDexMapping[pool.exchange as keyof typeof zapDexMapping]
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
      chainId: (pool.chainId || filters.chainId) as ChainId,
      poolType: dex,
      positionId,
    })
  }

  const addLiquidityParams: AddLiquidityParams | null = useMemo(
    () =>
      addLiquidityPureParams
        ? {
            ...addLiquidityPureParams,
            source: 'kyberswap-earn',
            referral: refCode,
            onViewPosition: (txHash: string) => {
              handleCloseZapInWidget()
              handleNavigateToPosition(txHash)
            },
            connectedAccount: {
              address: account,
              chainId: chainId,
            },
            onClose: () => handleCloseZapInWidget(),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(addLiquidityPureParams.chainId as number),
            onOpenZapMigration: handleOpenZapMigrationWidget,
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
      handleOpenZapMigrationWidget,
      handleCloseZapInWidget,
      handleNavigateToPosition,
      changeNetwork,
      library,
    ],
  )

  const migrateLiquidityParams: MigrateLiquidityParams | null = useMemo(
    () =>
      migrateLiquidityPureParams
        ? {
            ...migrateLiquidityPureParams,
            client: 'kyberswap-earn',
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapMigrationChainId,
            },
            onViewPosition: (txHash: string) => {
              setMigrateLiquidityPureParams(null)
              handleNavigateToPosition(txHash)
            },

            onClose: () => {
              setMigrateLiquidityPureParams(null)
              handleCloseZapInWidget()
            },
            onBack: () => setMigrateLiquidityPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(migrateLiquidityPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
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
      migrateLiquidityPureParams,
      refCode,
      account,
      chainId,
      toggleWalletModal,
      handleNavigateToPosition,
      handleCloseZapInWidget,
      changeNetwork,
      library,
    ],
  )

  const [zapOutPureParams, setZapOutPureParams] = useState<{
    positionId: string
    poolType: PoolType
    poolAddress: string
    chainId: ChainId
  } | null>(null)
  const zapOutParams = useMemo(
    () =>
      zapOutPureParams
        ? {
            ...zapOutPureParams,
            source: 'kyberswap-earn',
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapMigrationChainId,
            },
            onClose: () => setZapOutPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
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
    [account, chainId, changeNetwork, library, toggleWalletModal, zapOutPureParams, refCode],
  )

  const handleOpenZapOut = (position: { dex: string; chainId: number; poolAddress: string; id: string }) => {
    const poolType = zapDexMapping[position.dex as keyof typeof zapDexMapping]
    if (!poolType) {
      notify(
        {
          type: NotificationType.ERROR,
          title: 'Pool Type is not supported',
        },
        5_000,
      )
      return
    }

    setZapOutPureParams({
      poolType,
      chainId: position.chainId as ChainId,
      poolAddress: position.poolAddress,
      positionId: position.id,
    })
  }

  const previousAccount = usePreviousDistinct(account)
  useEffect(() => {
    if (account && previousAccount) {
      handleCloseZapInWidget()
      setMigrateLiquidityPureParams(null)
      setZapOutPureParams(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, previousAccount])

  const liquidityWidget = (
    <>
      {addLiquidityParams && (
        <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={handleCloseZapInWidget}>
          <LiquidityWidget {...addLiquidityParams} />
        </Modal>
      )}
      {migrateLiquidityParams && (
        <Modal
          isOpen
          mobileFullWidth
          maxWidth={760}
          width={'760px'}
          onDismiss={() => {
            setMigrateLiquidityPureParams(null)
            handleCloseZapInWidget()
          }}
          zindex={9999}
        >
          <ZapMigration {...migrateLiquidityParams} />
        </Modal>
      )}
      {zapOutParams && (
        <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={() => setZapOutPureParams(null)}>
          <ZapOut {...zapOutParams} />
        </Modal>
      )}
    </>
  )

  return { liquidityWidget, handleOpenZapInWidget, handleOpenZapOut }
}

export default useLiquidityWidget
