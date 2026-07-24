// PoolType is needed as a value by the DEX map below. The widget package only re-exports @kyber/schema's
// enum, so taking it from the source keeps the exact same values without dragging the widget in with it.
import { PoolType as ZapMigrationDex } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import type { OnSuccessProps, SupportedLocale, ChainId as ZapMigrationChainId } from '@kyberswap/zap-migration-widgets'
// Eager, not with the lazy JS below: the widget's status dialog is styled by utilities scoped under the
// widget's own root class, which ship only in this stylesheet (the app's eager @kyber/ui styles use a
// different scope and don't reach it). This widget's scope is its own, so nothing else supplies it.
import '@kyberswap/zap-migration-widgets/dist/style.css'
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useIsSmartAccount } from 'hooks/useIsSmartAccount'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { DEFAULT_PARSED_POSITION } from 'pages/Earns/types'
import { getNftManagerContractAddress, getTokenId, submitTransaction } from 'pages/Earns/utils'
import { getDexVersion } from 'pages/Earns/utils/position'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import { navigateToPoolDetail, navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getCookieValue } from 'utils'
import { friendlyError } from 'utils/errorMessage'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

// The widget only renders inside the modal below, so lazy-load its JS to keep it out of every /earn route
// chunk that calls this hook.
const ZapMigration = lazy(() =>
  import('@kyberswap/zap-migration-widgets').then(widget => ({ default: widget.ZapMigration })),
)

interface MigrateLiquidityPureParams {
  from: {
    poolType: ZapMigrationDex
    poolAddress: string
    positionId: string
    dexId: Exchange
  }
  to?: {
    poolType: ZapMigrationDex
    poolAddress: string
    positionId?: string
    dexId: Exchange
  }
  chainId: ZapMigrationChainId
  initialTick?: { tickUpper: number; tickLower: number }
  initialRevertPrice?: boolean
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
  onCloseSuccess?: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onOpenPoolDetail?: (pool: { chainId: number; poolAddress: string; dexId?: string }) => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string }) => Promise<string>
}

export interface ZapMigrationInfo {
  from: {
    poolType: Exchange
    poolAddress: string
    positionId: string
    dexId: Exchange
  }
  to?: {
    poolType: Exchange
    poolAddress: string
    positionId?: string
    dexId: Exchange
  }
  chainId: number
  initialTick?: { tickUpper: number; tickLower: number }
  initialRevertPrice?: boolean
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
  [Exchange.DEX_PANCAKE_INFINITY_CL_ALPHA]: ZapMigrationDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_DYNAMIC]: ZapMigrationDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_BREVIS]: ZapMigrationDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_LO]: ZapMigrationDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_AERODROMECL]: ZapMigrationDex.DEX_AERODROMECL,
  [Exchange.DEX_AERODROMECL2]: ZapMigrationDex.DEX_AERODROMECL2,
  [Exchange.DEX_AERODROMECL3]: ZapMigrationDex.DEX_AERODROMECL3,
}

const useZapMigrationWidget = (onRefreshPosition?: () => void) => {
  const locale = useActiveLocale()
  const addTransactionWithType = useTransactionAdder()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { isSmartConnector } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const isSmartAccount = useIsSmartAccount()
  const { changeNetwork } = useChangeNetwork()

  const { trackingHandler } = useTracking()
  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)
  const [triggerClose, setTriggerClose] = useState(false)
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()
  const { rpc: zapMigrationRpcUrl } = useKyberSwapConfig(migrateLiquidityPureParams?.chainId as ChainId | undefined)

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, dex: Exchange, targetPoolId: string) => {
      navigateToPositionAfterZap(txHash, chainId, dex, targetPoolId, navigate)
    },
    [navigate],
  )

  const handleCloseMigration = useCallback(() => {
    setTriggerClose(true)
    setMigrateLiquidityPureParams(null)
    clearTracking()
    onRefreshPosition?.()
  }, [clearTracking, onRefreshPosition])

  const handleCloseMigrationSuccess = useCallback(() => {
    handleCloseMigration()
    navigate(APP_PATHS.EARN_POSITIONS)
  }, [handleCloseMigration, navigate])

  const handleOpenZapMigration = ({
    from,
    to,
    chainId,
    initialTick,
    initialRevertPrice,
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
        dexId: from.dexId,
      },
      to: to
        ? {
            poolType: targetDex,
            poolAddress: to.poolAddress,
            positionId: to.positionId,
            dexId: to.dexId,
          }
        : undefined,
      chainId: chainId as ZapMigrationChainId,
      initialTick,
      initialRevertPrice,
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
            // See useZapOutWidget for the smart-wallet permit rationale — EIP-1271
            // signatures from smart wallets (Porto, Safe, Coinbase Smart Wallet,
            // EIP-7702 EOAs, ...) don't verify on the NFT contract, so we let the
            // widget fall back to approve.
            signTypedData:
              isSmartConnector || isSmartAccount
                ? undefined
                : async (account: string, typedDataJson: string) => {
                    const parsedTypedData = JSON.parse(typedDataJson)
                    return signTypedDataRaw({
                      chainId: chainId,
                      account: account.toLowerCase() as Address,
                      typedData: parsedTypedData,
                    })
                  },
            referral: refCode,
            txStatus,
            txHashMapping: originalToCurrentHash,
            locale,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapMigrationChainId,
            },
            onViewPosition: (txHash: string) => {
              const { chainId } = migrateLiquidityPureParams
              const { dexId: targetDex, poolAddress: targetPoolId } =
                migrateLiquidityPureParams.to || migrateLiquidityPureParams.from

              setTriggerClose(true)
              setMigrateLiquidityPureParams(null)
              clearTracking()
              handleNavigateToPosition(txHash, chainId, targetDex, targetPoolId)
            },
            onClose: handleCloseMigration,
            onCloseSuccess: handleCloseMigrationSuccess,
            onBack: () => {
              setMigrateLiquidityPureParams(null)
              clearTracking()
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(migrateLiquidityPureParams.chainId as number),
            onOpenPoolDetail: (pool: { chainId: number; poolAddress: string; dexId?: string }) => {
              if (!pool.dexId) return
              setTriggerClose(true)
              setMigrateLiquidityPureParams(null)
              clearTracking()
              navigateToPoolDetail(pool, navigate)
            },
            onSubmitTx: async (
              txData: { from: string; to: string; value: string; data: string },
              additionalInfo?:
                | {
                    type: 'zap'
                    sourcePool: string
                    sourceDexLogo: string
                    destinationPool: string
                    destinationDexLogo: string
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
                chainId: migrateLiquidityPureParams.chainId,
                txData,
                isSmartConnector,
              })
              const { txHash, error } = res
              if (!txHash || error) {
                const isReposition = migrateLiquidityPureParams.rePositionMode
                trackingHandler(
                  isReposition ? TRACKING_EVENT_TYPE.EARN_REPOSITION_FAILED : TRACKING_EVENT_TYPE.EARN_MIGRATE_FAILED,
                  {
                    position_id: migrateLiquidityPureParams.from.positionId,
                    chain: NETWORKS_INFO[migrateLiquidityPureParams.chainId]?.name,
                    pool: migrateLiquidityPureParams.from.poolAddress,
                    failure_reason: error?.message || 'Transaction failed',
                    completion_time_ms: Date.now(),
                  },
                )
                throw new Error(error ? friendlyError(error) : 'Transaction failed')
              }

              const sourceDex = migrateLiquidityPureParams.from.dexId
              const destinationDex = migrateLiquidityPureParams.to?.dexId || sourceDex
              if (additionalInfo?.type === 'zap' && sourceDex && destinationDex) {
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

                const isReposition = migrateLiquidityPureParams.rePositionMode
                trackingHandler(
                  isReposition
                    ? TRACKING_EVENT_TYPE.EARN_REPOSITION_INITIATED
                    : TRACKING_EVENT_TYPE.EARN_MIGRATE_INITIATED,
                  {
                    position_id: migrateLiquidityPureParams.from.positionId,
                    chain: NETWORKS_INFO[migrateLiquidityPureParams.chainId]?.name,
                    pool: migrateLiquidityPureParams.from.poolAddress,
                    tx_hash: txHash,
                    ...(isReposition
                      ? {}
                      : {
                          source_position_id: migrateLiquidityPureParams.from.positionId,
                          source_pool_address: migrateLiquidityPureParams.from.poolAddress,
                        }),
                  },
                )
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
                    summary: additionalInfo.dexName,
                  },
                })
              }
              // Track all transactions for replacement detection
              addTrackedTxHash(txHash)
              return txHash
            },
            onExplorePools: () => {
              navigate(APP_PATHS.EARN_POOLS)
            },
            onSuccess: async (data: OnSuccessProps) => {
              const isReposition = migrateLiquidityPureParams.rePositionMode
              const tokenPair = `${data.position.token0.symbol}/${data.position.token1.symbol}`
              trackingHandler(
                isReposition
                  ? TRACKING_EVENT_TYPE.EARN_REPOSITION_COMPLETED
                  : TRACKING_EVENT_TYPE.EARN_MIGRATE_COMPLETED,
                {
                  position_id: data.position.positionId || migrateLiquidityPureParams.from.positionId,
                  chain: NETWORKS_INFO[migrateLiquidityPureParams.chainId]?.name,
                  pool: data.position.pool.address,
                  token_pair: tokenPair,
                  tx_hash: data.txHash,
                  ...(isReposition
                    ? {}
                    : {
                        source_position_id: migrateLiquidityPureParams.from.positionId,
                        source_pool_address: migrateLiquidityPureParams.from.poolAddress,
                      }),
                },
              )

              const dex = migrateLiquidityPureParams.to?.dexId || migrateLiquidityPureParams.from.dexId
              const isUniv2 = EARN_DEXES[dex as Exchange]?.isForkFrom === CoreProtocol.UniswapV2

              const nftId =
                data.position.positionId ||
                (isUniv2 ? account || '' : ((await getTokenId(chainId, data.txHash, dex)) || '').toString())

              const dexVersion = getDexVersion(dex)
              const contract = getNftManagerContractAddress(dex, chainId)

              updateUnfinalizedPosition(
                {
                  ...DEFAULT_PARSED_POSITION,
                  positionId: !isUniv2 ? `${contract}-${nftId}` : data.position.pool.address,
                  tokenId: data.position.positionId || '',
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
                  },
                  token0: {
                    ...DEFAULT_PARSED_POSITION.token0,
                    address: data.position.token0.address,
                    totalProvide: data.position.token0.amount,
                    currentAmount: data.position.token0.amount,
                    logo: data.position.token0.logo,
                    symbol: data.position.token0.symbol,
                  },
                  token1: {
                    ...DEFAULT_PARSED_POSITION.token1,
                    address: data.position.token1.address,
                    totalProvide: data.position.token1.amount,
                    currentAmount: data.position.token1.amount,
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
                  isValueUpdating: !!migrateLiquidityPureParams.to?.positionId,
                },
                account,
              )
            },
          }
        : null,
    [
      migrateLiquidityPureParams,
      zapMigrationRpcUrl,
      isSmartConnector,
      isSmartAccount,
      refCode,
      txStatus,
      originalToCurrentHash,
      locale,
      account,
      chainId,
      toggleWalletModal,
      clearTracking,
      handleCloseMigration,
      handleCloseMigrationSuccess,
      handleNavigateToPosition,
      changeNetwork,
      addTrackedTxHash,
      trackingHandler,
      addTransactionWithType,
      navigate,
    ],
  )

  const previousAccount = usePreviousDistinct(account)

  useEffect(() => {
    if (account && previousAccount) {
      setMigrateLiquidityPureParams(null)
      clearTracking()
    }
  }, [account, previousAccount, clearTracking])

  useAccountChanged(() => {
    setMigrateLiquidityPureParams(null)
    clearTracking()
  })

  const widget = migrateLiquidityParams ? (
    <Modal
      isOpen
      mobileFullWidth
      maxWidth={832}
      width={'832px'}
      onDismiss={() => {
        setMigrateLiquidityPureParams(null)
        clearTracking()
      }}
      zindex={1001}
    >
      <Suspense fallback={<LocalLoader />}>
        <ZapMigration {...migrateLiquidityParams} />
      </Suspense>
    </Modal>
  ) : null

  return { widget, handleOpenZapMigration, triggerClose, setTriggerClose }
}

export default useZapMigrationWidget
