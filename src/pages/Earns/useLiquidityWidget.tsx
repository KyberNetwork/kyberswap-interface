import { ChainId, LiquidityWidget, PoolType, ZapOut } from 'kane6-liquidity-widgets'
import 'kane6-liquidity-widgets/dist/style.css'
import { ZapMigration, ChainId as ZapMigrationChainId, Dex as ZapMigrationDex } from 'kane6-zap-migration-widgets'
import 'kane6-zap-migration-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
import { EarnDex } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

import useFilter from './PoolExplorer/useFilter'

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

const dexFormatter = {
  [PoolType.DEX_UNISWAPV3]: ZapMigrationDex.DEX_UNISWAPV3,
  [PoolType.DEX_PANCAKESWAPV3]: ZapMigrationDex.DEX_PANCAKESWAPV3,
  [PoolType.DEX_SUSHISWAPV3]: ZapMigrationDex.DEX_SUSHISWAPV3,
  [PoolType.DEX_UNISWAPV2]: null,
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
  [EarnDex.DEX_UNISWAPV3]: ZapMigrationDex.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapMigrationDex.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapMigrationDex.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapMigrationDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapMigrationDex.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapMigrationDex.DEX_THENAFUSION,
}

const useLiquidityWidget = () => {
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { filters } = useFilter()
  const [searchParams, setSearchParams] = useSearchParams()

  const [addLiquidityPureParams, setAddLiquidityPureParams] = useState<AddLiquidityPureParams | null>(null)
  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)

  const handleOpenZapMigrationWidget = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
    ) => {
      if (!addLiquidityPureParams) return
      if (!dexFormatter[position.exchange as EarnDex]) {
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
      if (!dexFormatter[addLiquidityPureParams.poolType]) {
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
          dex: dexFormatter[position.exchange as EarnDex],
          poolId: position.poolId,
          positionId: position.positionId,
        },
        to: {
          dex: dexFormatter[addLiquidityPureParams.poolType] as ZapMigrationDex,
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

  const handleCloseZapInWidget = useCallback(() => {
    searchParams.delete('exchange')
    searchParams.delete('poolChainId')
    searchParams.delete('poolAddress')
    setSearchParams(searchParams)
    setAddLiquidityPureParams(null)
  }, [searchParams, setSearchParams])

  const handleOpenZapInWidget = (
    pool: { exchange: string; chainId?: number; address: string },
    positionId?: string,
  ) => {
    const supportedDexs = Object.keys(PoolType).map(item => item.replace('DEX_', '').replace('V3', '').toLowerCase())
    const formattedExchange = pool.exchange.toLowerCase().replaceAll('_', '').replaceAll('-', '').replaceAll('v3', '')
    const dex = supportedDexs.find(item => formattedExchange.includes(item) || item.includes(formattedExchange))
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
      poolType: PoolType[`DEX_${dex.toUpperCase()}V3` as keyof typeof PoolType],
      positionId,
    })
  }

  const { changeNetwork } = useChangeNetwork()
  const navigate = useNavigate()

  const refCode = getCookieValue('refCode')

  const addLiquidityParams: AddLiquidityParams | null = useMemo(
    () =>
      addLiquidityPureParams
        ? {
            ...addLiquidityPureParams,
            source: 'KyberSwap-Earn',
            referral: refCode,
            onViewPosition: () => {
              handleCloseZapInWidget()
              navigate(`/earns/positions`)
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
      navigate,
      changeNetwork,
      library,
    ],
  )

  const migrateLiquidityParams: MigrateLiquidityParams | null = useMemo(
    () =>
      migrateLiquidityPureParams
        ? {
            ...migrateLiquidityPureParams,
            client: 'KyberSwap-Earn',
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapMigrationChainId,
            },
            onViewPosition: () => {
              setMigrateLiquidityPureParams(null)
              navigate(`/earns/positions`)
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
      navigate,
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
            source: 'KyberSwap-Earn',
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
    const poolType = (() => {
      switch (position?.dex) {
        case 'Uniswap V3':
          return PoolType.DEX_UNISWAPV3
        case 'SushiSwap V3':
          return PoolType.DEX_SUSHISWAPV3
        case 'PancakeSwap V3':
          return PoolType.DEX_PANCAKESWAPV3
        default:
          return null
      }
    })()
    if (!poolType) {
      notify(
        {
          type: NotificationType.ERROR,
          title: 'Pool Type is supported',
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
  }, [account, handleCloseZapInWidget, previousAccount])

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
