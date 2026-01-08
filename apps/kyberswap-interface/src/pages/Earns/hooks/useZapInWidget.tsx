import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  OnSuccessProps,
  SupportedLocale,
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
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ZAPIN_DEX_MAPPING, getDexFromPoolType } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { SmartExitParams } from 'pages/Earns/hooks/useSmartExitWidget'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { DEFAULT_PARSED_POSITION, ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContractAddress, getTokenId, submitTransaction } from 'pages/Earns/utils'
import { getDexVersion } from 'pages/Earns/utils/position'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getCookieValue } from 'utils'

interface AddLiquidityPureParams {
  poolAddress: string
  chainId: ZapInChainId
  poolType: ZapInPoolType
  dexId: Exchange
  positionId?: string
  initialTick?: { tickUpper: number; tickLower: number }
}

interface AddLiquidityParams extends AddLiquidityPureParams {
  source: string
  rpcUrl?: string
  connectedAccount: {
    address?: string | undefined
    chainId: number
  }
  locale?: SupportedLocale
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
    dex: Exchange
  }
  positionId?: string
  initialTick?: { tickUpper: number; tickLower: number }
}

const useZapInWidget = ({
  onOpenZapMigration,
  onRefreshPosition,
  triggerClose,
  setTriggerClose,
  onOpenSmartExit,
}: {
  onOpenZapMigration: (props: ZapMigrationInfo) => void
  onRefreshPosition?: () => void
  triggerClose?: boolean
  setTriggerClose?: (value: boolean) => void
  onOpenSmartExit?: (params: SmartExitParams | ParsedPosition | undefined) => void
}) => {
  const locale = useActiveLocale()
  const addTransactionWithType = useTransactionAdder()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()

  const [addLiquidityPureParams, setAddLiquidityPureParams] = useState<AddLiquidityPureParams | null>(null)
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()
  const { rpc: zapInRpcUrl } = useKyberSwapConfig(addLiquidityPureParams?.chainId as ChainId | undefined)

  const handleCloseZapInWidget = useCallback(() => {
    searchParams.delete('exchange')
    searchParams.delete('poolChainId')
    searchParams.delete('poolAddress')
    setSearchParams(searchParams)
    setAddLiquidityPureParams(null)
    clearTracking()
  }, [searchParams, setSearchParams, clearTracking])

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, dex: Exchange, poolId: string) => {
      if (!library) return

      navigateToPositionAfterZap(library, txHash, chainId, dex, poolId, navigate)
    },
    [library, navigate],
  )

  const handleOpenZapIn = ({ pool, positionId, initialTick }: ZapInInfo) => {
    const dex = ZAPIN_DEX_MAPPING[pool.dex]
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
      dexId: pool.dex,
    })
  }

  const handleOpenZapMigration = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
      initialSlippage?: number,
    ) => {
      if (!addLiquidityPureParams) return

      const dex = getDexFromPoolType(addLiquidityPureParams.poolType)
      if (!dex) return
      onOpenZapMigration({
        from: {
          poolType: position.exchange as Exchange,
          poolAddress: position.poolId,
          positionId: position.positionId.toString(),
          dexId: position.exchange as Exchange,
        },
        to: {
          poolAddress: addLiquidityPureParams.poolAddress,
          positionId: addLiquidityPureParams.positionId,
          poolType: dex,
          dexId: addLiquidityPureParams.dexId,
        },
        chainId: addLiquidityPureParams.chainId,
        initialTick,
        initialSlippage,
      })
    },
    [addLiquidityPureParams, onOpenZapMigration],
  )

  // Check if smart exit is supported for current dex and chain
  const isSmartExitSupported = useMemo(() => {
    if (!addLiquidityPureParams) return false

    const { chainId, poolType } = addLiquidityPureParams
    const dex = getDexFromPoolType(poolType)
    if (!dex) return false

    const dexSupportsSmartExit = !!EARN_DEXES[dex].smartExitDexType
    const chainSupportsSmartExit = EARN_CHAINS[chainId as unknown as EarnChain]?.smartExitSupported

    return dexSupportsSmartExit && chainSupportsSmartExit
  }, [addLiquidityPureParams])

  const addLiquidityParams: AddLiquidityParams | null = useMemo(
    () =>
      addLiquidityPureParams
        ? {
            ...addLiquidityPureParams,
            source: 'kyberswap-earn',
            rpcUrl: zapInRpcUrl,
            signTypedData: library
              ? (account: string, typedDataJson: string) =>
                  library.send('eth_signTypedData_v4', [account.toLowerCase(), typedDataJson])
              : undefined,
            referral: refCode,
            txStatus,
            txHashMapping: originalToCurrentHash,
            locale,
            onViewPosition: (txHash: string) => {
              const { chainId, dexId, poolAddress } = addLiquidityPureParams
              handleCloseZapInWidget()
              handleNavigateToPosition(txHash, chainId, dexId, poolAddress)
            },
            onSetUpSmartExit:
              isSmartExitSupported && onOpenSmartExit
                ? (params: { tokenId: string; chainId: ZapInChainId; poolType: ZapInPoolType } | undefined) => {
                    if (!params) {
                      onOpenSmartExit(undefined)
                      return
                    }

                    // Pass SmartExitParams to open modal immediately with loading state
                    onOpenSmartExit({
                      tokenId: params.tokenId,
                      chainId: params.chainId,
                      poolType: params.poolType,
                    })
                    handleCloseZapInWidget()
                  }
                : undefined,
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

              const dex = getDexFromPoolType(data.position.poolType)
              if (!dex) return

              const isUniv2 = EARN_DEXES[dex as Exchange]?.isForkFrom === CoreProtocol.UniswapV2

              const nftId =
                data.position.positionId ||
                (isUniv2 ? account || '' : ((await getTokenId(library, data.txHash, dex)) || '').toString())

              const dexVersion = getDexVersion(dex)
              const contract = getNftManagerContractAddress(dex, chainId)

              updateUnfinalizedPosition({
                ...DEFAULT_PARSED_POSITION,
                id: !isUniv2 ? `${contract}-${nftId}` : data.position.pool.address,
                tokenId: !isUniv2 ? nftId : '-1',
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
            onSubmitTx: async (
              txData: { from: string; to: string; data: string; value: string; gasLimit: string },
              additionalInfo?:
                | {
                    type: 'zap'
                    tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>
                    pool: string
                    dexLogo: string
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

              const dex = getDexFromPoolType(addLiquidityPureParams.poolType)
              if (additionalInfo?.type === 'zap' && dex) {
                addTransactionWithType({
                  hash: txHash,
                  type: addLiquidityPureParams.positionId
                    ? TRANSACTION_TYPE.EARN_INCREASE_LIQUIDITY
                    : TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
                  extraInfo: {
                    pool: additionalInfo.pool || '',
                    positionId: addLiquidityPureParams.positionId || '',
                    tokensIn: additionalInfo.tokensIn || [],
                    dexLogoUrl: additionalInfo.dexLogo,
                    dex,
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
                    summary: additionalInfo.dexName || EARN_DEXES[addLiquidityPureParams.dexId].name,
                  },
                })
              }

              // Track all transactions for replacement detection
              addTrackedTxHash(txHash)
              return txHash
            },
          }
        : null,
    [
      account,
      addLiquidityPureParams,
      addTrackedTxHash,
      addTransactionWithType,
      chainId,
      changeNetwork,
      handleCloseZapInWidget,
      handleNavigateToPosition,
      handleOpenZapMigration,
      isSmartExitSupported,
      library,
      locale,
      onOpenSmartExit,
      onRefreshPosition,
      originalToCurrentHash,
      refCode,
      toggleWalletModal,
      txStatus,
      zapInRpcUrl,
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
    <Modal isOpen mobileFullWidth maxWidth={840} width={'840px'} onDismiss={handleCloseZapInWidget}>
      <ZapIn {...addLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapIn }
}

export default useZapInWidget
