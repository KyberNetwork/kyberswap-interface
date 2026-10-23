import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { AGGREGATOR_API_PATHS, fetchRoute } from 'services/route'
import { enrichRouteResponse } from 'services/route/enrichRouteResponse'
import { GetRouteParams } from 'services/route/types/getRoute'

import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import useGetSwapFeeConfig, { SwapFeeConfig } from 'components/SwapForm/hooks/useGetSwapFeeConfig'
import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { AGGREGATOR_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { useSessionInfo } from 'state/authen/hooks'
import { useAppDispatch } from 'state/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { ChargeFeeBy } from 'types/route'
import { RouteSide, routeAmountIn, routeTokenAddress, routeTokenDecimals } from 'utils/nativeErc20'
import { SAFE_APP_CLIENT_ID, isInSafeApp } from 'utils/safeApp'

const SWAP_FEE_RECEIVER_ADDRESS = '0x1111115af63bfbcc151e5753e2ea1a29c79d2f01'
const SAFE_APP_FEE_RECEIVER_ADDRESS = '0x1111115e73933b2168F41112F828EbD2FC7c5d05'

export type ArgsRouteRequest = {
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  customChain?: ChainId
  clientId?: string
}

export const getRouteTokenAddressParam = (currency: Currency, side: RouteSide) => routeTokenAddress(currency, side)

const getFeeConfigParams = (
  swapFeeConfig: SwapFeeConfig | undefined,
  tokenIn: string,
  tokenOut: string,
): Pick<GetRouteParams, 'feeAmount' | 'feeReceiver' | 'isInBps' | 'chargeFeeBy'> => {
  if (!swapFeeConfig) {
    return {
      feeAmount: '',
      chargeFeeBy: ChargeFeeBy.NONE,
      isInBps: '',
      feeReceiver: '',
    }
  }

  const chargeFeeBy =
    swapFeeConfig.token === tokenIn
      ? ChargeFeeBy.CURRENCY_IN
      : swapFeeConfig.token === tokenOut
      ? ChargeFeeBy.CURRENCY_OUT
      : ChargeFeeBy.NONE

  if (!chargeFeeBy || !swapFeeConfig.feeBips) {
    return {
      feeAmount: '',
      chargeFeeBy: ChargeFeeBy.NONE,
      isInBps: '',
      feeReceiver: '',
    }
  }

  return {
    feeAmount: String(swapFeeConfig.feeBips),
    chargeFeeBy,
    isInBps: '1',
    feeReceiver: SWAP_FEE_RECEIVER_ADDRESS,
  }
}

// default use aggregator, utils the first time sign-in successfully (guest/sign in eth) => use meta
export const useRouteApiDomain = () => {
  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const { authenticationSuccess } = useSessionInfo()
  return authenticationSuccess ? aggregatorDomain : AGGREGATOR_API
}

export type IntendedFeeConfig = Pick<GetRouteParams, 'feeAmount' | 'feeReceiver' | 'isInBps' | 'chargeFeeBy'>

/** Defines the complete quote identity and query function for TanStack Query. */
const useRouteRequest = (args: ArgsRouteRequest) => {
  const { isEnableAuthenAggregator } = useKyberswapGlobalConfig()
  const { parsedAmount, currencyIn, currencyOut, customChain, clientId } = args
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const feeConfigFromUrl = useGetFeeConfig()

  const dispatch = useAppDispatch()
  const aggregatorDomain = useRouteApiDomain()

  const getSwapFeeConfig = useGetSwapFeeConfig()

  const dexes = useSelectedDexes()

  const safeAppFeeConfig = useMemo(() => {
    let chargeFeeBy = ChargeFeeBy.CURRENCY_IN
    const isCurrencyInStable = currencyIn instanceof WrappedTokenInfo && currencyIn.isStable
    const isCurrencyOutStable = currencyOut instanceof WrappedTokenInfo && currencyOut.isStable

    // case 0: stable is highest priority
    if (isCurrencyOutStable) {
      if (isCurrencyInStable) {
        if (currencyIn.cmcRank && currencyOut.cmcRank) {
          if (currencyIn.cmcRank < currencyOut.cmcRank) chargeFeeBy = ChargeFeeBy.CURRENCY_IN
          else chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
        }
      } else chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
    } else if (currencyIn?.isNative) {
      chargeFeeBy = ChargeFeeBy.CURRENCY_IN
    }
    // Case 1: Output currency is native
    else if (currencyOut?.isNative) {
      if (isCurrencyInStable) {
        chargeFeeBy = ChargeFeeBy.CURRENCY_IN
      } else chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
    } else if (currencyOut instanceof WrappedTokenInfo) {
      // Case 2: Both are wrapped tokens
      if (currencyIn instanceof WrappedTokenInfo) {
        // Case 2.1: Whitelist check
        if (!currencyIn.isWhitelisted && currencyOut.isWhitelisted) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
        // Case 2.2: CMC rank comparison (highest priority)
        else if (currencyIn.cmcRank && currencyOut.cmcRank) {
          if (currencyOut.cmcRank < currencyIn.cmcRank) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
        }
        // Case 2.3: CGK rank comparison (only if CMC rank isn't available for both)
        else if (currencyIn.cgkRank && currencyOut.cgkRank) {
          if (currencyOut.cgkRank < currencyIn.cgkRank) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
        }
        // Case 2.4: Output has rank but input doesn't
        else if (currencyOut.cmcRank || currencyOut.cgkRank) chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
      } else chargeFeeBy = ChargeFeeBy.CURRENCY_OUT
    }
    return {
      feeAmount: '10',
      chargeFeeBy,
      isInBps: '1',
      feeReceiver: SAFE_APP_FEE_RECEIVER_ADDRESS,
      enableTip: false,
      clientId: SAFE_APP_CLIENT_ID,
    }
  }, [currencyIn, currencyOut])

  const request = useMemo(() => {
    const amountIn = parsedAmount ? routeAmountIn(parsedAmount) : ''

    if (
      !currencyIn ||
      !currencyOut ||
      currencyIn.chainId !== currencyOut.chainId ||
      currencyIn.chainId !== chainId ||
      !amountIn ||
      amountIn === '0' ||
      !parsedAmount?.currency?.equals(currencyIn)
    ) {
      return null
    }

    const tokenInAddress = getRouteTokenAddressParam(currencyIn, 'in')
    const tokenOutAddress = getRouteTokenAddressParam(currencyOut, 'out')

    const params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      tokenInDecimals: routeTokenDecimals(currencyIn, 'in'),
      tokenOutDecimals: routeTokenDecimals(currencyOut, 'out'),
      amountIn,
      includedSources: dexes,
      gasInclude: 'true',
      gasPrice: '',
      chainId,
    }
    const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}${AGGREGATOR_API_PATHS.GET_ROUTE}`
    const feeOverride = isInSafeApp ? safeAppFeeConfig : feeConfigFromUrl

    return {
      queryKey: [
        'swap-route',
        { url, params, feeOverride, authentication: isEnableAuthenAggregator, clientId },
      ] as const,
      queryFn: async () => {
        const swapFeeConfig = await getSwapFeeConfig(chainId, tokenInAddress, tokenOutAddress)
        const feeConfigParams = feeOverride || getFeeConfigParams(swapFeeConfig, tokenInAddress, tokenOutAddress)

        const intendedFeeConfig: IntendedFeeConfig = {
          feeAmount: feeConfigParams.feeAmount || '',
          feeReceiver: feeConfigParams.feeReceiver || '',
          isInBps: feeConfigParams.isInBps || '',
          chargeFeeBy: feeConfigParams.chargeFeeBy || ChargeFeeBy.NONE,
        }

        const routeParams = { ...params, ...feeConfigParams }
        const rawResponse = await fetchRoute(dispatch, {
          url,
          params: routeParams,
          authentication: isEnableAuthenAggregator,
          clientId,
        })
        const response = await enrichRouteResponse(rawResponse, routeParams)
        return { response, intendedFeeConfig }
      },
    }
  }, [
    safeAppFeeConfig,
    aggregatorDomain,
    chainId,
    currencyIn,
    currencyOut,
    dexes,
    getSwapFeeConfig,
    isEnableAuthenAggregator,
    parsedAmount,
    dispatch,
    clientId,
    feeConfigFromUrl,
  ])

  return request
}

export default useRouteRequest
