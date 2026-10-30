import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { NativeCurrencies } from 'constants/tokens'

import { useBalanceAmountShortcuts } from './useBalanceAmountShortcuts'

const readShortcuts = (balance: CurrencyAmount<Currency> | undefined, value = '') => {
  const onChange = vi.fn()
  let shortcuts: ReturnType<typeof useBalanceAmountShortcuts> | undefined
  const Probe = () => {
    shortcuts = useBalanceAmountShortcuts(balance, value, onChange, 'order-amount')
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  if (!shortcuts) throw new Error('Shortcuts did not render')
  return { shortcuts, onChange }
}

describe('order balance shortcuts', () => {
  it.each([
    [ChainId.MAINNET, '0.995'],
    [ChainId.BASE, '0.9998'],
  ])('reserves native gas only for Max on chain %s', (chainId, expectedMax) => {
    const balance = CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], '1000000000000000000')
    const { shortcuts, onChange } = readShortcuts(balance, expectedMax)

    shortcuts.forEach(shortcut => shortcut.onClick())

    expect(onChange.mock.calls).toEqual([['0.25'], ['0.5'], [expectedMax]])
    expect(shortcuts.map(shortcut => shortcut.active)).toEqual([false, false, true])
  })

  it.each([
    ['0', '0'],
    ['100000000000000', '0.0001'],
    ['200000000000000', '0'],
  ])('matches Swap Max when native balance %s is at or below the reserve', (rawBalance, expectedMax) => {
    const balance = CurrencyAmount.fromRawAmount(NativeCurrencies[ChainId.BASE], rawBalance)
    const { shortcuts, onChange } = readShortcuts(balance)

    shortcuts[2].onClick()

    expect(onChange).toHaveBeenCalledWith(expectedMax)
  })

  it('uses the full wrapped-token balance for Max', () => {
    const balance = CurrencyAmount.fromRawAmount(WETH[ChainId.BASE], '1000000000000000000')
    const { shortcuts, onChange } = readShortcuts(balance, '1')

    shortcuts[2].onClick()

    expect(onChange).toHaveBeenCalledWith('1')
    expect(shortcuts[2].active).toBe(true)
  })

  it('reserves gas in the native ERC-20 token decimals', () => {
    const balance = CurrencyAmount.fromRawAmount(NativeCurrencies[ChainId.ARC], '1000000')
    const { shortcuts, onChange } = readShortcuts(balance)

    shortcuts[2].onClick()

    expect(onChange).toHaveBeenCalledWith('0.5')
  })

  it('does not change the input before the balance is available', () => {
    const { shortcuts, onChange } = readShortcuts(undefined)

    shortcuts.forEach(shortcut => shortcut.onClick())

    expect(onChange).not.toHaveBeenCalled()
  })
})
