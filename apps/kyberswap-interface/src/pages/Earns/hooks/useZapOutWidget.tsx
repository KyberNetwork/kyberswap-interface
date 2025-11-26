import { ChainId } from '@kyberswap/ks-sdk-core'
import { TxStatus, ZapOut, ChainId as ZapOutChainId, PoolType as ZapOutDex } from '@kyberswap/zap-out-widgets'
import '@kyberswap/zap-out-widgets/dist/style.css'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import { submitTransaction } from 'pages/Earns/utils'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
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
}

const getDexFromPoolType = (poolType: ZapOutDex) => {
  const dexIndex = Object.values(zapOutDexMapping).findIndex(
    (item, index) => item === poolType && EARN_DEXES[Object.keys(zapOutDexMapping)[index] as Exchange],
  )
  if (dexIndex === -1) {
    console.error('Cannot find dex')
    return
  }
  const dex = Object.keys(zapOutDexMapping)[dexIndex] as Exchange

  return dex
}

const useZapOutWidget = (
  onRefreshPosition?: (props: CheckClosedPositionParams) => void,
  explorePoolsEnabled?: boolean,
) => {
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions()
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
  } | null>(null)
  const locale = useActiveLocale()
  const [zapTxHash, setZapTxHash] = useState<string[]>([])
  const { rpc: zapOutRpcUrl } = useKyberSwapConfig(zapOutPureParams?.chainId as ChainId | undefined)

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

  const zapOutParams = useMemo(
    () =>
      zapOutPureParams
        ? {
            ...zapOutPureParams,
            source: 'kyberswap-earn',
            rpcUrl: zapOutRpcUrl,
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapOutChainId,
            },
            zapStatus,
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
              setZapTxHash([])
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (
              txData: { from: string; to: string; value: string; data: string },
              additionalInfo?: {
                pool: string
                dexLogo: string
                tokensOut: Array<{ symbol: string; amount: string; logoUrl?: string }>
              },
            ) => {
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res
              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

              const dex = getDexFromPoolType(zapOutPureParams.poolType)
              if (additionalInfo && dex) {
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
              }

              setZapTxHash(prev => [...prev, txHash])
              return txHash
            },
            onExplorePools: explorePoolsEnabled
              ? () => {
                  navigate(APP_PATHS.EARN_POOLS)
                }
              : undefined,
          }
        : null,
    [
      account,
      chainId,
      changeNetwork,
      library,
      toggleWalletModal,
      zapOutPureParams,
      zapOutRpcUrl,
      refCode,
      onRefreshPosition,
      addTransactionWithType,
      zapStatus,
      locale,
      navigate,
      explorePoolsEnabled,
    ],
  )

  const handleOpenZapOut = ({ position }: ZapOutInfo) => {
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
    })
  }

  useAccountChanged(() => {
    setZapOutPureParams(null)
    setZapTxHash([])
  })

  const widget = zapOutParams ? (
    <Modal
      isOpen
      mobileFullWidth
      maxWidth={760}
      width={'760px'}
      onDismiss={() => {
        setZapOutPureParams(null)
        setZapTxHash([])
      }}
    >
      <ZapOut {...zapOutParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapOut }
}

export default useZapOutWidget
