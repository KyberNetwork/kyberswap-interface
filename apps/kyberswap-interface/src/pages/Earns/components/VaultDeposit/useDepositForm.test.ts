import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { NativeCurrencies } from 'constants/tokens'
import { DepositRow, dropDuplicateToken } from 'pages/Earns/components/VaultDeposit/useDepositForm'

const USDT = new Token(1, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT')
const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const WETH = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH')
const ETH = NativeCurrencies[1]

const row = (currency: Currency, typedValue = ''): DepositRow => ({ currency, typedValue })

const symbols = (rows: DepositRow[]) => rows.map(item => item.currency.symbol)

describe('dropDuplicateToken', () => {
  it('leaves a list of distinct tokens alone', () => {
    const rows = [row(USDT), row(USDC), row(WETH)]

    expect(dropDuplicateToken(rows, 1)).toEqual(rows)
  })

  // Picking a token another row already holds moves it to the row being edited.
  it('drops the other row holding the same token', () => {
    const rows = [row(USDT, '100'), row(USDC), row(USDT, '400')]

    expect(symbols(dropDuplicateToken(rows, 2))).toEqual(['USDC', 'USDT'])
  })

  it('keeps the edited row, not the one it displaced', () => {
    const rows = [row(USDT, '100'), row(USDT, '400')]

    expect(dropDuplicateToken(rows, 1)).toEqual([row(USDT, '400')])
  })

  // The same token reached through different casing is still the same token.
  it('matches addresses regardless of case', () => {
    const lowercased = new Token(1, USDT.address.toLowerCase(), 6, 'USDT')
    const rows = [row(lowercased), row(USDT)]

    expect(dropDuplicateToken(rows, 1)).toHaveLength(1)
  })

  // Native currency is held under the sentinel, so it must not collide with its wrapped form.
  it('treats native currency and its wrapped token as different rows', () => {
    const rows = [row(ETH), row(WETH)]

    expect(dropDuplicateToken(rows, 1)).toEqual(rows)
    expect(NATIVE_TOKEN_ADDRESS.toLowerCase()).not.toBe(WETH.address.toLowerCase())
  })

  it('returns the list untouched when the index is out of range', () => {
    const rows = [row(USDT), row(USDT)]

    expect(dropDuplicateToken(rows, 5)).toEqual(rows)
  })
})
