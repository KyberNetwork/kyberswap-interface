import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { CROSS_CHAIN_CONFIG } from 'constants/env'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCrossChainState } from 'state/crossChain/hooks'
import { RouteData } from 'state/crossChain/reducer'
import { useNativeBalance } from 'state/wallet/hooks'

export function useIsEnoughGas(route: RouteData | undefined) {
  const { chainId, account } = useActiveWeb3React()
  const nativeToken = NativeCurrencies[chainId]
  const [{ formatRoute }] = useCrossChainState()
  const { gasCosts, feeCosts } = formatRoute

  const ethBalance = useNativeBalance()
  const gasFee = nativeToken ? CurrencyAmount.fromRawAmount(nativeToken, gasCosts?.amount || '0') : undefined
  const crossChainFee = nativeToken ? CurrencyAmount.fromRawAmount(nativeToken, feeCosts?.amount || '0') : undefined

  return {
    gasFee,
    crossChainFee,
    gasRefund: crossChainFee
      ? crossChainFee.multiply(JSBI.BigInt(CROSS_CHAIN_CONFIG.GAS_REFUND)).divide(JSBI.BigInt(100))
      : undefined,
    isEnoughEth:
      !route || !account
        ? true
        : nativeToken && crossChainFee && gasFee && ethBalance?.greaterThan(crossChainFee?.add(gasFee)),
  }
}
