import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseUnits } from '@kyber/utils/crypto'
import { AGGREGATOR_PATH, NATIVE_TOKEN_ADDRESS, SUPPORTED_NETWORKS, WRAPPED_NATIVE_TOKEN } from '../constants'
import { useDebounce } from '@kyber/hooks/use-debounce'
import useTokenBalances from './useTokenBalances'
import { useTokens } from './useTokens'
import { useActiveWeb3 } from './useWeb3Provider'

export interface Trade {
  routeSummary: {
    tokenIn: string
    amountIn: string
    amountInUsd: string
    tokenOut: string
    amountOut: string
    amountOutUsd: string
    gas: string
    gasPrice: string
    gasUsd: string
    extraFee: {
      feeAmount: string
      chargeFeeBy: string
      isInBps: string
      feeReceiver: string
    }
    route: [
      [
        {
          pool: string
          tokenIn: string
          tokenOut: string
          limitReturnAmount: string
          swapAmount: string
          amountOut: string
          exchange: string
          poolLength: number
          poolType: string
          extra: string
        },
      ],
    ]
  }
  routerAddress: string
}

export interface Dex {
  name: string
  logoURL: string
  dexId: string
}

export const useDexes = (enableDexes?: string) => {
  const enableDexesFormatted: string[] | undefined = useMemo(
    () => (enableDexes ? enableDexes.split(',') : undefined),
    [enableDexes],
  )
  const { chainId } = useActiveWeb3()
  const isUnsupported = !SUPPORTED_NETWORKS.includes(chainId.toString())

  const [allDexes, setAllDexes] = useState<Dex[]>([])
  const [excludedDexes, setExcludedDexes] = useState<Dex[]>([])
  const allDexesEnabled = allDexes.filter(dex =>
    enableDexesFormatted ? enableDexesFormatted.includes(dex.dexId) : true,
  )
  const excludedDexIds = excludedDexes.map(i => i.dexId)
  const dexes =
    excludedDexes.length === 0 && !enableDexes
      ? undefined
      : allDexesEnabled
          .filter(item => !excludedDexIds.includes(item.dexId))
          .map(item => item.dexId)
          .join(',')
          .replace('kyberswapv1', 'kyberswap,kyberswap-static')

  useEffect(() => {
    const fetchAllDexes = async () => {
      if (isUnsupported) return
      const res = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/dexes?chain=${AGGREGATOR_PATH[chainId]}&isEnabled=true&pageSize=100`,
      ).then(res => res.json())

      let dexes: Dex[] = res?.data?.dexes || []
      const ksElastic = dexes.find(dex => dex.dexId === 'kyberswap-elastic')
      const ksClassic = dexes.find(dex => dex.dexId === 'kyberswap')
      const ksClassicStatic = dexes.find(dex => dex.dexId === 'kyberswap-static')
      const ksLo = dexes.find(dex => dex.dexId === 'kyberswap-limit-order')

      let ksProtocols: Dex[] = []
      if (ksElastic)
        ksProtocols = [
          {
            dexId: 'kyberswap-elastic',
            name: 'KyberSwap Elastic',
            logoURL: 'https://kyberswap.com/favicon.ico',
          },
        ]
      if (ksClassicStatic || ksClassic)
        ksProtocols.push({
          dexId: 'kyberswapv1',
          name: 'KyberSwap Classic',
          logoURL: 'https://kyberswap.com/favicon.ico',
        })

      if (ksLo)
        ksProtocols.push({
          dexId: 'kyberswap-limit-order',
          name: 'KyberSwap Limit Order',
          logoURL: 'https://kyberswap.com/favicon.ico',
        })

      dexes = ksProtocols.concat(
        dexes.filter(
          dex => !['kyberswap', 'kyberswap-elastic', 'kyberswap-static', 'kyberswap-limit-order'].includes(dex.dexId),
        ),
      )

      setAllDexes(dexes)
    }

    fetchAllDexes()
  }, [isUnsupported, chainId, enableDexesFormatted])

  return [allDexesEnabled, dexes, excludedDexes, setExcludedDexes] as const
}

const useSwap = ({
  defaultTokenIn,
  defaultTokenOut,
  defaultAmountIn,
  defaultSlippage,
  feeSetting,
  enableDexes,
  client,
}: {
  defaultTokenIn?: string
  defaultTokenOut?: string
  defaultSlippage?: number
  defaultAmountIn?: string
  feeSetting?: {
    chargeFeeBy: 'currency_in' | 'currency_out'
    feeAmount: number
    feeReceiver: string
    isInBps: boolean
  }
  enableDexes?: string
  client: string
}) => {
  const { chainId, connectedAccount } = useActiveWeb3()
  const [tokenIn, setTokenIn] = useState(defaultTokenIn || NATIVE_TOKEN_ADDRESS)
  const [tokenOut, setTokenOut] = useState(defaultTokenOut || '')
  const tokens = useTokens()

  const isUnsupported = !SUPPORTED_NETWORKS.includes(chainId.toString())

  const isWrap =
    tokenIn === NATIVE_TOKEN_ADDRESS && tokenOut.toLowerCase() === WRAPPED_NATIVE_TOKEN[chainId].address.toLowerCase()
  const isUnwrap =
    tokenOut === NATIVE_TOKEN_ADDRESS && tokenIn.toLowerCase() === WRAPPED_NATIVE_TOKEN[chainId].address.toLowerCase()

  useEffect(() => {
    if (isUnsupported) {
      setTokenIn('')
      setTokenOut('')
      setTrade(null)
    } else {
      setTrade(null)
      setTokenIn(defaultTokenIn || NATIVE_TOKEN_ADDRESS)
      setTokenOut(defaultTokenOut || '')
    }
  }, [isUnsupported, chainId, defaultTokenIn, defaultTokenOut])

  const { balances } = useTokenBalances(tokens.map(item => item.address))
  const [allDexes, dexes, excludedDexes, setExcludedDexes] = useDexes(enableDexes)

  const [inputAmout, setInputAmount] = useState(defaultAmountIn || '1')
  const debouncedInput = useDebounce(inputAmout)

  const [loading, setLoading] = useState(false)
  const [trade, setTrade] = useState<Trade | null>(null)
  const [error, setError] = useState('')
  const [slippage, setSlippage] = useState(defaultSlippage || 50)
  const [deadline, setDeadline] = useState(20)

  const controllerRef = useRef<AbortController | null>()

  const { chargeFeeBy, feeAmount, isInBps, feeReceiver } = feeSetting || {}

  const getRate = useCallback(async () => {
    if (isUnsupported) return

    const tokenInDecimal =
      tokenIn === NATIVE_TOKEN_ADDRESS
        ? 18
        : tokens.find(token => token.address.toLowerCase() === tokenIn.toLowerCase())?.decimals

    if (!tokenInDecimal || !tokenIn || !tokenOut || !debouncedInput) {
      setError('Invalid input')
      setTrade(null)
      return
    }

    let amountIn: bigint = 0n
    try {
      amountIn = BigInt(parseUnits(debouncedInput, tokenInDecimal))
    } catch (e) {
      setError('Invalid input amount')
      setTrade(null)
      return
    }

    if (!amountIn) {
      setError('Invalid input amount')
      setTrade(null)
      return
    }

    const tokenInBalance = balances[tokenIn] || 0n

    let error = ''
    if (tokenInBalance < amountIn) {
      error = 'Insufficient balance'
    }

    if (!connectedAccount.address) {
      error = 'Please connect your wallet'
    }

    setError(error)
    if (isWrap || isUnwrap) {
      setTrade({
        routerAddress: WRAPPED_NATIVE_TOKEN[chainId].address,
        routeSummary: {
          tokenIn,
          amountIn: amountIn.toString(),
          amountInUsd: '',
          tokenOut,
          amountOut: amountIn.toString(),
          amountOutUsd: '',
          gas: '',
          gasPrice: '',
          gasUsd: '',
          extraFee: {
            feeAmount: '',
            chargeFeeBy: '',
            isInBps: '',
            feeReceiver: '',
          },
          route: [] as any,
        },
      })
      return
    }

    const params: { [key: string]: string | number | boolean | undefined } = {
      tokenIn,
      tokenOut,
      saveGas: false,
      gasInclude: true,
      amountIn: amountIn.toString(),
      includedSources: dexes,
      chargeFeeBy,
      feeAmount,
      isInBps,
      feeReceiver,
    }

    const search = Object.keys(params).reduce(
      (searchString, key) => (params[key] !== undefined ? `${searchString}&${key}=${params[key]}` : searchString),
      '',
    )

    setLoading(true)

    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    const controller = new AbortController()
    controllerRef.current = controller
    const routeResponse = await fetch(
      `https://aggregator-api.kyberswap.com/${AGGREGATOR_PATH[chainId]}/api/v1/routes?${search.slice(1)}`,
      {
        signal: controllerRef.current?.signal,
        headers: {
          'x-client-id': client,
        },
      },
    ).then(r => r.json())

    if (Number(routeResponse.data?.routeSummary?.amountOut)) {
      setTrade(routeResponse.data)
      if (connectedAccount.address && tokenInBalance >= amountIn) setError('')
    } else {
      setTrade(null)
      setError('Insufficient liquidity')
    }

    controllerRef.current = null
    setLoading(false)
    // eslint-disable-next-line
  }, [
    tokens,
    tokenIn,
    tokenOut,
    isWrap,
    isUnwrap,
    connectedAccount.address,
    debouncedInput,
    dexes,
    isUnsupported,
    chainId,
    chargeFeeBy,
    feeAmount,
    isInBps,
    feeReceiver,
    // eslint-disable-next-line
    JSON.stringify(balances, (_key: string, value: any) => (typeof value === 'bigint' ? value.toString() : value)),
  ])

  useEffect(() => {
    getRate()
  }, [getRate])

  return {
    tokenIn,
    tokenOut,
    setTokenOut,
    setTokenIn,
    inputAmout,
    trade,
    setInputAmount,
    loading,
    error,
    slippage,
    setSlippage,
    getRate,
    deadline,
    setDeadline,
    allDexes,
    excludedDexes,
    setExcludedDexes,
    setTrade,
    isWrap,
    isUnwrap,
  }
}

export default useSwap
