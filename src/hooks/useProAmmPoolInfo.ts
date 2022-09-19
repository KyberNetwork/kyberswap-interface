import { ChainId, Currency } from '@namgold/ks-sdk-core'
import { FeeAmount, computePoolAddress } from '@namgold/ks-sdk-elastic'
import { useMemo } from 'react'

import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

export function useProAmmPoolInfos(
  currencyA: Currency | null | undefined,
  currencyB: Currency | null | undefined,
  feeAmount: (FeeAmount | undefined)[],
): string[] {
  const { chainId } = useActiveWeb3React()
  const proAmmCoreFactoryAddress = isEVM(chainId) && NETWORKS_INFO[chainId].elastic.coreFactory
  return useMemo(
    () =>
      feeAmount.map(fee => {
        return proAmmCoreFactoryAddress && currencyA && currencyB && fee && !currencyA.wrapped.equals(currencyB.wrapped)
          ? computePoolAddress({
              factoryAddress: proAmmCoreFactoryAddress,
              tokenA: currencyA?.wrapped,
              tokenB: currencyB?.wrapped,
              fee: fee,
              initCodeHashManualOverride: NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.initCodeHash,
            })
          : ''
      }),
    [chainId, currencyA, currencyB, proAmmCoreFactoryAddress, feeAmount],
  )
}

export default function useProAmmPoolInfo(
  currencyA: Currency | null | undefined,
  currencyB: Currency | null | undefined,
  feeAmount: FeeAmount | undefined,
): string {
  return useProAmmPoolInfos(currencyA, currencyB, [feeAmount])[0]
}
