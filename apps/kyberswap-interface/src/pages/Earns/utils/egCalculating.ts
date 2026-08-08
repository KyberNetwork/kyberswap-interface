import { ChainId } from '@kyberswap/ks-sdk-core'

import { ProgramType } from 'pages/Earns/types/pool'

/** Chains whose FairFlow EG figures are not trustworthy, so every EG reading is masked. */
const EG_CALCULATING_CHAINS: Array<number> = [ChainId.ROBINHOOD]

export const hasEgProgram = (programs?: Array<ProgramType | string>) => !!programs?.includes(ProgramType.EG)

/**
 * EG figures are only masked for pools/positions that sit on an affected chain AND take part in the
 * EG program; everything else keeps rendering the real numbers.
 */
export const isEgCalculating = (chainId?: number, poolHasEgProgram?: boolean) =>
  chainId !== undefined && !!poolHasEgProgram && EG_CALCULATING_CHAINS.includes(chainId)

/**
 * Strips the EG share out of an aggregate (APR or USD) so the remainder still renders as a real
 * figure; only the standalone EG readings fall back to the `EgCalculating` placeholder.
 */
export const excludeEg = <T extends number | undefined>(total: T, eg?: number): T =>
  (total === undefined ? total : Math.max(total - (eg ?? 0), 0)) as T
