import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { debounce } from 'lodash'
import { useCallback, useMemo, useRef } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { ETHER_ADDRESS, INPUT_DEBOUNCE_TIME } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { FeeConfig } from 'types/route'

type Args = {
  isSaveGas: boolean
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  feeConfig: FeeConfig | undefined
}

export const getRouteTokenAddressParam = (currency: Currency) =>
  currency.isNative
    ? isEVM(currency.chainId)
      ? ETHER_ADDRESS
      : WETH[currency.chainId as ChainId].address
    : currency.wrapped.address

const useGetRoute = (args: Args) => {
  const [trigger, result] = routeApi.useLazyGetRouteQuery()
  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const lastRequestRef = useRef<any>()

  const { isSaveGas, parsedAmount, currencyIn, currencyOut, feeConfig } = args
  const { chainId } = useActiveWeb3React()

  const dexes = useSelectedDexes()
  const { chargeFeeBy = '', feeReceiver = '', feeAmount = '' } = feeConfig || {}
  const isInBps = feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : ''

  const fetcher = useCallback(() => {
    // abort the last request
    lastRequestRef.current?.abort()

    const amountIn = parsedAmount?.quotient?.toString() || ''
    if (!currencyIn || !currencyOut || !amountIn || !parsedAmount?.currency?.equals(currencyIn)) {
      return
    }

    const tokenInAddress = getRouteTokenAddressParam(currencyIn)
    const tokenOutAddress = getRouteTokenAddressParam(currencyOut)

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

    const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}/api/v1/routes`

    const request = trigger({
      url,
      params,
    })
    lastRequestRef.current = request
  }, [
    aggregatorDomain,
    chainId,
    chargeFeeBy,
    currencyIn,
    currencyOut,
    dexes,
    feeAmount,
    feeReceiver,
    isInBps,
    isSaveGas,
    parsedAmount?.currency,
    parsedAmount?.quotient,
    trigger,
  ])

  const fetcherWithDebounce = useMemo(() => debounce(fetcher, INPUT_DEBOUNCE_TIME), [fetcher])

  const abort = useCallback(() => {
    lastRequestRef.current?.abort()
  }, [])

  return { fetcher: fetcherWithDebounce, result, abort }
}

export default useGetRoute
