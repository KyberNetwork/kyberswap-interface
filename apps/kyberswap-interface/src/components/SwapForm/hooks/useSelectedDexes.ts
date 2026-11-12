import { ChainId } from '@kyberswap/ks-sdk-core'

import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'

const useSelectedDexes = (chainId?: ChainId) => {
  const allDexes = useAllDexes(chainId)
  const [excludeDexes] = useExcludeDexes(chainId)

  const selectedDexes = allDexes?.filter(item => !excludeDexes.includes(item.id)).map(item => item.id)

  const dexes =
    selectedDexes?.length === allDexes?.length
      ? ''
      : selectedDexes?.join(',').replace('kyberswapv1', 'kyberswap,kyberswap-static') || ''

  return dexes
}

export default useSelectedDexes
