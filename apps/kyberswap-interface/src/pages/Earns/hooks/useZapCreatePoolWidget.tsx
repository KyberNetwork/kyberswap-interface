import { API_URLS, CHAIN_ID_TO_CHAIN, ChainId, POOL_CATEGORY, PoolType, Token } from '@kyber/schema'
import { WidgetMode, LiquidityWidget as ZapWidget } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import axios, { AxiosError } from 'axios'
import { useCallback, useMemo, useState } from 'react'

import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { submitTransaction } from 'pages/Earns/utils'
import { useKyberSwapConfig, useWalletModalToggle } from 'state/application/hooks'

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

const useZapCreatePoolWidget = () => {
  const locale = useActiveLocale()
  const toggleWalletModal = useWalletModalToggle()
  const { account, chainId: connectedChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { library } = useWeb3React()

  const [config, setConfig] = useState<WidgetConfig | null>(null)

  const { rpc: defaultRpc } = useKyberSwapConfig(config?.chainId)

  const handleClose = useCallback(() => {
    setConfig(null)
  }, [])

  useAccountChanged(handleClose)

  const fetchExistingPoolAddress = useCallback(async (input: CreateConfig) => {
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
        const matches = error.response?.data.message.match(/pool already exists: (0x[a-fA-F0-9]+)/)
        return matches?.[1]
      })
  }, [])

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
      onClose: handleClose,
      onConnectWallet: toggleWalletModal,
      onSwitchChain: () => changeNetwork(config.chainId),
      onSubmitTx: async (txData: { from: string; to: string; data: string; value: string; gasLimit: string }) => {
        if (!library) throw new Error('Wallet not connected')
        const res = await submitTransaction({ library, txData })
        if (!res.txHash || res.error) throw new Error(res.error?.message || 'Transaction failed')
        return res.txHash
      },
    }
  }, [account, changeNetwork, config, connectedChainId, defaultRpc, handleClose, library, locale, toggleWalletModal])

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
      setConfig({
        ...newConfig,
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
