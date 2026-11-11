import { useState } from 'react'

export type RecipientAddressType = { mode: 'evm' } | { mode: 'nonEvm'; networkName: string }

/** null follows the connected wallet; a non-empty string is an explicit recipient. */
export const useEvmRecipient = (account?: string) => {
  const [customRecipient, setCustomRecipient] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  return {
    recipient: customRecipient ?? account ?? '',
    inputValue: customRecipient ?? '',
    hasCustomRecipient: customRecipient !== null,
    expanded,
    setRecipient: (value: string) => setCustomRecipient(value || null),
    useMyWallet: () => setCustomRecipient(null),
    toggleExpanded: () => setExpanded(previous => !previous),
    applyRecipient: (value: string) => {
      setCustomRecipient(value || null)
      setExpanded(true)
    },
  }
}
