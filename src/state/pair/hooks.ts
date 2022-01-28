import { PairState, usePair, usePairs } from 'data/Reserves'
import { Currency, ETHER, Pair, Token } from '@dynamic-amm/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { Field, selectCurrency } from './actions'
import { useAllTokens } from 'hooks/Tokens'

export function usePairState(): AppState['pair'] {
  return useSelector<AppState, AppState['pair']>(state => state.pair)
}

export function usePairActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency instanceof Token ? currency.address : currency === ETHER ? 'ETH' : ''
        })
      )
    },
    [dispatch]
  )

  return {
    onCurrencySelection
  }
}

export function useDerivedPairInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  currencies: { [field in Field]?: Currency }
  pairs: [PairState, Pair | null][]
} {
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )
  const pairs = usePair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  return {
    currencies,
    pairs
  }
}

export function useDerivedPairInfoFromOneOrTwoCurrencies(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  currencies: { [field in Field]?: Currency }
  pairs: [PairState, Pair | null][]
} {
  // When 2 currencies are defined.
  const definedCurrency: Currency | undefined = currencyA ?? currencyB ?? undefined
  const { currencies, pairs: fromTwoCurrenciesPairs } = useDerivedPairInfo(currencyA, currencyB)

  // When 1 currency is defined.
  const tokens = Object.values(useAllTokens())
  const fromOneCurrencyTuples: [Token, Currency | undefined][] = tokens.map(token => [token, definedCurrency])
  const fromOneCurrencyPairs = usePairs(fromOneCurrencyTuples)

  // When 0 currency is defined.
  const fromZeroCurrencyTuples: [Token, Token][] = []
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      fromZeroCurrencyTuples.push([tokens[i], tokens[j]])
    }
  }
  const fromZeroCurrencyPairs = usePairs(fromZeroCurrencyTuples)

  return useMemo(() => {
    if (currencyA && currencyB)
      return {
        currencies,
        pairs: fromTwoCurrenciesPairs
      }

    if (currencyA || currencyB)
      return {
        currencies,
        pairs: fromOneCurrencyPairs.flat()
      }

    return {
      currencies,
      pairs: fromZeroCurrencyPairs.flat()
    }
  }, [currencies, currencyA, currencyB, fromZeroCurrencyPairs, fromOneCurrencyPairs, fromTwoCurrenciesPairs])
}
