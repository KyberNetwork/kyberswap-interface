import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  SupportedLocale,
  TxStatus,
  ZapMigration,
  ChainId as ZapMigrationChainId,
  PoolType as ZapMigrationDex,
} from '@kyberswap/zap-migration-widgets'
import '@kyberswap/zap-migration-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { APP_PATHS } from 'constants/index'
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
import { getCookieValue } from 'utils'

interface MigrateLiquidityPureParams {
  from: {
    poolType: ZapMigrationDex
    poolAddress: string
    positionId: string
  }
  to?: {
    poolType: ZapMigrationDex
    poolAddress: string
    positionId?: string
  }
  chainId: ZapMigrationChainId
  initialTick?: { tickUpper: number; tickLower: number }
  initialSlippage?: number
  rePositionMode?: boolean
}

interface MigrateLiquidityParams extends MigrateLiquidityPureParams {
  client: string
  rpcUrl?: string
  connectedAccount: {
    address: string | undefined
    chainId: ZapMigrationChainId
  }
  locale?: SupportedLocale
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string }) => Promise<string>
}

export interface ZapMigrationInfo {
  from: {
    poolType: Exchange
    poolAddress: string
    positionId: string
  }
  to?: {
    poolType: Exchange
    poolAddress: string
    positionId?: string
  }
  chainId: number
  initialTick?: { tickUpper: number; tickLower: number }
  initialSlippage?: number
  rePositionMode?: boolean
}

const zapMigrationDexMapping: Record<Exchange, ZapMigrationDex | null> = {
  [Exchange.DEX_UNISWAPV3]: ZapMigrationDex.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: ZapMigrationDex.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: ZapMigrationDex.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: ZapMigrationDex.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: ZapMigrationDex.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: ZapMigrationDex.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: ZapMigrationDex.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: ZapMigrationDex.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: ZapMigrationDex.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: ZapMigrationDex.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: ZapMigrationDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: ZapMigrationDex.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
}

const getDexFromPoolType = (poolType: ZapMigrationDex) => {
  const dexIndex = Object.values(zapMigrationDexMapping).findIndex(
    (item, index) => item === poolType && EARN_DEXES[Object.keys(zapMigrationDexMapping)[index] as Exchange],
  )
  if (dexIndex === -1) {
    console.error('Cannot find dex')
    return
  }
  const dex = Object.keys(zapMigrationDexMapping)[dexIndex] as Exchange

  return dex
}

const useZapMigrationWidget = (onRefreshPosition?: () => void) => {
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

  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)
  const [zapTxHash, setZapTxHash] = useState<string[]>([])
  const [triggerClose, setTriggerClose] = useState(false)
  const { rpc: zapMigrationRpcUrl } = useKyberSwapConfig(migrateLiquidityPureParams?.chainId as ChainId | undefined)

  const zapStatus = useMemo(() => {
    if (!allTransactions || !zapTxHash.length) return {}

    return zapTxHash.reduce((acc: Record<string, TxStatus>, txHash) => {
      const zapTx = allTransactions[txHash]
      if (zapTx?.[0].receipt) {
        acc[txHash as keyof typeof acc] = zapTx?.[0].receipt.status === 1 ? TxStatus.SUCCESS : TxStatus.FAILED
      } else acc[txHash as keyof typeof acc] = TxStatus.PENDING
      return acc
    }, {})
  }, [allTransactions, zapTxHash])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, targetDex: ZapMigrationDex, targetPoolId: string) => {
      if (!library) return

      const dex = getDexFromPoolType(targetDex)
      if (!dex) return

      navigateToPositionAfterZap(library, txHash, chainId, dex, targetPoolId, navigate)
    },
    [library, navigate],
  )

  const handleOpenZapMigration = ({
    from,
    to,
    chainId,
    initialTick,
    initialSlippage,
    rePositionMode,
  }: ZapMigrationInfo) => {
    const sourceDex = zapMigrationDexMapping[from.poolType]
    const targetDex = zapMigrationDexMapping[to?.poolType || from.poolType]

    if (!sourceDex || !targetDex) {
      notify(
        {
          title: `Protocol ${!sourceDex ? from.poolType : to?.poolType || from.poolType} is not supported!`,
          type: NotificationType.ERROR,
        },
        5_000,
      )
      return
    }

    setMigrateLiquidityPureParams({
      from: {
        poolType: sourceDex,
        poolAddress: from.poolAddress,
        positionId: from.positionId,
      },
      to: to
        ? {
            poolType: targetDex,
            poolAddress: to.poolAddress,
            positionId: to.positionId,
          }
        : undefined,
      chainId: chainId as ZapMigrationChainId,
      initialTick,
      initialSlippage,
      rePositionMode,
    })
  }

  const migrateLiquidityParams: MigrateLiquidityParams | null = useMemo(
    () =>
      migrateLiquidityPureParams
        ? {
            ...migrateLiquidityPureParams,
            client: 'kyberswap-earn',
            rpcUrl: zapMigrationRpcUrl,
            referral: refCode,
            zapStatus,
            locale,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapMigrationChainId,
            },
            onViewPosition: (txHash: string) => {
              const { chainId } = migrateLiquidityPureParams
              const { poolType: targetDex, poolAddress: targetPoolId } =
                migrateLiquidityPureParams.to || migrateLiquidityPureParams.from
              setTriggerClose(true)
              setMigrateLiquidityPureParams(null)
              setZapTxHash([])
              handleNavigateToPosition(txHash, chainId, targetDex, targetPoolId)
            },
            onClose: () => {
              setTriggerClose(true)
              setMigrateLiquidityPureParams(null)
              setZapTxHash([])
              onRefreshPosition?.()
            },
            onBack: () => {
              setMigrateLiquidityPureParams(null)
              setZapTxHash([])
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(migrateLiquidityPureParams.chainId as number),
            onSubmitTx: async (
              txData: { from: string; to: string; value: string; data: string },
              additionalInfo?: {
                sourcePool: string
                sourceDexLogo: string
                destinationPool: string
                destinationDexLogo: string
              },
            ) => {
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res
              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

              const sourceDex = getDexFromPoolType(migrateLiquidityPureParams.from.poolType)
              const destinationDex = getDexFromPoolType(
                migrateLiquidityPureParams.to?.poolType || migrateLiquidityPureParams.from.poolType,
              )
              if (additionalInfo && sourceDex && destinationDex) {
                addTransactionWithType({
                  hash: txHash,
                  type: migrateLiquidityPureParams.rePositionMode
                    ? TRANSACTION_TYPE.EARN_REPOSITION
                    : TRANSACTION_TYPE.EARN_MIGRATE_LIQUIDITY,
                  extraInfo: {
                    sourcePool: additionalInfo.sourcePool,
                    sourceDexLogoUrl: additionalInfo.sourceDexLogo,
                    sourceDex: sourceDex,
                    destinationPool: additionalInfo.destinationPool,
                    destinationDexLogoUrl: additionalInfo.destinationDexLogo,
                    destinationDex: destinationDex,
                    positionId: migrateLiquidityPureParams.from.positionId,
                  },
                })
              }
              setZapTxHash(prev => [...prev, txHash])
              return txHash
            },
            onExplorePools: () => {
              navigate(APP_PATHS.EARN_POOLS)
            },
          }
        : null,
    [
      migrateLiquidityPureParams,
      zapMigrationRpcUrl,
      refCode,
      account,
      chainId,
      toggleWalletModal,
      handleNavigateToPosition,
      changeNetwork,
      library,
      onRefreshPosition,
      navigate,
      addTransactionWithType,
      zapStatus,
      locale,
    ],
  )

  const previousAccount = usePreviousDistinct(account)

  useEffect(() => {
    if (account && previousAccount) {
      setMigrateLiquidityPureParams(null)
      setZapTxHash([])
    }
  }, [account, previousAccount])

  useAccountChanged(() => {
    setMigrateLiquidityPureParams(null)
    setZapTxHash([])
  })

  const widget = migrateLiquidityParams ? (
    <Modal
      isOpen
      mobileFullWidth
      maxWidth={832}
      width={'832px'}
      onDismiss={() => {
        setMigrateLiquidityPureParams(null)
        setZapTxHash([])
      }}
      zindex={1001}
    >
      <ZapMigration {...migrateLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapMigration, triggerClose, setTriggerClose }
}

export default useZapMigrationWidget
