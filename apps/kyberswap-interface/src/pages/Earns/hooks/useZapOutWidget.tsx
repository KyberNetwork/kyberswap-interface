import { ChainId } from '@kyberswap/ks-sdk-core'
import { OnSuccessProps, ZapOut, ChainId as ZapOutChainId, PoolType as ZapOutDex } from '@kyberswap/zap-out-widgets'
import '@kyberswap/zap-out-widgets/dist/style.css'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { submitTransaction } from 'pages/Earns/utils'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getCookieValue } from 'utils'

export interface ZapOutInfo {
  position: {
    dex: Exchange
    chainId: number
    poolAddress: string
    id: string
  }
}

const zapOutDexMapping: Record<Exchange, ZapOutDex> = {
  [Exchange.DEX_UNISWAPV3]: ZapOutDex.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: ZapOutDex.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: ZapOutDex.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: ZapOutDex.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: ZapOutDex.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: ZapOutDex.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: ZapOutDex.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: ZapOutDex.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: ZapOutDex.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: ZapOutDex.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: ZapOutDex.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL_ALPHA]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_DYNAMIC]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_BREVIS]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_LO]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_AERODROMECL]: ZapOutDex.DEX_AERODROMECL,
}

const useZapOutWidget = (
  onRefreshPosition?: (props: CheckClosedPositionParams) => void,
  explorePoolsEnabled?: boolean,
) => {
  const { trackingHandler } = useTracking()
  const addTransactionWithType = useTransactionAdder()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [zapOutPureParams, setZapOutPureParams] = useState<{
    positionId: string
    poolType: ZapOutDex
    poolAddress: string
    chainId: ZapOutChainId
    mode?: 'zapOut' | 'withdrawOnly'
    dexId: Exchange
  } | null>(null)
  const locale = useActiveLocale()
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()
  const { rpc: zapOutRpcUrl } = useKyberSwapConfig(zapOutPureParams?.chainId as ChainId | undefined)

  const handleZapOutSuccess = useCallback(
    (data: OnSuccessProps) => {
      if (!zapOutPureParams) return

      const isManualRemove = data.mode === 'withdrawOnly'
      const tokenPair = `${data.token0.symbol}/${data.token1.symbol}`
      trackingHandler(
        isManualRemove ? TRACKING_EVENT_TYPE.EARN_MANUAL_REMOVE_COMPLETED : TRACKING_EVENT_TYPE.EARN_ZAP_OUT_COMPLETED,
        {
          position_id: data.positionId,
          chain: NETWORKS_INFO[zapOutPureParams.chainId as unknown as ChainId]?.name,
          pool: data.pool.address,
          token_pair: tokenPair,
          tx_hash: data.txHash,
          completion_time_ms: Date.now(),
          ...(isManualRemove
            ? {
                remove_amount_token0: data.tokensOut[0]?.amount,
                remove_amount_token1: data.tokensOut[1]?.amount,
              }
            : {
                output_token_symbol: data.tokensOut[0]?.symbol,
              }),
        },
      )
    },
    [trackingHandler, zapOutPureParams],
  )

  const zapOutParams = useMemo(
    () =>
      zapOutPureParams
        ? {
            ...zapOutPureParams,
            source: 'kyberswap-earn',
            rpcUrl: zapOutRpcUrl,
            signTypedData: library
              ? (account: string, typedDataJson: string) =>
                  library.send('eth_signTypedData_v4', [account.toLowerCase(), typedDataJson])
              : undefined,
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapOutChainId,
            },
            txStatus,
            txHashMapping: originalToCurrentHash,
            locale,
            onClose: () => {
              setTimeout(() => {
                const foundEntry = Object.entries(zapOutDexMapping).find(
                  ([_, zapOutDex]) => zapOutDex === zapOutPureParams.poolType,
                )
                const dex = foundEntry?.[0] as Exchange

                if (!dex || !Object.values(Exchange).includes(dex)) return

                onRefreshPosition?.({
                  tokenId: zapOutPureParams.positionId,
                  dex,
                  poolAddress: zapOutPureParams.poolAddress,
                  chainId: zapOutPureParams.chainId as unknown as ChainId,
                })
              }, 500)
              setZapOutPureParams(null)
              clearTracking()
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (
              txData: { from: string; to: string; value: string; data: string },
              additionalInfo?:
                | {
                    type: 'zap'
                    pool: string
                    dexLogo: string
                    tokensOut: Array<{ symbol: string; amount: string; logoUrl?: string }>
                  }
                | {
                    type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all'
                    tokenAddress: string
                    tokenSymbol?: string
                    dexName?: string
                  },
            ) => {
              const isManualRemove = zapOutPureParams.mode === 'withdrawOnly'
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res
              if (!txHash || error) {
                trackingHandler(
                  isManualRemove
                    ? TRACKING_EVENT_TYPE.EARN_MANUAL_REMOVE_FAILED
                    : TRACKING_EVENT_TYPE.EARN_ZAP_OUT_FAILED,
                  {
                    position_id: zapOutPureParams.positionId,
                    chain: NETWORKS_INFO[zapOutPureParams.chainId as unknown as ChainId]?.name,
                    pool: zapOutPureParams.poolAddress,
                    failure_reason: error?.message || 'Transaction failed',
                    completion_time_ms: Date.now(),
                  },
                )
                throw new Error(error?.message || 'Transaction failed')
              }

              const dex = zapOutPureParams.dexId
              if (additionalInfo?.type === 'zap' && dex) {
                addTransactionWithType({
                  hash: txHash,
                  type: TRANSACTION_TYPE.EARN_REMOVE_LIQUIDITY,
                  extraInfo: {
                    pool: additionalInfo.pool || '',
                    dexLogoUrl: additionalInfo.dexLogo,
                    positionId: zapOutPureParams.positionId,
                    tokensOut: additionalInfo.tokensOut || [],
                    dex,
                  },
                })

                const tokensOut = additionalInfo.tokensOut || []
                trackingHandler(
                  isManualRemove
                    ? TRACKING_EVENT_TYPE.EARN_MANUAL_REMOVE_INITIATED
                    : TRACKING_EVENT_TYPE.EARN_ZAP_OUT_INITIATED,
                  {
                    position_id: zapOutPureParams.positionId,
                    chain: NETWORKS_INFO[zapOutPureParams.chainId as unknown as ChainId]?.name,
                    pool: zapOutPureParams.poolAddress,
                    tx_hash: txHash,
                    ...(isManualRemove
                      ? {
                          remove_amount_token0: tokensOut[0]?.amount,
                          remove_amount_token1: tokensOut[1]?.amount,
                        }
                      : {
                          output_token_symbol: tokensOut[0]?.symbol,
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
                    summary: additionalInfo.dexName || EARN_DEXES[zapOutPureParams.dexId].name,
                  },
                })
              }

              // Track all transactions for replacement detection
              addTrackedTxHash(txHash)
              return txHash
            },
            onExplorePools: explorePoolsEnabled
              ? () => {
                  navigate(APP_PATHS.EARN_POOLS)
                }
              : undefined,
            onSuccess: handleZapOutSuccess,
          }
        : null,
    [
      zapOutPureParams,
      zapOutRpcUrl,
      library,
      refCode,
      account,
      chainId,
      txStatus,
      originalToCurrentHash,
      locale,
      toggleWalletModal,
      explorePoolsEnabled,
      clearTracking,
      onRefreshPosition,
      changeNetwork,
      addTrackedTxHash,
      trackingHandler,
      handleZapOutSuccess,
      addTransactionWithType,
      navigate,
    ],
  )

  const handleOpenZapOut = ({ position, mode }: ZapOutInfo & { mode?: 'zapOut' | 'withdrawOnly' }) => {
    const poolType = zapOutDexMapping[position.dex]
    if (!poolType) {
      notify(
        {
          title: `Protocol ${position.dex} is not supported!`,
          type: NotificationType.ERROR,
        },
        5_000,
      )
      return
    }

    setZapOutPureParams({
      poolType,
      chainId: position.chainId as ZapOutChainId,
      poolAddress: position.poolAddress,
      positionId: position.id,
      mode,
      dexId: position.dex,
    })
  }

  useAccountChanged(() => {
    setZapOutPureParams(null)
    clearTracking()
  })

  const widget = zapOutParams ? (
    <Modal
      isOpen
      mobileFullWidth
      maxWidth={760}
      width={'760px'}
      onDismiss={() => {
        setZapOutPureParams(null)
        clearTracking()
      }}
    >
      <ZapOut {...zapOutParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapOut }
}

export default useZapOutWidget
