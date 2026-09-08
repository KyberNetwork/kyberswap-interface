import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useVaultListQuery } from 'services/vault'

import { AllChainsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'

/** Chain filter options built from the vaults the API actually serves, so a newly listed chain
 *  shows up without a frontend release. */
const useVaultChainOptions = () => {
  const { data } = useVaultListQuery({ pageSize: 100 })

  return useMemo(() => {
    const byId = new Map<number, { label: string; value: string; icon: string }>()

    ;(data?.vaults || []).forEach(vault => {
      const chain = vault.chain
      if (!chain?.id || byId.has(chain.id)) return
      byId.set(chain.id, { label: chain.name, value: String(chain.id), icon: chain.logo })
    })

    return [{ ...AllChainsOption, label: t`All Networks` }, ...Array.from(byId.values())]
  }, [data?.vaults])
}

export default useVaultChainOptions
