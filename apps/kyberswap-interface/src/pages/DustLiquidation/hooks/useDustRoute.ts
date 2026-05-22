import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DustSwapRouteApiResponse,
  prepareGetDustSwapRouteRequest,
  useLazyGetDustSwapRouteQuery,
} from 'services/dustSwap'

import { DUST_ROUTE_DEBOUNCE_MS, isDustSwapSupported } from 'constants/dustLiquidation'
import { useActiveWeb3React } from 'hooks'
import { useDustLiquidationState } from 'state/dustLiquidation/hooks'

type Result = {
  route: DustSwapRouteApiResponse | undefined
  isLoading: boolean
  error: string | null
  // Soft message — what the user still needs to do. Distinct from a hard error.
  hint: string | null
  refetch: () => void
}

const useDustRoute = (): Result => {
  const { chainId } = useActiveWeb3React()
  const { inputs, outputToken, slippage } = useDustLiquidationState()
  const [trigger, { data, isFetching }] = useLazyGetDustSwapRouteQuery()
  const [localError, setLocalError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const requestArgs = useMemo(() => {
    if (!isDustSwapSupported(chainId)) return { args: null, error: 'Unsupported chain', hint: null as string | null }
    if (inputs.length === 0) return { args: null, error: null, hint: 'Select tokens to liquidate' }
    if (!outputToken) return { args: null, error: null, hint: 'Select an output token' }

    const tokensIn: string[] = []
    const amountsIn: string[] = []
    for (const input of inputs) {
      if (!input.amount || Number(input.amount) <= 0) continue
      try {
        amountsIn.push(parseUnits(input.amount, input.decimals).toString())
        tokensIn.push(input.address)
      } catch {
        return { args: null, error: `Invalid amount for ${input.symbol}`, hint: null }
      }
    }
    if (!tokensIn.length) return { args: null, error: null, hint: 'Enter an amount for at least one token' }

    const { data: prepared, error } = prepareGetDustSwapRouteRequest({
      chainId,
      tokensIn,
      amountsIn,
      tokenOut: outputToken.address,
      slippage,
    })
    if (error || !prepared) return { args: null, error, hint: null }
    return { args: prepared, error: null, hint: null }
  }, [chainId, inputs, outputToken, slippage])

  const runFetch = useCallback(() => {
    if (!requestArgs.args) return
    // Force refetch — preferCacheValue: false ensures we always hit the API for fresh
    // pricing rather than reusing a stale cached response.
    trigger(requestArgs.args, /* preferCacheValue */ false)
  }, [requestArgs.args, trigger])

  // Debounced auto-refetch on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!requestArgs.args) {
      setLocalError(requestArgs.error)
      setHint(requestArgs.hint)
      return
    }
    setLocalError(null)
    setHint(null)
    debounceRef.current = setTimeout(runFetch, DUST_ROUTE_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [requestArgs, runFetch])

  const apiError = data?.message && data.message !== 'OK' ? data.message : null
  const error = localError || apiError

  return { route: data, isLoading: isFetching, error, hint, refetch: runFetch }
}

export default useDustRoute
