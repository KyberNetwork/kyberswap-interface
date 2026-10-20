import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { TokenSelectionContext } from 'components/TokenSelectorModal/types'
import { getNeedsImport } from 'components/TokenSelectorModal/utils'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useIsTokenRestricted, useNotifyRestrictedToken } from 'hooks/useRestrictedTokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useIsTokenImported } from 'state/user/hooks'
import { isTokenNative } from 'utils/tokenInfo'

type Selection = {
  currency: Currency
  context: TokenSelectionContext
  imported?: boolean
  needsChainSwitch: boolean
}
type SelectionStep =
  | { kind: 'idle' }
  | { kind: 'import'; selection: Selection }
  | { kind: 'confirm-chain'; selection: Selection }
  | { kind: 'switching-chain'; selection: Selection }

type Props = {
  isOpen: boolean
  anchorChainId: ChainId
  trackingSource?: string
  onCurrencySelect?: (currency: Currency) => void
  onCurrencyImport?: (token: Token) => void
  chainSelectionMode?: 'wallet' | 'form'
  onSelectChain?: (chainId: ChainId) => void
  onDismiss?: () => void
}

/** Owns the complete selection transaction. List rows only request a pick or an import. */
export const useTokenSelection = ({
  isOpen,
  anchorChainId,
  trackingSource,
  onCurrencySelect,
  onCurrencyImport,
  chainSelectionMode = 'wallet',
  onSelectChain,
  onDismiss,
}: Props) => {
  const [step, setStep] = useState<SelectionStep>({ kind: 'idle' })
  const { chainId: appChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const isImported = useIsTokenImported()
  const isRestricted = useIsTokenRestricted()
  const notifyRestricted = useNotifyRestrictedToken()
  const { trackingHandler } = useTracking()
  // Invalidates callbacks from an earlier wallet request or modal session.
  const generation = useRef(0)
  const openRef = useRef(isOpen)
  openRef.current = isOpen

  const reset = useCallback(() => {
    generation.current += 1
    setStep({ kind: 'idle' })
  }, [])
  useEffect(() => {
    if (!isOpen) reset()
    return () => {
      generation.current += 1
    }
  }, [isOpen, reset])

  const dismiss = useCallback(() => {
    reset()
    onDismiss?.()
  }, [reset, onDismiss])

  const commitSelection = useCallback(
    (selection: Selection) => {
      const { currency, context } = selection
      if (!openRef.current) return
      if (isRestricted(currency)) {
        notifyRestricted(currency)
        reset()
        return
      }
      if (onSelectChain && currency.chainId !== anchorChainId) onSelectChain(currency.chainId)
      trackingHandler(TRACKING_EVENT_TYPE.TS_TOKEN_SELECTED, {
        source: trackingSource,
        tab: context.tab,
        token_symbol: currency.symbol,
        token_address: isTokenNative(currency) ? 'NATIVE' : currency.wrapped.address,
        chain: NETWORKS_INFO[currency.chainId].name,
        chain_id: currency.chainId,
        row_index: context.rowIndex,
        is_search_result: !!context.query,
        selection_method: context.method,
        needs_chain_switch: selection.needsChainSwitch,
      })
      onCurrencySelect?.(currency)
      dismiss()
    },
    [
      anchorChainId,
      onSelectChain,
      trackingHandler,
      trackingSource,
      onCurrencySelect,
      dismiss,
      isRestricted,
      notifyRestricted,
      reset,
    ],
  )

  const openImport = useCallback(
    (selection: Selection) => {
      setStep({ kind: 'import', selection })
      onCurrencyImport?.(selection.currency.wrapped)
    },
    [onCurrencyImport],
  )

  const importOrSelectToken = useCallback(
    (selection: Selection) => {
      const { currency, imported } = selection
      if (!imported && getNeedsImport(currency, address => isImported(currency.chainId, address), true)) {
        openImport(selection)
        return
      }
      commitSelection(selection)
    },
    [isImported, openImport, commitSelection],
  )

  const requestSelection = useCallback(
    (currency: Currency, context: TokenSelectionContext, intent: 'select' | 'import' = 'select') => {
      if (!openRef.current) return
      const resolved = isTokenNative(currency) ? NativeCurrencies[currency.chainId] : currency
      if (isRestricted(resolved)) {
        notifyRestricted(resolved)
        return
      }
      generation.current += 1
      const selection = { currency: resolved, context, needsChainSwitch: resolved.chainId !== anchorChainId }
      if (intent === 'import') openImport(selection)
      else if (resolved.chainId !== anchorChainId && !onSelectChain && chainSelectionMode === 'wallet') {
        setStep({ kind: 'confirm-chain', selection })
      } else importOrSelectToken(selection)
    },
    [anchorChainId, onSelectChain, chainSelectionMode, isRestricted, notifyRestricted, openImport, importOrSelectToken],
  )

  const confirmImport = useCallback(
    (currencies: Currency[]) => {
      if (step.kind !== 'import' || !currencies[0] || !openRef.current) return
      const selection = { ...step.selection, currency: currencies[0], imported: true }
      if (selection.currency.chainId !== anchorChainId && !onSelectChain && chainSelectionMode === 'wallet') {
        setStep({ kind: 'confirm-chain', selection })
      } else commitSelection(selection)
    },
    [step, anchorChainId, onSelectChain, chainSelectionMode, commitSelection],
  )

  const confirmChain = useCallback(() => {
    if (step.kind !== 'confirm-chain' || !openRef.current) return
    const requestId = ++generation.current
    setStep({ kind: 'switching-chain', selection: step.selection })
    void changeNetwork(step.selection.currency.chainId, undefined, () => {
      if (requestId === generation.current) reset()
    })
  }, [step, changeNetwork, reset])

  // Commit after the app's network-param sync has reset its default pair. A close/reopen or
  // cancelled request invalidates this timer, including when the wallet replies much later.
  useEffect(() => {
    if (!isOpen || step.kind !== 'switching-chain' || step.selection.currency.chainId !== appChainId) return
    const requestId = generation.current
    const timer = setTimeout(() => {
      if (requestId === generation.current && openRef.current) importOrSelectToken(step.selection)
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen, step, appChainId, importOrSelectToken])

  return {
    requestSelection,
    dismiss,
    reset,
    confirmImport,
    confirmChain,
    importToken: step.kind === 'import' ? step.selection.currency.wrapped : undefined,
    switchChainToken: step.kind === 'confirm-chain' ? step.selection.currency : null,
  }
}
