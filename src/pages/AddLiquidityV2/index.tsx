import { WETH } from '@vutien/sdk-core'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import React, { useContext, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import { useMintState } from 'state/mint/hooks'
import { useDerivedMintInfo } from 'state/mint/v2/hooks'
import { useIsExpertMode } from 'state/user/hooks'
import { ThemeContext } from 'styled-components'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const oneCurrencyIsWETH = Boolean(
    chainId && ((currencyA && currencyA.equals(WETH[chainId])) || (currencyB && currencyB.equals(WETH[chainId])))
  )
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {} = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)
}
