import { ChainId } from '@kyberswap/ks-sdk-core'

/**
 * One feature's decision for every chain: its value on the chains that have it, and on each other
 * chain a note of what that chain still needs (or why it is left out). Exhaustive over `ChainId`,
 * so adding a chain fails type-check in every such map until the feature's decision for it is
 * written down — a chain cannot miss a feature by omission.
 */
export type ChainFeatureMap<T = true> = Record<ChainId, T | string>

const isOn = <T>(value: T | string): value is T => typeof value !== 'string'

/** The chains a map turns on, ascending by chain id. */
export const enabledChains = (map: ChainFeatureMap<unknown>): ChainId[] =>
  (Object.keys(map).map(Number) as ChainId[]).filter(chainId => isOn(map[chainId]))

/** A map's values on the chains it turns on. */
export const enabledValues = <T>(map: ChainFeatureMap<T>): Partial<Record<ChainId, T>> =>
  Object.fromEntries(Object.entries(map).filter(([, value]) => isOn(value))) as Partial<Record<ChainId, T>>
