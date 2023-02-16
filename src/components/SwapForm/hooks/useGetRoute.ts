import { Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { ETHER_ADDRESS, INPUT_DEBOUNCE_TIME } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { FeeConfig } from 'types/route'

type Args = {
  isSaveGas: boolean
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  feeConfig: FeeConfig | undefined
}
const useGetRoute = (args: Args) => {
  const [trigger, result] = routeApi.useLazyGetRouteQuery()

  const { isSaveGas, parsedAmount, currencyIn, currencyOut, feeConfig } = args
  const { chainId } = useActiveWeb3React()
  const chainSlug = NETWORKS_INFO[chainId].ksSettingRoute

  const amountIn = useDebounce(parsedAmount?.quotient?.toString() || '', INPUT_DEBOUNCE_TIME)

  const dexes = useSelectedDexes()
  const { chargeFeeBy = '', feeReceiver = '', feeAmount = '' } = feeConfig || {}
  const isInBps = feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : ''

  const fetcher = useCallback(async () => {
    if (!currencyIn || !currencyOut || !amountIn) {
      return undefined
    }

    const tokenInAddress = currencyIn.isNative
      ? isEVM(currencyIn.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyIn.chainId].address
      : currencyIn.wrapped.address

    const tokenOutAddress = currencyOut.isNative
      ? isEVM(currencyOut.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyOut.chainId].address
      : currencyOut.wrapped.address

    const params: GetRouteParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      saveGas: String(isSaveGas),
      includedSources: dexes,
      gasInclude: 'true', // default
      gasPrice: '', // default

      feeAmount,
      chargeFeeBy,
      isInBps,
      feeReceiver,
    }

    ;(Object.keys(params) as (keyof typeof params)[]).forEach(key => {
      if (!params[key]) {
        delete params[key]
      }
    })

    trigger({
      params,
      chainSlug,
    })

    return undefined
  }, [
    amountIn,
    chainSlug,
    chargeFeeBy,
    currencyIn,
    currencyOut,
    dexes,
    feeAmount,
    feeReceiver,
    isInBps,
    isSaveGas,
    trigger,
  ])

  return { fetcher, result }
}

export default useGetRoute
