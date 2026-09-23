import { NATIVE_TOKEN_ADDRESS, Token as TokenSchema } from '@kyber/schema'
import { MAX_TOKENS } from '@kyber/token-selector'
import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { NativeCurrencies } from 'constants/tokens'
import { DepositRow, toRows } from 'pages/Earns/components/VaultDeposit/useDepositForm'

const USDT = new Token(1, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT')
const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const WETH = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH')
const ETH = NativeCurrencies[1]

const row = (currency: Currency, typedValue = ''): DepositRow => ({ currency, typedValue })

const token = (currency: Currency): TokenSchema => ({
  address: currency.isNative ? NATIVE_TOKEN_ADDRESS : currency.wrapped.address,
  symbol: currency.symbol ?? '',
  name: currency.name ?? '',
  decimals: currency.decimals,
})

const symbols = (rows: DepositRow[]) => rows.map(item => item.currency.symbol)

describe('toRows', () => {
  it('builds one row per token, in the order the selector lists them', () => {
    expect(symbols(toRows([USDT, USDC, WETH].map(token), [], 1))).toEqual(['USDT', 'USDC', 'WETH'])
  })

  it('keeps what a token already has typed against it', () => {
    const current = [row(USDT, '100'), row(USDC, '250')]

    expect(toRows([USDC, USDT].map(token), current, 1)).toEqual([row(USDC, '250'), row(USDT, '100')])
  })

  it('starts a token the form did not hold with an empty amount', () => {
    const rows = toRows([USDT, WETH].map(token), [row(USDT, '100')], 1)

    expect(rows[1]).toEqual({ currency: WETH, logo: undefined, typedValue: '', percent: undefined })
  })

  // Two rows of the same token would share an approval step id and corrupt the sequence.
  it('lists a repeated token once', () => {
    expect(symbols(toRows([USDT, USDC, USDT].map(token), [], 1))).toEqual(['USDT', 'USDC'])
  })

  // The same token reached through different casing is still the same token.
  it('matches addresses regardless of case', () => {
    const lowercased = new Token(1, USDT.address.toLowerCase(), 6, 'USDT')

    expect(toRows([lowercased, USDT].map(token), [], 1)).toHaveLength(1)
  })

  // Native currency is held under the sentinel, so it must not collide with its wrapped form.
  it('treats native currency and its wrapped token as different rows', () => {
    expect(symbols(toRows([ETH, WETH].map(token), [], 1))).toEqual(['ETH', 'WETH'])
    expect(NATIVE_TOKEN_ADDRESS.toLowerCase()).not.toBe(WETH.address.toLowerCase())
  })

  it('reuses the row already holding a token rather than rebuilding it', () => {
    const existing = row(ETH, '2')

    expect(toRows([token(ETH)], [existing], 1)[0]).toBe(existing)
  })

  it('stops at the number of tokens a route can take', () => {
    const many = Array.from(
      { length: MAX_TOKENS + 2 },
      (_, index) => new Token(1, `0x${String(index + 1).padStart(40, '0')}`, 18, `T${index}`),
    )

    expect(toRows(many.map(token), [], 1)).toHaveLength(MAX_TOKENS)
  })
})
