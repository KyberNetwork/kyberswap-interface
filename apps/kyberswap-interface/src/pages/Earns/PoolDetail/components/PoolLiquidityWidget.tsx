import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  LiquidityWidget,
  OnSuccessProps,
  ChainId as WidgetChainId,
  PoolType as WidgetPoolType,
} from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { DEFAULT_PARSED_POSITION } from 'pages/Earns/types'
import { getNftManagerContractAddress, getTokenId, submitTransaction } from 'pages/Earns/utils'
import { getDexVersion } from 'pages/Earns/utils/position'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getCookieValue } from 'utils'

import { NoteCard } from '../styled'

interface PoolLiquidityWidgetProps {
  exchange?: string
  poolAddress?: string
  chainId?: number
  tickLower?: string | null
  tickUpper?: string | null
}

const PoolLiquidityWidget = ({ exchange, poolAddress, chainId, tickLower, tickUpper }: PoolLiquidityWidgetProps) => {
  const locale = useActiveLocale()
  const navigate = useNavigate()
  const toggleWalletModal = useWalletModalToggle()
  const { account, chainId: connectedChainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const addTransactionWithType = useTransactionAdder()
  const { trackingHandler } = useTracking()
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()
  const refCode = getCookieValue('refCode')

  const normalizedExchange = exchange as Exchange | undefined
  const normalizedChainId = chainId as ChainId | undefined
  const widgetChainId = chainId as WidgetChainId | undefined
  const poolType = normalizedExchange ? (ZAPIN_DEX_MAPPING[normalizedExchange] as WidgetPoolType) : undefined
  const { rpc: rpcUrl } = useKyberSwapConfig(normalizedChainId)

  useAccountChanged(clearTracking)

  useEffect(() => clearTracking, [clearTracking])

  const widgetProps = useMemo(() => {
    if (!normalizedExchange || !normalizedChainId || !widgetChainId || !poolAddress || !poolType) return null

    const initialTick =
      tickLower !== null &&
      tickLower !== undefined &&
      tickUpper !== null &&
      tickUpper !== undefined &&
      !Number.isNaN(Number(tickLower)) &&
      !Number.isNaN(Number(tickUpper))
        ? { tickLower: Number(tickLower), tickUpper: Number(tickUpper) }
        : undefined

    return {
      chainId: widgetChainId,
      poolAddress,
      poolType,
      dexId: normalizedExchange,
      rpcUrl,
      source: 'kyberswap-earn',
      referral: refCode,
      locale,
      initialTick,
      txStatus,
      txHashMapping: originalToCurrentHash,
      connectedAccount: {
        address: account,
        chainId: connectedChainId ?? normalizedChainId,
      },
      onConnectWallet: toggleWalletModal,
      onSwitchChain: () => changeNetwork(normalizedChainId),
      onViewPosition: async (txHash: string) => {
        if (!library) return
        await navigateToPositionAfterZap(library, txHash, normalizedChainId, normalizedExchange, poolAddress, navigate)
      },
      onEvent: (eventName: string, data?: Record<string, any>) => {
        const eventMap: Record<string, TRACKING_EVENT_TYPE> = {
          PRICE_RANGE_PRESET_SELECTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_PRESET_SELECTED,
          PRICE_RANGE_ADJUSTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_ADJUSTED,
          LIQ_TOKEN_SELECTED: TRACKING_EVENT_TYPE.LIQ_TOKEN_SELECTED,
          LIQ_AMOUNT_ENTERED: TRACKING_EVENT_TYPE.LIQ_AMOUNT_ENTERED,
          LIQ_MAX_CLICKED: TRACKING_EVENT_TYPE.LIQ_MAX_CLICKED,
          LIQ_HALF_CLICKED: TRACKING_EVENT_TYPE.LIQ_HALF_CLICKED,
          LIQ_EXISTING_POSITION_SELECTED: TRACKING_EVENT_TYPE.LIQ_EXISTING_POSITION_SELECTED,
          LIQ_MAX_SLIPPAGE_CHANGED: TRACKING_EVENT_TYPE.LIQ_MAX_SLIPPAGE_CHANGED,
          LIQ_ZAP_SUMMARY_VIEWED: TRACKING_EVENT_TYPE.LIQ_ZAP_SUMMARY_VIEWED,
          LIQ_PREVIEW_CLICKED: TRACKING_EVENT_TYPE.LIQ_PREVIEW_CLICKED,
          LIQ_ADD_FAILED: TRACKING_EVENT_TYPE.LIQ_ADD_FAILED,
          LIQ_ADD_CANCELLED: TRACKING_EVENT_TYPE.LIQ_ADD_CANCELLED,
        }
        const trackingType = eventMap[eventName]
        if (trackingType !== undefined) trackingHandler(trackingType, data)
      },
      onSuccess: async (data: OnSuccessProps) => {
        if (!library || !account) return

        const isUniv2 = EARN_DEXES[normalizedExchange]?.isForkFrom === CoreProtocol.UniswapV2
        const nftId =
          data.position.positionId ||
          (isUniv2 ? account : ((await getTokenId(library, data.txHash, normalizedExchange)) || '').toString())

        const dexVersion = getDexVersion(normalizedExchange)
        const contract = getNftManagerContractAddress(normalizedExchange, normalizedChainId)

        updateUnfinalizedPosition(
          {
            ...DEFAULT_PARSED_POSITION,
            positionId: !isUniv2 ? `${contract}-${nftId}` : data.position.pool.address,
            tokenId: !isUniv2 ? nftId : '-1',
            chain: {
              id: normalizedChainId,
              name: NETWORKS_INFO[normalizedChainId].name,
              logo: NETWORKS_INFO[normalizedChainId].icon,
            },
            dex: {
              id: normalizedExchange,
              name: EARN_DEXES[normalizedExchange].name,
              logo: data.position.dexLogo,
              version: dexVersion,
            },
            pool: {
              ...DEFAULT_PARSED_POSITION.pool,
              address: data.position.pool.address,
              fee: data.position.pool.fee,
              isUniv2,
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
          },
          account,
        )
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

        if (additionalInfo?.type === 'zap') {
          addTransactionWithType({
            hash: txHash,
            type: TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
            extraInfo: {
              pool: additionalInfo.pool || '',
              positionId: '',
              tokensIn: additionalInfo.tokensIn || [],
              dexLogoUrl: additionalInfo.dexLogo,
              dex: normalizedExchange,
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
              summary: additionalInfo.dexName || EARN_DEXES[normalizedExchange].name,
            },
          })
        }

        addTrackedTxHash(txHash)
        return txHash
      },
      signTypedData: library
        ? (account: string, typedDataJson: string) =>
            library.send('eth_signTypedData_v4', [account.toLowerCase(), typedDataJson])
        : undefined,
    }
  }, [
    account,
    addTrackedTxHash,
    addTransactionWithType,
    changeNetwork,
    connectedChainId,
    library,
    locale,
    navigate,
    normalizedChainId,
    normalizedExchange,
    originalToCurrentHash,
    poolAddress,
    poolType,
    refCode,
    rpcUrl,
    tickLower,
    tickUpper,
    toggleWalletModal,
    trackingHandler,
    txStatus,
    widgetChainId,
  ])

  if (!normalizedExchange || !normalizedChainId || !poolAddress || !poolType || !widgetProps) {
    return (
      <NoteCard $warning>
        Missing or unsupported pool route params. This page needs `exchange`, `poolChainId`, and `poolAddress`.
      </NoteCard>
    )
  }

  return <LiquidityWidget {...widgetProps} />
}

export default PoolLiquidityWidget
