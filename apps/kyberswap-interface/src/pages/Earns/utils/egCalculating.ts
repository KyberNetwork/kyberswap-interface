import { ProgramType } from 'pages/Earns/types/pool'

/**
 * The affected chains live in `@kyber/utils` so the app and the embeddable widgets share one switch;
 * re-exported here because every Earn call site already reaches for this module.
 */
export { isEgCalculating } from '@kyber/utils/dist/egCalculating'

export const hasEgProgram = (programs?: Array<ProgramType | string>) => !!programs?.includes(ProgramType.EG)

/**
 * Strips the EG share out of an aggregate (APR or USD) so the remainder still renders as a real
 * figure; only the standalone EG readings fall back to the `EgCalculating` placeholder.
 */
export const excludeEg = <T extends number | undefined>(total: T, eg?: number): T =>
  (total === undefined ? total : Math.max(total - (eg ?? 0), 0)) as T
