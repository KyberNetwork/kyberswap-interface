import { useBytecode, useCapabilities } from 'wagmi'

import { useActiveWeb3React } from 'hooks'
import { Address } from 'utils/viem'

/**
 * Returns true when the connected account is a smart-contract account
 * (account abstraction wallet like Coinbase Smart Wallet, Argent, Ambire,
 * EIP-7702 delegated EOAs, etc.) rather than a regular EOA.
 *
 * Smart accounts produce EIP-1271 contract signatures that can't be verified
 * via ecrecover, so flows relying on standard ECDSA permits must skip them.
 *
 * Detection runs two probes:
 *   1. `eth_getCode(account)` — catches already-deployed smart wallets.
 *   2. EIP-5792 `wallet_getCapabilities` — catches counterfactual smart
 *      wallets (e.g. Coinbase Smart Wallet via passkey) where the contract
 *      hasn't been deployed on the current chain yet but the wallet still
 *      signs with an EIP-1271 signature. Smart wallets advertise
 *      `atomicBatch` / `auxiliaryFunds` / `paymasterService` capabilities;
 *      EOAs either don't implement the method or return nothing.
 *
 * Defaults to `false` while probes are in-flight or on error — the permit
 * signing catch path still surfaces a clear "Invalid permit signature"
 * fallback for anything this misses.
 */
export function useIsSmartAccount(): boolean {
  const { account, chainId } = useActiveWeb3React()

  const { data: bytecode } = useBytecode({
    address: account as Address | undefined,
    chainId: chainId as number,
    query: { enabled: !!account },
  })
  const hasOnChainCode = !!bytecode && bytecode !== '0x'

  const { data: capabilities } = useCapabilities({
    account: account as Address | undefined,
    chainId: chainId as number,
    query: { enabled: !!account },
  })
  const chainCaps = capabilities as Record<string, unknown> | undefined
  const hasSmartCapabilities = !!(
    chainCaps &&
    (chainCaps.atomicBatch || chainCaps.auxiliaryFunds || chainCaps.paymasterService)
  )

  return hasOnChainCode || hasSmartCapabilities
}
