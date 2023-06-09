import { RouteData } from '@0xsquid/sdk'
import { CurrencyAmount } from '@kyberswap/ks-sdk-core'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { getRouInfo } from 'pages/CrossChain/helpers'
import { useNativeBalance } from 'state/wallet/hooks'

export function useIsEnoughGas(route: RouteData | undefined) {
  const { chainId } = useActiveWeb3React()
  const nativeToken = NativeCurrencies[chainId]
  const { gasCosts, feeCosts } = getRouInfo(route)

  const ethBalance = useNativeBalance()
  const gasFee = nativeToken ? CurrencyAmount.fromRawAmount(nativeToken, gasCosts?.amount || '0') : undefined
  const crossChainFee = nativeToken ? CurrencyAmount.fromRawAmount(nativeToken, feeCosts?.amount || '0') : undefined

  return {
    gasFee,
    crossChainFee,
    isEnoughEth: nativeToken && crossChainFee && gasFee && ethBalance?.greaterThan(crossChainFee?.add(gasFee)),
  }
}
