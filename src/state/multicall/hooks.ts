import { FunctionFragment, Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EMPTY_ARRAY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { AppDispatch, AppState } from 'state/index'

import {
  Call,
  ListenerOptions,
  addMulticallListeners,
  parseCallKey,
  removeMulticallListeners,
  toCallKey,
} from './actions'

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

type MethodArg = string | number | BigNumber
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

function isMethodArg(x: unknown): x is MethodArg {
  return ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every(xi => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

interface CallResult {
  readonly valid: boolean
  readonly data: string | undefined
  readonly blockNumber: number | undefined
}

const INVALID_RESULT: CallResult = { valid: false, blockNumber: undefined, data: undefined }

// use this options object
export const NEVER_RELOAD: ListenerOptions = {
  blocksPerFetch: Infinity,
}

// the lowest level call for subscribing to contract data
export function useCallsData(calls: (Call | undefined)[], options?: ListenerOptions): CallResult[] {
  const { chainId, isEVM } = useActiveWeb3React()
  const callResults = useSelector<AppState, AppState['multicall']['callResults'][ChainId]>(
    state => state.multicall.callResults?.[chainId],
  )
  const dispatch = useDispatch<AppDispatch>()

  const serializedCallKeys: string = useMemo(
    () =>
      JSON.stringify(
        isEVM
          ? calls
              ?.filter((c): c is Call => Boolean(c))
              ?.map(toCallKey)
              ?.sort() ?? []
          : [],
      ),
    [isEVM, calls],
  )

  // update listeners when there is an actual change that persists for at least 100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys)
    if (!isEVM || callKeys.length === 0) return undefined
    const calls = callKeys.map(key => parseCallKey(key))

    dispatch(
      addMulticallListeners({
        chainId,
        calls,
        options,
      }),
    )

    return () => {
      dispatch(
        removeMulticallListeners({
          chainId,
          calls,
          options,
        }),
      )
    }
  }, [isEVM, dispatch, options, serializedCallKeys, chainId])

  const lastResults = useRef<CallResult[]>([])
  return useMemo(() => {
    let isChanged = lastResults.current.length !== calls.length

    // Construct results using a for-loop to handle sparse arrays.
    // Array.prototype.map would skip empty entries.
    const results: CallResult[] = []
    for (let i = 0; i < calls.length; ++i) {
      const call = calls[i]
      let result = INVALID_RESULT
      if (call) {
        const callResult = callResults?.[toCallKey(call)]
        result = {
          valid: true,
          data: callResult?.data && callResult.data !== '0x' ? callResult.data : undefined,
          blockNumber: callResult?.blockNumber,
        }
      }

      isChanged = isChanged || !areCallResultsEqual(result, lastResults.current[i])
      results.push(result)
    }

    // Force the results to be referentially stable if they have not changed.
    // This is necessary because *all* callResults are passed as deps when initially memoizing the results.
    if (isChanged) {
      lastResults.current = results
    }
    return lastResults.current
  }, [callResults, calls])
}

function areCallResultsEqual(a: CallResult, b: CallResult) {
  return a.valid === b.valid && a.data === b.data && a.blockNumber === b.blockNumber
}

interface CallState {
  readonly valid: boolean
  // the result, or undefined if loading or errored/no data
  readonly result: Result | undefined
  // true if the result has never been fetched
  readonly loading: boolean
  // true if the result is not for the latest block
  // readonly syncing: boolean
  // true if the call was made and is synced, but the return data is invalid
  readonly error: boolean
}

const INVALID_CALL_STATE: CallState = { valid: false, result: undefined, loading: false, error: false }
const LOADING_CALL_STATE: CallState = { valid: true, result: undefined, loading: true, error: false }

export function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
): CallState {
  if (!callResult || !callResult.valid) return INVALID_CALL_STATE
  const { data, blockNumber } = callResult
  if (!blockNumber || !contractInterface || !fragment) return LOADING_CALL_STATE
  const success = data && data.length > 2
  // const syncing = blockNumber < latestBlockNumber
  let result: Result | undefined = undefined
  if (success && data) {
    try {
      result = contractInterface.decodeFunctionResult(fragment, data)
    } catch (error) {
      console.debug('Result data parsing failed', fragment, data)
      return {
        valid: true,
        loading: false,
        error: true,
        result,
      }
    }
  }
  return {
    valid: true,
    loading: false,
    result: result,
    error: !success,
  }
}

export function useSingleContractMultipleData(
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options?: ListenerOptions,
): CallState[] {
  const { isEVM } = useActiveWeb3React()
  const fragment = useMemo(
    () => (isEVM ? contract?.interface?.getFunction(methodName) : undefined),
    [contract, methodName, isEVM],
  )
  const { gasRequired } = useMemo(() => options ?? {}, [options])
  const calls = useMemo(
    () =>
      isEVM && contract && fragment && callInputs && callInputs.length > 0
        ? callInputs.map<Call>(inputs => {
            return {
              address: contract.address,
              callData: contract.interface.encodeFunctionData(fragment, inputs),
              gasRequired,
            }
          })
        : EMPTY_ARRAY,
    [callInputs, isEVM, contract, fragment, gasRequired],
  )

  const results = useCallsData(calls, options)

  return useMemo(() => {
    return isEVM ? results.map(result => toCallState(result, contract?.interface, fragment)) : []
  }, [isEVM, fragment, contract, results])
}

export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: ListenerOptions,
): CallState[] {
  const { isEVM } = useActiveWeb3React()
  const fragment = useMemo(
    () => (isEVM ? contractInterface.getFunction(methodName) : undefined),
    [isEVM, contractInterface, methodName],
  )

  const callData: string | undefined = useMemo(
    () =>
      isEVM && fragment && isValidMethodArgs(callInputs)
        ? contractInterface.encodeFunctionData(fragment, callInputs)
        : undefined,
    [callInputs, isEVM, contractInterface, fragment],
  )
  const { gasRequired } = useMemo(() => options ?? {}, [options])
  const calls = useMemo(
    () =>
      isEVM && fragment && addresses?.length > 0 && callData
        ? addresses.map<Call | undefined>(address => {
            return address && callData
              ? {
                  address,
                  callData,
                  gasRequired,
                }
              : undefined
          })
        : EMPTY_ARRAY,
    [addresses, callData, isEVM, fragment, gasRequired],
  )

  const results = useCallsData(calls, options)

  return useMemo(() => {
    if (isEVM) return results.map(result => toCallState(result, contractInterface, fragment))
    return []
  }, [isEVM, results, contractInterface, fragment])
}

export function useSingleCallResult(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options?: ListenerOptions,
): CallState {
  const { isEVM } = useActiveWeb3React()
  const fragment = useMemo(
    () => (isEVM ? contract?.interface?.getFunction(methodName) : undefined),
    [contract?.interface, isEVM, methodName],
  )
  const { gasRequired } = options ?? {}
  const calls = useMemo<Call[]>(() => {
    return isEVM && contract && fragment && isValidMethodArgs(inputs)
      ? [
          {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragment, inputs),
            gasRequired,
          },
        ]
      : EMPTY_ARRAY
  }, [isEVM, contract, fragment, inputs, gasRequired])

  const { valid, data, blockNumber } = useCallsData(calls, options)[0] || {}

  return useMemo(() => {
    return toCallState({ valid, data, blockNumber }, contract?.interface, fragment)
  }, [valid, data, blockNumber, contract, fragment])
}

export function useSingleContractWithCallData(
  contract: Contract | null | undefined,
  callDatas: string[],
  options?: ListenerOptions,
): CallState[] {
  const { gasRequired } = options ?? {}
  const calls = useMemo(
    () =>
      contract && callDatas && callDatas.length > 0
        ? callDatas.map<Call>(callData => {
            return {
              address: contract.address,
              callData,
              gasRequired,
            }
          })
        : [],
    [callDatas, contract, gasRequired],
  )

  const results = useCallsData(calls, options)

  return useMemo(() => {
    return results.map((result, i) =>
      toCallState(result, contract?.interface, contract?.interface?.getFunction(callDatas[i].substring(0, 10))),
    )
  }, [contract, results, callDatas])
}
