import { useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'

import { MenuOption } from '../PoolExplorer/DropdownMenu'

export default function useFilter({
  supportedDexes,
  supportedChains,
}: {
  supportedDexes: MenuOption[]
  supportedChains: MenuOption[]
}) {
  const { account, chainId } = useActiveWeb3React()
  const [filters, setFilters] = useState({
    addresses: account || '',
    chainIds: '',
    protocols: '',
  })

  const onFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]:
        key === 'chainIds'
          ? supportedChains.find(chain => chain.value === value)?.value
          : supportedDexes.find(dex => dex.value === value)?.value,
    }))
  }

  useEffect(() => {
    setFilters(prev => ({ ...prev, addresses: account || '' }))
  }, [account])

  useEffect(() => {
    if (!filters.chainIds && supportedChains.length) {
      setFilters(prev => ({
        ...prev,
        chainIds: (
          supportedChains.find(chain => chain.value === chainId)?.value ||
          supportedChains[0]?.value ||
          ''
        ).toString(),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, supportedChains])

  return { filters, onFilterChange }
}
