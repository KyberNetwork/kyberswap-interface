/** Chains whose FairFlow EG figures are not trustworthy, so every EG reading is masked. */
const EG_CALCULATING_CHAINS: Array<number> = [4663]; // Robinhood

/**
 * Every EG reading and every aggregate built on one renders a "Calculating..." placeholder instead
 * of a number, but only for pools/positions that sit on an affected chain AND take part in the EG
 * program; everything else keeps rendering the real figures.
 */
export const isEgCalculating = (chainId?: number, hasEgProgram?: boolean) =>
  chainId !== undefined && !!hasEgProgram && EG_CALCULATING_CHAINS.includes(chainId);
