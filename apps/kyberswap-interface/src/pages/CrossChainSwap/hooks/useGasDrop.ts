import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { type Address, formatUnits, isAddress } from 'viem'

import { wagmiConfig } from 'components/Web3Provider'
import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { useTokenPrices } from 'state/tokenPrices/hooks'

export const useGasDrop = () => {
  const { gasDropSupported, toChainId, recipient } = useCrossChainSwap()
  const chainId = gasDropSupported ? (toChainId as ChainId) : undefined
  const native = chainId ? NativeCurrencies[chainId] : undefined
  const prices = useTokenPrices(chainId ? [ETHER_ADDRESS] : [], chainId)
  const { data: balance, isError } = useQuery({
    queryKey: ['gas-drop-recipient-balance', chainId, recipient],
    enabled: !!chainId && isAddress(recipient),
    queryFn: async () => {
      const client = getPublicClient(wagmiConfig, { chainId })
      if (!client) throw new Error('Missing destination client')
      return client.getBalance({ address: recipient as Address })
    },
    refetchInterval: 15_000,
    retry: false,
  })
  const price = prices[ETHER_ADDRESS.toLowerCase()]
  const balanceUsd =
    balance !== undefined && native && price > 0 ? Number(formatUnits(balance, native.decimals)) * price : undefined
  const lowGas = !isError && (balance === 0n || (balanceUsd !== undefined && balanceUsd < 2))
  return { native, lowGas }
}
