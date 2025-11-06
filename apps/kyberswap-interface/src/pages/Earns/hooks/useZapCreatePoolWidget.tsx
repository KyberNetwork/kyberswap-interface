import { Token } from '@kyber/schema'
import { SupportedLocale, WidgetMode, LiquidityWidget as ZapWidget } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { useCallback, useMemo, useState } from 'react'
import { useLazyPoolsExplorerQuery } from 'services/zapEarn'

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

  const [fetchPoolsExplorer] = useLazyPoolsExplorerQuery()
  const [config, setConfig] = useState<WidgetConfig | null>(null)

  const { rpc: defaultRpc } = useKyberSwapConfig(config?.chainId)

  const handleClose = useCallback(() => {
    setConfig(null)
  }, [])

  useAccountChanged(handleClose)

  const fetchExistingPoolAddress = useCallback(
    async (input: CreateConfig) => {
      const [targetToken0, targetToken1] = [input.token0, input.token1].map(token => token.address.toLowerCase()).sort()

      for (const token of [input.token0, input.token1]) {
        const response = await fetchPoolsExplorer({
          chainId: input.chainId,
          protocol: input.protocol,
          interval: '24h',
          page: 1,
          limit: 10,
          q: token.address,
        }).unwrap()

        const matchedPool = (response?.data?.pools ?? []).find(pool => {
          const [poolToken0, poolToken1] = pool.tokens.map(token => token.address.toLowerCase()).sort()
          return poolToken0 === targetToken0 && poolToken1 === targetToken1 && pool.feeTier === input.fee
        })
        return matchedPool?.address
      }
      return undefined
    },
    [fetchPoolsExplorer],
  )

  const widgetProps = useMemo(() => {
    if (!config) return null

    const poolType = ZAPIN_DEX_MAPPING[config.protocol]
    if (!poolType) return null

    return {
      chainId: config.chainId,
      poolType: poolType,
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
              fee: config.fee,
            }
          : undefined,
      source: 'kyberswap-earn',
      locale: locale as SupportedLocale,
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
        mode = WidgetMode.EXISTING
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
