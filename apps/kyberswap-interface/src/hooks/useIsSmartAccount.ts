import { useBytecode, useCapabilities } from 'wagmi'

import { useActiveWeb3React } from 'hooks'
import { Address } from 'utils/viem'

// An EIP-7702 delegated EOA's on-chain code is the 23-byte delegation
// designator `0xef0100 ‖ <20-byte delegate>` (EIP-7702 §"Delegation
// designation"). Such an account keeps its private key and signs typed data
// with standard ECDSA, so its permits stay ecrecover-verifiable — it must be
// treated as a regular EOA, not a smart account.
const EIP_7702_DELEGATION_PREFIX = '0xef0100'

/**
 * Returns true when the connected account is a smart-contract account
 * (account abstraction wallet like Coinbase Smart Wallet, Argent, Ambire,
 * etc.) rather than a regular EOA.
 *
 * Smart accounts produce EIP-1271 contract signatures that can't be verified
 * via ecrecover, so flows relying on standard ECDSA permits must skip them.
 *
 * Detection runs two probes:
 *   1. `eth_getCode(account)` — catches deployed smart wallets. An EIP-7702
 *      delegated EOA also carries on-chain code, but its code is just a
 *      delegation designator and it still signs with its own ECDSA key, so it
 *      is excluded here and treated as a regular EOA.
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
  const hasOnChainCode =
    !!bytecode && bytecode !== '0x' && !bytecode.toLowerCase().startsWith(EIP_7702_DELEGATION_PREFIX)

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
