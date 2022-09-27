// import { createAction } from '@reduxjs/toolkit'

// export interface Call {
//   address: string
//   callData: string
//   gasRequired?: number
// }

// const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
// const LOWER_HEX_REGEX = /^0x[a-f0-9]*$/
// export function toCallKey(call: Call): string {
//   if (!ADDRESS_REGEX.test(call.address)) {
//     throw new Error(`Invalid address: ${call.address}`)
//   }
//   if (!LOWER_HEX_REGEX.test(call.callData)) {
//     throw new Error(`Invalid hex: ${call.callData}`)
//   }
//   let key = `${call.address}-${call.callData}`
//   if (call.gasRequired) {
//     if (!Number.isSafeInteger(call.gasRequired)) {
//       throw new Error(`Invalid number: ${call.gasRequired}`)
//     }
//     key += `-${call.gasRequired}`
//   }
//   return key
// }

// export function parseCallKey(callKey: string): Call {
//   const pcs = callKey.split('-')
//   if (![2, 3].includes(pcs.length)) {
//     throw new Error(`Invalid call key: ${callKey}`)
//   }
//   return {
//     address: pcs[0],
//     callData: pcs[1],
//     ...(pcs[2] ? { gasRequired: Number.parseInt(pcs[2]) } : {}),
//   }
// }

// export interface ListenerOptions {
//   // how often this data should be fetched, by default 1
//   readonly blocksPerFetch?: number
//   readonly gasRequired?: number | undefined
// }

// export const addSolanaCallListeners = createAction<{ chainId: number; calls: Call[]; options?: ListenerOptions }>(
//   'multicall/addSolanaCallListeners',
// )
// export const removeSolanaCallListeners = createAction<{ chainId: number; calls: Call[]; options?: ListenerOptions }>(
//   'multicall/removeSolanaCallListeners',
// )
// export const fetchingSolanaCallResults = createAction<{ chainId: number; calls: Call[]; fetchingBlockNumber: number }>(
//   'multicall/fetchingSolanaCallResults',
// )
// export const errorFetchingSolanaCallResults = createAction<{
//   chainId: number
//   calls: Call[]
//   fetchingBlockNumber: number
// }>('multicall/errorFetchingSolanaCallResults')
// export const updateSolanaCallResults = createAction<{
//   chainId: number
//   blockNumber: number
//   results: {
//     [callKey: string]: string | null
//   }
// }>('multicall/updateSolanaCallResults')

// todo namgold: complete this
export {}
