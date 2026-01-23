import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  OnSuccessProps,
  SupportedLocale,
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
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { DEFAULT_PARSED_POSITION } from 'pages/Earns/types'
import { getNftManagerContractAddress, getTokenId, submitTransaction } from 'pages/Earns/utils'
import { getDexVersion } from 'pages/Earns/utils/position'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getCookieValue } from 'utils'

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
}

const useZapMigrationWidget = (onRefreshPosition?: () => void) => {
  const locale = useActiveLocale()
  const addTransactionWithType = useTransactionAdder()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)
  const [triggerClose, setTriggerClose] = useState(false)
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()
  const { rpc: zapMigrationRpcUrl } = useKyberSwapConfig(migrateLiquidityPureParams?.chainId as ChainId | undefined)

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, dex: Exchange, targetPoolId: string) => {
      if (!library) return

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
            signTypedData: library
              ? (account: string, typedDataJson: string) =>
                  library.send('eth_signTypedData_v4', [account.toLowerCase(), typedDataJson])
              : undefined,
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
            onClose: () => {
              setTriggerClose(true)
              setMigrateLiquidityPureParams(null)
              clearTracking()
              onRefreshPosition?.()
            },
            onBack: () => {
              setMigrateLiquidityPureParams(null)
              clearTracking()
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(migrateLiquidityPureParams.chainId as number),
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
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res
              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

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
              if (!library) return

              const dex = migrateLiquidityPureParams.to?.dexId || migrateLiquidityPureParams.from.dexId
              const isUniv2 = EARN_DEXES[dex as Exchange]?.isForkFrom === CoreProtocol.UniswapV2

              const nftId =
                data.position.positionId ||
                (isUniv2 ? account || '' : ((await getTokenId(library, data.txHash, dex)) || '').toString())

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
      txStatus,
      originalToCurrentHash,
      locale,
      addTrackedTxHash,
      clearTracking,
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
      <ZapMigration {...migrateLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapMigration, triggerClose, setTriggerClose }
}

export default useZapMigrationWidget
