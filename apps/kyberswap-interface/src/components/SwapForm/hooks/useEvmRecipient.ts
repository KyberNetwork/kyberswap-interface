import { useMemo, useState } from 'react'

export type RecipientAddressType = { mode: 'evm' } | { mode: 'nonEvm'; networkName: string }

/** null follows the connected wallet; a non-empty string is an explicit recipient. */
export type EvmRecipient = ReturnType<typeof useLocalEvmRecipient>

export const useEvmRecipient = (account?: string, shared?: EvmRecipient): EvmRecipient => {
  const local = useLocalEvmRecipient(account)
  return shared ?? local
}

const useLocalEvmRecipient = (account?: string) => {
  const [customRecipient, setCustomRecipient] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  return useMemo(
    () => ({
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
    }),
    [account, customRecipient, expanded],
  )
}
