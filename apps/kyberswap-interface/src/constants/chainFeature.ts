import { ChainId } from '@kyberswap/ks-sdk-core'

/**
 * Why a chain is without a feature. A fixed shape rather than any string, so a value typed where a
 * note belongs (an address in place of `new Token(…)`) fails type-check instead of switching the
 * feature off for that chain.
 */
export type ChainFeatureNote = 'testnet' | `needs ${string}`

/**
 * One feature's decision for every chain: its value on the chains that have it, and on each other
 * chain a note of what that chain still needs (or why it is left out). Exhaustive over `ChainId`,
 * so adding a chain fails type-check in every such map until the feature's decision for it is
 * written down — a chain cannot miss a feature by omission.
 *
 * Values are `true` or objects, never strings or `false`, so a note is told apart by its type alone.
 */
export type ChainFeatureMap<T extends object | true = true> = Record<ChainId, T | ChainFeatureNote>

/** A map's values on the chains it turns on. */
export const enabledValues = <T extends object>(map: ChainFeatureMap<T>): Partial<Record<ChainId, T>> =>
  Object.fromEntries(Object.entries(map).filter(([, value]) => typeof value !== 'string')) as Partial<
    Record<ChainId, T>
  >
