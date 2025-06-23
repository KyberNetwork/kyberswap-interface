import { Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useAllTokens } from 'hooks/Tokens'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'

const useTokenNotInDefault = () => {
  const { currencyIn, currencyOut } = useCurrenciesByPage()

  const urlLoadedTokens: Token[] = useMemo(
    () => [currencyIn, currencyOut]?.filter((c): c is Token => c instanceof Token) ?? [],
    [currencyIn, currencyOut],
  )
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })
  return importTokensNotInDefault
}
export default useTokenNotInDefault
