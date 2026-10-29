import { useCallback, useEffect, useState } from 'react'

/** Deposits and withdrawals route differently, so each side remembers its own setting. */
export type VaultSlippageScope = 'deposit' | 'withdraw'

const storageKey = (chainId?: number, vaultId?: string, scope?: VaultSlippageScope) =>
  chainId && vaultId && scope ? `kyber_vault_slippage_${chainId}_${vaultId}_${scope}` : undefined

const read = (key?: string) => {
  if (!key || typeof window === 'undefined') return undefined
  try {
    const saved = Number.parseInt(localStorage.getItem(key) ?? '', 10)
    return Number.isFinite(saved) && saved > 0 ? saved : undefined
  } catch {
    // A browser that refuses storage still gets a working form, just not a remembered choice.
    return undefined
  }
}

const write = (key: string | undefined, bps: number) => {
  if (!key || typeof window === 'undefined') return
  try {
    localStorage.setItem(key, String(bps))
  } catch {
    /* nothing to do: the setting still applies to this session */
  }
}

/**
 * Slippage for one vault flow, remembered between visits the way the zap flows remember theirs per
 * pool. A setting the user chose here wins; otherwise the form follows `defaultBps`, which moves
 * with the tokens being spent.
 */
export const useVaultSlippage = ({
  chainId,
  vaultId,
  scope,
  defaultBps,
}: {
  chainId?: number
  vaultId?: string
  scope: VaultSlippageScope
  defaultBps: number
}) => {
  const key = storageKey(chainId, vaultId, scope)
  const [chosen, setChosen] = useState(() => read(key))

  useEffect(() => {
    setChosen(read(key))
  }, [key])

  const setSlippage = useCallback(
    (bps: number) => {
      setChosen(bps)
      write(key, bps)
    },
    [key],
  )

  return { slippage: chosen ?? defaultBps, setSlippage }
}
