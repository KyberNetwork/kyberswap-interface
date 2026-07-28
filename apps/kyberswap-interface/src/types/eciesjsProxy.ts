// ESM proxy for `eciesjs`. The package's named exports are defined via
// `Object.defineProperty(exports, X, { get })`, which esbuild's CJS analyzer
// doesn't extract. Namespace import + explicit re-export captures the getter
// values into ES module bindings the MetaMask SDK can destructure.
// Sub-path import bypasses the bare-specifier alias that points back here.
// @ts-expect-error -- transitive dep, no local type resolution
import * as eciesjs from 'eciesjs/dist/index.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ns = eciesjs as any

export const PrivateKey = ns.PrivateKey
export const PublicKey = ns.PublicKey
export const encrypt = ns.encrypt
export const decrypt = ns.decrypt
export const utils = ns.utils
export const ECIES_CONFIG = ns.ECIES_CONFIG

export default ns
