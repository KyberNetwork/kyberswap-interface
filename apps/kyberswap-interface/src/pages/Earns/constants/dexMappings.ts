// NOTE: `PoolType` from '@kyberswap/liquidity-widgets' is a runtime ENUM (a value).
// Value-importing it here would drag the entire liquidity-widgets package into the
// eager entry chunk, since this constants file is always reachable. To avoid that we
// import the enum as a TYPE ONLY (erased at build) and mirror its members locally.
//
// IMPORTANT: `LocalZapPoolType` MUST stay byte-identical to @kyberswap/liquidity-widgets'
// `PoolType` (same numeric values) — the zap flow sends these values to the zap API and
// compares them against the widget/schema `PoolType`, so any drift silently breaks zap-in.
// The compile-time guards below fail the build if the local enum diverges from the widget
// enum (member names or values). Keep them in sync.
import type { PoolType as ZapPoolType } from '@kyberswap/liquidity-widgets'

import { Exchange } from 'pages/Earns/constants'

// Local mirror of @kyberswap/liquidity-widgets `PoolType`. Values MUST match exactly.
enum LocalZapPoolType {
  DEX_UNISWAP_V4 = 68,
  DEX_UNISWAP_V4_FAIRFLOW = 73,
  DEX_PANCAKE_INFINITY_CL = 75,
  DEX_PANCAKE_INFINITY_CL_FAIRFLOW = 74,

  DEX_UNISWAPV3 = 2,
  DEX_PANCAKESWAPV3 = 3,
  DEX_METAVAULTV3 = 8,
  DEX_LINEHUBV3 = 35,
  DEX_SWAPMODEV3 = 46,
  DEX_KOICL = 38,
  DEX_THRUSTERV3 = 12,
  DEX_SUSHISWAPV3 = 11,
  DEX_KODIAK_V3 = 58,
  DEX_SQUADSWAP_V3 = 66,

  DEX_PANCAKESWAPV2 = 16,
  DEX_UNISWAPV2 = 4,
  DEX_PANGOLINSTANDARD = 18,
  DEX_SUSHISWAPV2 = 5,
  DEX_QUICKSWAPV2 = 19,
  DEX_THRUSTERV2 = 20,
  DEX_SWAPMODEV2 = 44,
  DEX_KODIAK_V2 = 57,
  DEX_SQUADSWAP_V2 = 65,

  DEX_THENAFUSION = 15,
  DEX_QUICKSWAPV3ALGEBRA = 14,
  DEX_CAMELOTV3 = 13,
  DEX_AERODROMECL = 24,
  DEX_AERODROMECL2 = 82,
  DEX_AERODROMECL3 = 83,
}

// Compile-time guards: if `LocalZapPoolType` ever diverges from the widget `ZapPoolType` —
// by member name or by numeric value — `AssertEqual` resolves to `never`, and assigning
// `true` to a `never`-typed const fails the build (a bare `type` alias would NOT, since a
// `never` alias is not itself an error). The consts carry no widget reference and minify away.
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _membersInSync: AssertEqual<keyof typeof LocalZapPoolType, keyof typeof ZapPoolType> = true
const _valuesInSync: AssertEqual<`${LocalZapPoolType}`, `${ZapPoolType}`> = true
void _membersInSync
void _valuesInSync

// Runtime object is built from the local mirror (no widget value-import). The guards above
// prove the values are byte-identical to the widget enum, so re-typing the map as
// `Record<Exchange, ZapPoolType>` for consumers is sound.
export const ZAPIN_DEX_MAPPING = {
  [Exchange.DEX_UNISWAPV3]: LocalZapPoolType.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: LocalZapPoolType.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: LocalZapPoolType.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: LocalZapPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: LocalZapPoolType.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: LocalZapPoolType.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: LocalZapPoolType.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: LocalZapPoolType.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: LocalZapPoolType.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: LocalZapPoolType.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: LocalZapPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: LocalZapPoolType.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL_ALPHA]: LocalZapPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_BREVIS]: LocalZapPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_DYNAMIC]: LocalZapPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_LO]: LocalZapPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_AERODROMECL]: LocalZapPoolType.DEX_AERODROMECL,
  [Exchange.DEX_AERODROMECL2]: LocalZapPoolType.DEX_AERODROMECL2,
  [Exchange.DEX_AERODROMECL3]: LocalZapPoolType.DEX_AERODROMECL3,
} as unknown as Record<Exchange, ZapPoolType>
