import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  ChainId,
  NATIVE_TOKEN_ADDRESS,
  POOL_CATEGORY,
  PoolType,
  Token,
} from '@kyber/schema'
import { WidgetMode, LiquidityWidget as ZapWidget } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import axios, { AxiosError } from 'axios'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING, getDexFromPoolType } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

type CreateConfig = {
  chainId: number
  protocol: Exchange
  token0: Token
  token1: Token
  poolCategory: POOL_CATEGORY
  fee: number
}

type WidgetConfig = CreateConfig & {
  mode: WidgetMode
  poolAddress?: string
}

const sortTokensByAddress = (tokenA: Token, tokenB: Token): [Token, Token] => {
  const nativeAddress = NATIVE_TOKEN_ADDRESS.toLowerCase()
  const addressA = tokenA.address.toLowerCase()
  const addressB = tokenB.address.toLowerCase()

  if (addressA === nativeAddress) return [tokenA, tokenB]
  if (addressB === nativeAddress) return [tokenB, tokenA]

  return addressA < addressB ? [tokenA, tokenB] : [tokenB, tokenA]
}

const useZapCreatePoolWidget = () => {
  const locale = useActiveLocale()
  const toggleWalletModal = useWalletModalToggle()
  const { account, chainId: connectedChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { library } = useWeb3React()
  const notify = useNotify()
  const navigate = useNavigate()
  const addTransactionWithType = useTransactionAdder()

  const [config, setConfig] = useState<WidgetConfig | null>(null)

  const { rpc: defaultRpc } = useKyberSwapConfig(config?.chainId)

  const handleClose = useCallback(() => {
    setConfig(null)
  }, [])

  useAccountChanged(handleClose)

  const fetchExistingPoolAddress = useCallback(
    async (input: CreateConfig) => {
      const configFee = input.fee * 10_000
      const tickSpacing = Math.max(Math.round((2 * configFee) / 100), 1)
      const poolType = ZAPIN_DEX_MAPPING[input.protocol]
      return axios
        .get(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[input.chainId as ChainId]}/api/v1/create/route`, {
          params: {
            dex: poolType,
            'pool.tokens': `${input.token0.address},${input.token1.address}`,
            'pool.uniswap_v4_config.fee': configFee,
            'pool.uniswap_v4_config.tick_spacing': tickSpacing,
            'zap_in.position.tick_lower': tickSpacing * 1,
            'zap_in.position.tick_upper': tickSpacing * 10,
            'zap_in.tokens_in': input.token0.address,
            'zap_in.amounts_in': 10 ** (input.token0.decimals - 1),
            ...(poolType === PoolType.DEX_UNISWAP_V4_FAIRFLOW && {
              'pool.uniswap_v4_config.hooks': '0x4440854B2d02C57A0Dc5c58b7A884562D875c0c4',
            }),
          },
        })
        .then(() => undefined)
        .catch((error: AxiosError<{ message: string }>) => {
          const message = error.response?.data.message || ''
          if (message.startsWith('invalid token')) {
            notify({
              type: NotificationType.ERROR,
              title: 'Pair is not supported',
            })
            throw error
          }
          const matches = message.match(/pool already exists: (0x[a-fA-F0-9]+)/)
          return matches?.[1]
        })
    },
    [notify],
  )

  const handleNavigateToPosition = useCallback(
    async (txHash: string, config: WidgetConfig) => {
      if (!library || !config) return
      const poolAddress = await fetchExistingPoolAddress(config)

      const poolType = ZAPIN_DEX_MAPPING[config.protocol]
      const dex = getDexFromPoolType(poolType)

      if (!dex || !poolAddress) return

      navigateToPositionAfterZap(library, txHash, config.chainId, dex, poolAddress, navigate)
    },
    [library, navigate, fetchExistingPoolAddress],
  )

  const widgetProps = useMemo(() => {
    if (!config) return null

    return {
      chainId: config.chainId,
      poolType: ZAPIN_DEX_MAPPING[config.protocol],
      connectedAccount: {
        address: account,
        chainId: connectedChainId ?? config.chainId,
      },
      poolAddress: config.poolAddress ?? '',
      rpcUrl: defaultRpc,
      mode: config.mode,
      createPoolConfig:
        config.mode === WidgetMode.CREATE
          ? {
              token0: config.token0,
              token1: config.token1,
              poolCategory: config.poolCategory,
              fee: config.fee,
            }
          : undefined,
      source: 'kyberswap-earn',
      locale,
      onViewPosition: (txHash: string) => {
        handleNavigateToPosition(txHash, config)
        handleClose()
      },
      onClose: () => {
        handleClose()
      },
      onConnectWallet: toggleWalletModal,
      onSwitchChain: () => changeNetwork(config.chainId),
      onSubmitTx: async (
        txData: { from: string; to: string; data: string; value: string; gasLimit: string },
        additionalInfo?: {
          tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>
          pool: string
          dexLogo: string
        },
      ) => {
        const res = await submitTransaction({ library, txData })
        const { txHash, error } = res

        if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

        if (config && additionalInfo) {
          addTransactionWithType({
            hash: txHash,
            type: TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
            extraInfo: {
              pool: additionalInfo.pool,
              tokensIn: additionalInfo.tokensIn,
              dexLogoUrl: additionalInfo.dexLogo,
              dex: config.protocol,
            },
          })
        }

        return res.txHash
      },
    }
  }, [
    account,
    addTransactionWithType,
    changeNetwork,
    config,
    connectedChainId,
    defaultRpc,
    handleClose,
    handleNavigateToPosition,
    library,
    locale,
    toggleWalletModal,
  ])

  const widget = widgetProps ? (
    <Modal isOpen mobileFullWidth maxWidth={900} width={'900px'} onDismiss={handleClose}>
      <ZapWidget {...widgetProps} />
    </Modal>
  ) : null

  const openWidget = useCallback(
    async (newConfig: CreateConfig) => {
      let mode: WidgetMode = WidgetMode.CREATE
      let poolAddress: string | undefined

      const existingPoolAddress = await fetchExistingPoolAddress(newConfig)
      if (existingPoolAddress) {
        mode = WidgetMode.IN
        poolAddress = existingPoolAddress
      }
      const [token0, token1] = sortTokensByAddress(newConfig.token0, newConfig.token1)
      setConfig({
        ...newConfig,
        token0,
        token1,
        mode,
        poolAddress,
      })
    },
    [fetchExistingPoolAddress],
  )

  return {
    widget,
    open: openWidget,
  }
}

export default useZapCreatePoolWidget
