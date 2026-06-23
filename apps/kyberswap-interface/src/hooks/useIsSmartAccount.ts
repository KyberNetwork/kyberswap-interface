import { useBytecode, useCapabilities } from 'wagmi'

import { CONNECTION } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
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
 *   1. `eth_getCode(account)` — catches already-deployed smart wallets and
 *      EIP-7702 delegated EOAs. This is per-chain: an EOA delegated only on
 *      one chain reports code (and so is "smart") only there, which is exactly
 *      where its permit would route to EIP-1271 verification on-chain.
 *   2. EIP-5792 `wallet_getCapabilities`, scoped to the Coinbase connector —
 *      catches a counterfactual Coinbase Smart Wallet (passkey) that has no
 *      bytecode yet but still signs with EIP-1271. Coinbase exposes both a
 *      Smart Wallet and a plain EOA under one connector id, so capabilities are
 *      the only way to tell them apart there. The probe is deliberately NOT
 *      applied to other wallets: MetaMask / Rabby / WalletConnect advertise
 *      `atomic` / `auxiliaryFunds` / `paymasterService` capabilities too while
 *      still being EOAs whose ECDSA permits verify fine, so checking them
 *      globally false-positives every modern EOA.
 *
 * Defaults to `false` while probes are in-flight or on error — the permit
 * signing catch path still surfaces a clear "Invalid permit signature"
 * fallback for anything this misses.
 */
export function useIsSmartAccount(): boolean {
  const { account, chainId } = useActiveWeb3React()
  const { connector } = useWeb3React()

  const { data: bytecode } = useBytecode({
    address: account as Address | undefined,
    chainId: chainId as number,
    query: { enabled: !!account },
  })
  const hasOnChainCode = !!bytecode && bytecode !== '0x'

  // Only the Coinbase connector multiplexes a Smart Wallet and a plain EOA under
  // one id, so the capability probe is meaningful only there. Other wallets
  // (MetaMask, Rabby, WalletConnect) advertise EIP-5792 capabilities like
  // `auxiliaryFunds` even as EOAs, so probing them would false-positive.
  const isCoinbaseConnector = connector?.id === CONNECTION.COINBASE_SDK_CONNECTOR_ID

  const { data: capabilities } = useCapabilities({
    account: account as Address | undefined,
    chainId: chainId as number,
    query: { enabled: !!account && isCoinbaseConnector },
  })
  const chainCaps = capabilities as Record<string, unknown> | undefined
  const hasSmartCapabilities =
    isCoinbaseConnector &&
    !!(chainCaps && (chainCaps.atomicBatch || chainCaps.auxiliaryFunds || chainCaps.paymasterService))

  return hasOnChainCode || hasSmartCapabilities
}
