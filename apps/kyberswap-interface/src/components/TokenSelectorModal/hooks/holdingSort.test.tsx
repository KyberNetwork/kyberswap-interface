// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { expect, it } from 'vitest'

import { AggregateBalances } from 'components/TokenSelectorModal/AllNetworks/types'
import { getHoldingComparator } from 'components/TokenSelectorModal/hooks/holdingSort'
import { tokenRowKey } from 'components/TokenSelectorModal/types'
import { getTokenAddress } from 'utils/tokenInfo'

const sortAggregateBalances = (tokens: Token[], balances: AggregateBalances) =>
  [...tokens].sort(getHoldingComparator(token => balances[tokenRowKey(token.chainId, getTokenAddress(token))]))

const address = '0x0000000000000000000000000000000000000001'
const ethToken = new Token(1, address, 6, 'AAA')
const bnbToken = new Token(56, address, 18, 'BBB')
const third = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'CCC')
const row = (token: Token, raw: string, price: number) => ({
  balance: CurrencyAmount.fromRawAmount(token, raw),
  price,
  waiting: false,
})

it('sorts USD value then normalized balance and keeps same-address chains distinct', () => {
  const currencies = [ethToken, bnbToken, third]
  const balances: AggregateBalances = {
    [tokenRowKey(1, address)]: row(ethToken, '2000000', 10),
    [tokenRowKey(56, address)]: row(bnbToken, '3000000000000000000', 10),
    [tokenRowKey(1, third.address)]: row(third, '100000000000000000000', 0),
  }
  expect(sortAggregateBalances(currencies, balances)).toEqual([bnbToken, ethToken, third])
  expect(sortAggregateBalances(currencies, {})).toEqual(currencies)
  balances[tokenRowKey(1, address)].price = 0
  balances[tokenRowKey(56, address)].price = 0
  expect(sortAggregateBalances(currencies, balances)).toEqual([third, bnbToken, ethToken])
})

it('keeps listed holdings ahead of unlisted tokens and uses favorites only after balances', () => {
  const balances: AggregateBalances = {
    [tokenRowKey(1, address)]: { ...row(ethToken, '1000000', 1) },
    [tokenRowKey(56, address)]: { ...row(bnbToken, '3000000000000000000', 100), unlisted: true },
    [tokenRowKey(1, third.address)]: { ...row(third, '0', 0), favorite: true },
  }
  expect(sortAggregateBalances([third, bnbToken, ethToken], balances)).toEqual([ethToken, bnbToken, third])
  balances[tokenRowKey(56, address)].price = 0
  expect(sortAggregateBalances([third, bnbToken, ethToken], balances)).toEqual([ethToken, third, bnbToken])
  expect(
    sortAggregateBalances([ethToken, third], {
      [tokenRowKey(1, third.address)]: balances[tokenRowKey(1, third.address)],
    }),
  ).toEqual([third, ethToken])
})
