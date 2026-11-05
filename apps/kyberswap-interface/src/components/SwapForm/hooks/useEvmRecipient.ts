import { useState } from 'react'

/** null follows the connected wallet; a string is an explicit recipient, including an empty input. */
export const useEvmRecipient = (account?: string) => {
  const [customRecipient, setCustomRecipient] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  return {
    recipient: customRecipient ?? account ?? '',
    inputValue: customRecipient ?? '',
    expanded,
    canUseMyWallet: !!account && customRecipient !== null,
    setRecipient: (value: string) => setCustomRecipient(value),
    useMyWallet: () => setCustomRecipient(null),
    toggleExpanded: () => setExpanded(previous => !previous),
  }
}
