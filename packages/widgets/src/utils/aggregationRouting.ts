import { isAddress, isSameTokenAddress } from '.'
import { NATIVE_TOKEN_ADDRESS, NATIVE_TOKEN, TokenInfo } from '../constants'

export type Route = {
  pool: string

  tokenIn: string
  swapAmount: string

  tokenOut: string
  amountOut: string

  limitReturnAmount: string
  exchange: string
  poolLength: number
  poolType: string
  extra: string
}

type ExtraFeeConfig = {
  feeAmount: string
  feeAmountUsd: string
  chargeFeeBy: ChargeFeeBy
  isInBps: boolean
  feeReceiver: string
}

type DetailedRouteSummary = {
  tokenIn: string
  amountIn: string
  parsedAmountIn: number
  amountInUsd: string

  tokenOut: string
  amountOut: string
  parsedAmountOut: number
  amountOutUsd: string

  priceImpact: number
  executionPrice: number

  gas: string
  gasUsd: string
  gasPrice: string

  fee?: {
    currency: TokenInfo
    currencyAmount: string
    formattedAmount: string
    formattedAmountUsd: string
  }

  extraFee: ExtraFeeConfig

  route: Route[][]
  routerAddress: string
}

enum ChargeFeeBy {
  CURRENCY_IN = 'currency_in',
  CURRENCY_OUT = 'currency_out',
  NONE = '',
}

type RouteSummary = {
  tokenIn: string
  amountIn: string
  amountInUsd: string

  tokenOut: string
  amountOut: string
  amountOutUsd: string
  tokenOutMarketPriceAvailable: null

  gas: string
  gasUsd: string
  gasPrice: string

  extraFee: {
    chargeFeeBy: ChargeFeeBy
    feeAmount: string
    feeReceiver: string
    isInBps: boolean
    feeAmountUsd: string
  }

  route: Route[][]
}
type GetRouteData = {
  routeSummary: RouteSummary | null
  routerAddress: string
  fromMeta: boolean
}

export interface SwapPool {
  id: string
  exchange: string
  swapAmount?: number
  swapPercentage?: number
}

type PathItem = TokenInfo

type Swap = {
  pool: string
  tokenIn: string
  tokenOut: string
  swapAmount: string
  amountOut: string
  exchange: string
}

interface SwapRoute {
  slug: string
  pools: SwapPool[]
  path: PathItem[]
  id: string
}

export interface SwapRouteV2 {
  swapPercentage?: number
  path: PathItem[]
  subRoutes: SwapPool[][]
  id: string
}

const calculateFee = (
  currencyIn: TokenInfo,
  currencyOut: TokenInfo,
  parsedAmountIn: number,
  parsedAmountOut: number,
  routeSummary: RouteSummary,
): DetailedRouteSummary['fee'] => {
  if (!routeSummary.extraFee?.chargeFeeBy || !routeSummary.extraFee?.feeAmount) {
    return undefined
  }

  const currencyToTakeFee = routeSummary.extraFee.chargeFeeBy === ChargeFeeBy.CURRENCY_IN ? currencyIn : currencyOut
  const currencyAmountToTakeFee =
    routeSummary.extraFee.chargeFeeBy === ChargeFeeBy.CURRENCY_IN ? parsedAmountIn : parsedAmountOut
  const feeAmountFraction = Number(routeSummary.extraFee.feeAmount) / 10000
  const feeCurrencyAmount = currencyAmountToTakeFee * feeAmountFraction

  const feeAmountUsd = routeSummary.extraFee.feeAmountUsd
  return {
    currency: currencyToTakeFee,
    currencyAmount: feeCurrencyAmount.toString(),
    formattedAmount: feeCurrencyAmount.toPrecision(10),
    formattedAmountUsd: feeAmountUsd && feeAmountUsd !== '0' ? parseFloat(feeAmountUsd).toPrecision(10) : '',
  }
}

export const parseGetRouteResponse = (
  rawData: GetRouteData,
  currencyIn: TokenInfo,
  currencyOut: TokenInfo,
): {
  routeSummary: DetailedRouteSummary | undefined
  routerAddress: string
  fromMeta: boolean
} => {
  const defaultValue = {
    routeSummary: undefined,
    routerAddress: rawData.routerAddress,
    fromMeta: rawData.fromMeta,
  }

  const rawRouteSummary = rawData.routeSummary
  if (!rawRouteSummary) {
    return defaultValue
  }

  const isValidPair =
    rawRouteSummary.tokenIn.toLowerCase() === currencyIn.address.toLowerCase() &&
    rawRouteSummary.tokenOut.toLowerCase() === currencyOut.address.toLowerCase()

  if (!isValidPair) return defaultValue

  const parsedAmountIn = parseFloat(rawRouteSummary.amountIn)
  const parsedAmountOut = parseFloat(rawRouteSummary.amountOut)
  const executionPrice = parsedAmountIn / parsedAmountOut

  const routeSummary: DetailedRouteSummary = {
    ...rawRouteSummary,
    parsedAmountIn,
    parsedAmountOut,
    fee: calculateFee(currencyIn, currencyOut, parsedAmountIn, parsedAmountOut, rawRouteSummary),
    priceImpact: !rawRouteSummary.amountOutUsd
      ? -1
      : (+rawRouteSummary.amountInUsd - +rawRouteSummary.amountOutUsd * 100) / +rawRouteSummary.amountInUsd,
    executionPrice,
    routerAddress: rawData.routerAddress,
  }

  return {
    routeSummary,
    routerAddress: rawData.routerAddress,
    fromMeta: rawData.fromMeta,
  }
}

function formatRoutesV2(routes: SwapRoute[]): SwapRouteV2[] {
  if (!routes.length) {
    return []
  }
  try {
    let itemIndex = -1
    const routesGroup = routes.reduce((acc, cur) => {
      let index: number
      let subRoutes: any[][] = []
      let swapPercentage: number = cur.pools?.[0]?.swapPercentage || 0
      if (acc[cur.slug]) {
        const route: any = acc[cur.slug] || {}
        index = route.index
        const temp = route.subRoutes || []
        swapPercentage += route.swapPercentage || 0
        temp.forEach((sub: any[], ind: number) => {
          const swapPool: any = (cur.pools && cur.pools[ind]) || ({} as any)
          const totalSwapAmount = sub.reduce((sum, x2) => sum + x2.swapAmount || 0, 0) + swapPool.swapAmount || 0
          // merge hop with same pools
          let existed = false
          const newSub: any[] = sub.map(pool => {
            const p2: any = { ...pool }
            const same = p2.id === swapPool.id
            let swapAmount = p2.swapAmount || 0
            if (same) {
              existed = true
              swapAmount = swapAmount + swapPool.swapAmount || 0
            }
            p2.swapPercentage = Math.round((parseFloat(swapAmount) * 100) / parseFloat(totalSwapAmount))
            p2.total = totalSwapAmount.toString()
            return p2
          })
          if (!existed) {
            const percent = Math.round((parseFloat(swapPool.swapAmount) * 100) / parseFloat(totalSwapAmount))
            newSub.push({ ...swapPool, swapPercentage: percent })
          }
          subRoutes[ind] = newSub
        })
      } else {
        itemIndex += 1
        index = itemIndex
        subRoutes = cur.pools.map(p => [{ ...p, swapPercentage: 100 }])
      }
      return Object.assign({}, acc, {
        [cur.slug]: { index, swapPercentage, path: cur.path, subRoutes },
      })
    }, {} as any)

    const routesV2Length = Object.keys(routesGroup).length
    const routesV2: SwapRouteV2[] = new Array(routesV2Length).map(() => ({} as SwapRouteV2))

    Object.values(routesGroup).forEach((route: any) => {
      if (route.index > routesV2Length) return
      routesV2.splice(route.index, 1, {
        swapPercentage: route.swapPercentage,
        path: route.path,
        subRoutes: route.subRoutes,
        id: route.subRoutes
          .flat()
          .map((route: SwapPool) => route.id)
          .join('-'),
      })
    })
    return routesV2
  } catch (e) {
    console.error('[error_routesV2]', e)
    return []
  }
}

export function getTradeComposition(
  chainId: number,
  inputToken: TokenInfo | undefined,
  inputAmount: string | undefined,
  swaps: Swap[][] | undefined,
  // allTokens: { [address: string]: Token } | undefined,
  allTokensArr: TokenInfo[],
): SwapRouteV2[] | undefined {
  if (!inputAmount || !swaps) {
    return undefined
  }

  const allTokens = allTokensArr.reduce((acc, cur) => {
    acc[cur.address] = cur
    return acc
  }, {} as { [address: string]: TokenInfo })
  const routes: SwapRoute[] = []

  const calcSwapPercentage = function (tokenIn: string, amount: string): number | undefined {
    if (!tokenIn || !amount) {
      return undefined
    }
    const exactTokenIn = isSameTokenAddress(chainId, tokenIn, inputToken?.address)
    if (exactTokenIn && Number(inputAmount) > 0) {
      const percent = (parseFloat(amount) * 100) / parseFloat(inputAmount)
      return Math.round(percent)
    }
    return undefined
  }

  const getTokenFromAddress = (address: string) => {
    if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      return NATIVE_TOKEN[chainId]
    }

    return (
      allTokens?.[isAddress(address) || ''] ||
      allTokens?.[address] || {
        name: '--',
        decimals: 0,
        symbol: '--',
        address,
        chainId,
        logoURI: '',
      }
    )
  }

  // Convert all Swaps to ChartSwaps
  swaps.forEach(sorMultiSwap => {
    if (!sorMultiSwap.length || sorMultiSwap.length < 1) {
      return
    }

    if (sorMultiSwap.length === 1) {
      const hop = sorMultiSwap[0]
      const path = [getTokenFromAddress(hop.tokenIn), getTokenFromAddress(hop.tokenOut)]

      routes.push({
        slug: hop.tokenOut?.toLowerCase(),
        pools: [
          {
            id: hop.pool,
            exchange: hop.exchange,
            swapAmount: parseFloat(hop.swapAmount),
            swapPercentage: calcSwapPercentage(hop.tokenIn, hop.swapAmount),
          },
        ],
        path,
        id: hop.pool,
      })

      return
    }

    const path: PathItem[] = []
    const pools: SwapPool[] = []
    sorMultiSwap.forEach((hop: any, index: number) => {
      pools.push({
        id: hop.pool + '-' + hop.tokenIn + '-' + hop.tokenOut,
        exchange: hop.exchange,
        swapAmount: parseFloat(hop.swapAmount),
        swapPercentage: index === 0 ? calcSwapPercentage(hop.tokenIn, hop.swapAmount) : 100,
      })

      if (index === 0) {
        path.push(getTokenFromAddress(hop.tokenIn))
      }

      const token = getTokenFromAddress(hop.tokenOut)
      path.push(token)
    })
    routes.push({
      slug: path
        .slice(1)
        .map(t => t.address)
        .join('-')
        .toLowerCase(),
      path,
      pools,
      id: pools.map(p => p.id).join('-'),
    })
  })

  // Convert to ChartSwaps v2
  return formatRoutesV2(routes)
}
