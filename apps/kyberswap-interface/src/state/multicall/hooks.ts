import { keepPreviousData } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'

import { ContractRef } from 'hooks/useContract'
import { useBlockNumberFor } from 'state/application/hooks'
import { ListenerOptions } from 'state/multicall/actions'
import { Abi, Address } from 'utils/viem'

// When the per-block refresh keys this query, expose the previous block's data
// as a placeholder so the UI doesn't flash LOADING_CALL_STATE every block.
// Keep the cache small: drop stale entries after a single block-time window.
const PER_BLOCK_QUERY_OPTIONS = { placeholderData: keepPreviousData, gcTime: 30_000 } as const

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

type MethodArg = string | number | bigint
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

function isMethodArg(x: unknown): x is MethodArg {
  return ['string', 'number', 'bigint'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every(xi => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

interface CallState {
  readonly valid: boolean
  readonly result: Result | undefined
  readonly loading: boolean
  readonly error: boolean
}

const INVALID_CALL_STATE: CallState = { valid: false, result: undefined, loading: false, error: false }
const LOADING_CALL_STATE: CallState = { valid: true, result: undefined, loading: true, error: false }
const ERROR_CALL_STATE: CallState = { valid: true, result: undefined, loading: false, error: true }

// Mirrors the old `blocksPerFetch: Infinity` option: viem/wagmi caches indefinitely.
export const NEVER_RELOAD: ListenerOptions = { blocksPerFetch: Infinity }

type AbiFunctionItem = {
  type: 'function'
  name: string
  inputs?: Array<{ name?: string; type: string }>
  outputs?: Array<{ name?: string; type: string }>
}

function findFunctionItem(abi: Abi | undefined, methodName: string): AbiFunctionItem | undefined {
  if (!abi) return undefined
  return (abi as unknown as AbiFunctionItem[]).find(item => item?.type === 'function' && item?.name === methodName)
}

// Reshape viem's decoded result into an array-with-named-keys `Result`. uint256/int256
// values stay as native `bigint` — callers consume them with native bigint ops
// (e.g. `=== 0n`, `Number(x)`).
function toResult(item: AbiFunctionItem | undefined, decoded: unknown): Result {
  if (!item) return [] as unknown as Result
  const outputs = item.outputs ?? []
  let arr: any[]
  if (outputs.length === 0) {
    arr = []
  } else if (outputs.length === 1) {
    arr = [decoded]
  } else if (Array.isArray(decoded)) {
    arr = [...decoded]
  } else if (decoded && typeof decoded === 'object') {
    arr = outputs.map((o, i) => (decoded as any)[o.name ?? i])
  } else {
    arr = [decoded]
  }
  outputs.forEach((o, i) => {
    if (o.name) (arr as any)[o.name] = arr[i]
  })
  return arr as Result
}

function staleTimeFrom(options?: ListenerOptions): number | undefined {
  return options?.blocksPerFetch === Infinity ? Infinity : undefined
}

export function useSingleCallResult(
  contract: ContractRef | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options?: ListenerOptions,
): CallState {
  const abi = contract?.abi
  const fnItem = useMemo(() => findFunctionItem(abi, methodName), [abi, methodName])
  const argsValid = isValidMethodArgs(inputs)
  const enabled = !!contract && !!abi && !!fnItem && argsValid
  const staleTime = staleTimeFrom(options)
  // Drive wagmi's queryKey from the Redux block height for the read's chain so
  // every advance triggers a background refetch — replaces a global
  // `queryClient.invalidateQueries({ queryKey: ['readContract'] })` that fired
  // for every query regardless of chain. Skip when the call opts into
  // `NEVER_RELOAD` (Infinity staleTime) — static reads (token name/symbol,
  // ENS resolution, etc.) shouldn't be invalidated every block.
  const blockNumber = useBlockNumberFor(contract?.chainId)
  const blockNumberArg = staleTime === Infinity || blockNumber === undefined ? undefined : BigInt(blockNumber)

  const { data, isError } = useReadContract({
    address: contract?.address,
    abi: abi ?? [],
    functionName: methodName,
    args: (argsValid ? (inputs as readonly unknown[] | undefined) : undefined) as readonly unknown[] | undefined,
    ...(contract?.chainId !== undefined ? { chainId: contract.chainId as number } : {}),
    ...(blockNumberArg !== undefined ? { blockNumber: blockNumberArg } : {}),
    query: {
      enabled,
      ...(staleTime !== undefined ? { staleTime, gcTime: staleTime } : PER_BLOCK_QUERY_OPTIONS),
    },
  })

  return useMemo(() => {
    if (!enabled) return INVALID_CALL_STATE
    if (isError) return ERROR_CALL_STATE
    if (data === undefined) return LOADING_CALL_STATE
    return { valid: true, result: toResult(fnItem, data), loading: false, error: false }
  }, [enabled, isError, data, fnItem])
}

export function useSingleContractMultipleData(
  contract: ContractRef | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options?: ListenerOptions,
): CallState[] {
  const abi = contract?.abi
  const fnItem = useMemo(() => findFunctionItem(abi, methodName), [abi, methodName])
  const staleTime = staleTimeFrom(options)
  const blockNumber = useBlockNumberFor(contract?.chainId)
  const blockNumberArg = staleTime === Infinity || blockNumber === undefined ? undefined : BigInt(blockNumber)

  // Per-input validity; wagmi cannot mark individual entries as disabled, so we filter to valid
  // entries for the call and remap results by index afterwards.
  const validityMask = useMemo(() => callInputs.map(args => isValidMethodArgs(args)), [callInputs])
  const validInputs = useMemo(
    () =>
      validityMask
        .map((ok, i) => (ok ? callInputs[i] : null))
        .filter((args): args is OptionalMethodInputs => args !== null),
    [callInputs, validityMask],
  )

  const contractCalls = useMemo(() => {
    if (!contract || !abi || !fnItem) return []
    return validInputs.map(args => ({
      address: contract.address,
      abi,
      functionName: methodName,
      args: ((args ?? []) as readonly unknown[]) || [],
      ...(contract.chainId !== undefined ? { chainId: contract.chainId as number } : {}),
    }))
  }, [contract, abi, fnItem, methodName, validInputs])

  const { data } = useReadContracts({
    contracts: contractCalls,
    allowFailure: true,
    ...(blockNumberArg !== undefined ? { blockNumber: blockNumberArg } : {}),
    query: {
      enabled: contractCalls.length > 0,
      ...(staleTime !== undefined ? { staleTime, gcTime: staleTime } : PER_BLOCK_QUERY_OPTIONS),
    },
  })

  return useMemo(() => {
    if (!contract || !abi || !fnItem) {
      // No contract on this chain — mirror `useSingleCallResult`'s INVALID
      // semantics rather than leaving every input stuck on LOADING forever.
      return callInputs.map(() => INVALID_CALL_STATE)
    }
    let validIdx = 0
    return callInputs.map((_args, i) => {
      if (!validityMask[i]) return INVALID_CALL_STATE
      const item = data?.[validIdx++]
      if (!item) return LOADING_CALL_STATE
      if (item.status === 'failure') return ERROR_CALL_STATE
      return { valid: true, result: toResult(fnItem, item.result), loading: false, error: false }
    })
  }, [contract, abi, fnItem, data, callInputs, validityMask])
}

export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  abi: Abi,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: ListenerOptions,
): CallState[] {
  const fnItem = useMemo(() => findFunctionItem(abi, methodName), [abi, methodName])
  const argsValid = isValidMethodArgs(callInputs)
  const staleTime = staleTimeFrom(options)
  // No per-call chainId; this hook always reads on the active chain.
  const blockNumber = useBlockNumberFor(undefined)
  const blockNumberArg = staleTime === Infinity || blockNumber === undefined ? undefined : BigInt(blockNumber)

  const validityMask = useMemo(() => addresses.map(addr => !!addr && argsValid), [addresses, argsValid])

  const contractCalls = useMemo(() => {
    if (!fnItem || !argsValid) return []
    return addresses
      .map(addr =>
        addr
          ? {
              address: addr as Address,
              abi,
              functionName: methodName,
              args: ((callInputs ?? []) as readonly unknown[]) || [],
            }
          : null,
      )
      .filter((c): c is NonNullable<typeof c> => c !== null)
  }, [addresses, abi, fnItem, argsValid, methodName, callInputs])

  const { data } = useReadContracts({
    contracts: contractCalls,
    allowFailure: true,
    ...(blockNumberArg !== undefined ? { blockNumber: blockNumberArg } : {}),
    query: {
      enabled: contractCalls.length > 0,
      ...(staleTime !== undefined ? { staleTime, gcTime: staleTime } : PER_BLOCK_QUERY_OPTIONS),
    },
  })

  return useMemo(() => {
    if (!fnItem) return addresses.map(() => INVALID_CALL_STATE)
    let validIdx = 0
    return addresses.map((_addr, i) => {
      if (!validityMask[i]) return INVALID_CALL_STATE
      const item = data?.[validIdx++]
      if (!item) return LOADING_CALL_STATE
      if (item.status === 'failure') return ERROR_CALL_STATE
      return { valid: true, result: toResult(fnItem, item.result), loading: false, error: false }
    })
  }, [addresses, fnItem, data, validityMask])
}

export type { CallState }
