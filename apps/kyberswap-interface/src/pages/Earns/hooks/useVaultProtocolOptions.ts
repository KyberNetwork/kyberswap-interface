import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useVaultListQuery } from 'services/vault'

export const ALL_PROTOCOLS_VALUE = ''

/** Protocol filter options built from the providers the API actually serves. */
const useVaultProtocolOptions = () => {
  const { data } = useVaultListQuery({ pageSize: 100 })

  return useMemo(() => {
    const byKey = new Map<string, { label: string; value: string; icon: string }>()

    ;(data?.vaults || []).forEach(vault => {
      const provider = vault.provider
      if (!provider?.key || byKey.has(provider.key)) return
      byKey.set(provider.key, { label: provider.name || provider.key, value: provider.key, icon: provider.logo })
    })

    return [{ label: t`All Protocols`, value: ALL_PROTOCOLS_VALUE, icon: '' }, ...Array.from(byKey.values())]
  }, [data?.vaults])
}

export default useVaultProtocolOptions
