import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

/**
 * Switch the app/wallet to `token`'s chain and then select it — but only once the app is actually on
 * that chain, deferred a tick so the selection lands AFTER the network-param sync that resets the
 * swap pair to the chain's defaults (otherwise the picked token is clobbered back to a default).
 *
 * Keys off the Redux chain (`useActiveWeb3React`), which updates on switch whether or not a wallet is
 * connected — so it never hangs waiting on a wallet chain that won't move. Calls the latest
 * select/dismiss handlers via refs; a rejected/failed switch drops the pending selection.
 *
 * Shared by the row cross-chain flow (after the Switch-Chain confirm) and the import flow (which has
 * no separate confirm — the import itself is the confirmation).
 */
export function usePendingCrossChainSelect(
  onSelect?: (currency: Currency) => void,
  onDismiss?: () => void,
): { switchChainAndSelect: (token: Currency) => void; resetPending: () => void } {
  const { chainId: appChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [pending, setPending] = useState<Currency | null>(null)

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const switchChainAndSelect = useCallback(
    (token: Currency) => {
      setPending(token)
      changeNetwork(token.chainId, undefined, () => setPending(null))
    },
    [changeNetwork],
  )

  useEffect(() => {
    if (!pending || pending.chainId !== appChainId) return
    const token = pending
    const timer = setTimeout(() => {
      setPending(null)
      onSelectRef.current?.(token)
      onDismissRef.current?.()
    }, 0)
    return () => clearTimeout(timer)
  }, [pending, appChainId])

  const resetPending = useCallback(() => setPending(null), [])

  return { switchChainAndSelect, resetPending }
}
