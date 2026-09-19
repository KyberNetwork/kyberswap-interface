import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKENS, NativeCurrencies } from 'constants/tokens'
import {
  amountFromRoute,
  fromNativeUnits,
  hasNativeErc20Interface,
  isNativeAsset,
  isNativeErc20,
  nativeBalanceAmount,
  paysNativeOnSwap,
  routeAmountIn,
  routeTokenAddress,
  routeTokenDecimals,
  swapTxValue,
  toNativeUnits,
} from 'utils/nativeErc20'

const arcUsdc = WETH[ChainId.ARC]
const baseWeth = WETH[ChainId.BASE]
const eurc = new Token(ChainId.ARC, '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1', 6, 'EURC', 'EURC')

const oneUsdc = CurrencyAmount.fromRawAmount(arcUsdc, '1000000')

describe('Arc USDC decimals', () => {
  // These two differing is the whole reason this module exists. Code that "fixes" the mismatch by
  // aligning them looks like a cleanup and silently rescales every amount by 10^12.
  it('keeps the ERC-20 interface at 6 decimals and the native one at 18', () => {
    expect(arcUsdc.decimals).toBe(6)
    expect(arcUsdc.address).toBe('0x3600000000000000000000000000000000000000')
    // The native interface keeps 18 decimals so wallets and eth_getBalance behave normally, but it
    // survives only as chain config — the app never holds a currency in those units.
    expect(NETWORKS_INFO[ChainId.ARC].nativeToken.decimal).toBe(18)
    expect(NativeCurrencies[ChainId.ARC].decimals).toBe(6)
  })

  it('declares the ERC-20 interface on the chain config', () => {
    expect(hasNativeErc20Interface(ChainId.ARC)).toBe(true)
    expect(hasNativeErc20Interface(ChainId.BASE)).toBe(false)
    expect(NETWORKS_INFO[ChainId.ARC].nativeToken.erc20Interface?.payNativeOnSwap).toBe(true)
  })
})

describe('canonical currency', () => {
  // The whole design rests on this: the app's currency for Arc's native asset is the ERC-20 token,
  // so `.wrapped` is an identity and no code path can cross the two interfaces by accident.
  it('is the ERC-20 token on Arc so `.wrapped` never rescales', () => {
    const currency = NativeCurrencies[ChainId.ARC]
    expect(currency.isNative).toBe(false)
    expect(currency.equals(arcUsdc)).toBe(true)
    expect(currency.wrapped.decimals).toBe(currency.decimals)
  })

  it('stays the native currency on chains with a real wrapped-native contract', () => {
    expect(NativeCurrencies[ChainId.BASE].isNative).toBe(true)
  })
})

describe('native balance reading', () => {
  it('scales an eth_getBalance reading down into ERC-20 units on Arc', () => {
    // Real reading for an account holding 1.9995485 USDC: the ERC-20 interface cannot represent the
    // trailing dust, so the amount matches what balanceOf reports rather than rounding up.
    expect(nativeBalanceAmount('1999548500000000000', ChainId.ARC).quotient.toString()).toBe('1999548')
  })

  it('leaves the reading alone on chains with a real native currency', () => {
    expect(nativeBalanceAmount('1999548500000000000', ChainId.BASE).quotient.toString()).toBe('1999548500000000000')
  })
})

describe('identification', () => {
  it('recognises only the chain’s own ERC-20 interface', () => {
    expect(isNativeErc20(arcUsdc)).toBe(true)
    expect(isNativeErc20(eurc)).toBe(false)
    expect(isNativeErc20(baseWeth)).toBe(false)
    expect(isNativeErc20(NativeCurrencies[ChainId.BASE])).toBe(false)
    expect(isNativeErc20(undefined)).toBe(false)
  })

  it('pays native on swap only where the chain opts in', () => {
    expect(paysNativeOnSwap(arcUsdc)).toBe(true)
    expect(paysNativeOnSwap(eurc)).toBe(false)
    expect(paysNativeOnSwap(baseWeth)).toBe(false)
  })

  it('names the native asset in either form', () => {
    expect(isNativeAsset(NativeCurrencies[ChainId.BASE])).toBe(true)
    expect(isNativeAsset(arcUsdc)).toBe(true)
    expect(isNativeAsset(eurc)).toBe(false)
    expect(isNativeAsset(undefined)).toBe(false)
  })

  // Cross-chain quotes and stored transaction history reach the logo as tokens parsed from JSON, which carry
  // none of the SDK's methods, so the check has to work from their fields alone.
  it('names the native asset in a token parsed from JSON, which has no methods', () => {
    const parsed = (token: Token) =>
      JSON.parse(JSON.stringify({ chainId: token.chainId, address: token.address, symbol: token.symbol }))
    expect(isNativeAsset(parsed(arcUsdc))).toBe(true)
    expect(isNativeAsset(parsed(eurc))).toBe(false)
    expect(isNativeAsset(parsed(baseWeth))).toBe(false)
  })
})

describe('unit conversion', () => {
  it('is an identity on chains without an ERC-20 native interface', () => {
    // The helpers are exported, so a caller off the Arc path must not be silently rescaled by 10^18.
    const oneWeth = CurrencyAmount.fromRawAmount(baseWeth, '1')
    expect(toNativeUnits(oneWeth)).toBe('1')
    expect(fromNativeUnits('1', baseWeth)).toBe('1')
  })

  it('scales ERC-20 units up to native units exactly', () => {
    expect(toNativeUnits(oneUsdc)).toBe('1000000000000000000')
  })

  it('round-trips through the native interface', () => {
    expect(fromNativeUnits(toNativeUnits(oneUsdc), arcUsdc)).toBe('1000000')
  })

  it('throws rather than truncating a native amount that is not a whole ERC-20 amount', () => {
    // Dust below 1e-6 USDC exists in the native balance but cannot be represented in ERC-20 units.
    expect(() => fromNativeUnits('1000000000000000001', arcUsdc)).toThrow()
  })
})

describe('aggregator request', () => {
  it('sends the native sentinel and native decimals for Arc USDC being paid', () => {
    expect(routeTokenAddress(arcUsdc, 'in')).toBe(ETHER_ADDRESS)
    expect(routeTokenDecimals(arcUsdc, 'in')).toBe(18)
    expect(routeAmountIn(oneUsdc)).toBe('1000000000000000000')
  })

  // Paying through the native interface is about the payment, not the quote. Quoting the output side
  // in native units would make the app read a backend-computed amount back through a conversion that
  // only holds for amounts the app itself chose.
  it('quotes Arc USDC as an ordinary token when it is what the user receives', () => {
    expect(routeTokenAddress(arcUsdc, 'out')).toBe(arcUsdc.address)
    expect(routeTokenDecimals(arcUsdc, 'out')).toBe(6)
    expect(amountFromRoute('1085432987654321098', arcUsdc, 'out')).toBe('1085432987654321098')
  })

  it('leaves every other token alone', () => {
    expect(routeTokenAddress(eurc, 'in')).toBe(eurc.address)
    expect(routeTokenDecimals(eurc, 'in')).toBe(6)
    expect(routeAmountIn(CurrencyAmount.fromRawAmount(eurc, '1000000'))).toBe('1000000')
    expect(routeTokenAddress(NativeCurrencies[ChainId.BASE], 'out')).toBe(ETHER_ADDRESS)
  })

  it('reads the paid amount back into the currency’s own units', () => {
    expect(amountFromRoute('1000000000000000000', arcUsdc, 'in')).toBe('1000000')
    expect(amountFromRoute('1000000', eurc, 'in')).toBe('1000000')
  })
})

describe('transaction value', () => {
  it('sends the amount as msg.value for Arc USDC', () => {
    expect(swapTxValue(oneUsdc)).toBe(1000000000000000000n)
  })

  it('sends nothing for an ordinary ERC-20', () => {
    expect(swapTxValue(CurrencyAmount.fromRawAmount(eurc, '1000000'))).toBe(0n)
  })

  it('still sends the full amount for a real native currency', () => {
    expect(swapTxValue(CurrencyAmount.fromRawAmount(NativeCurrencies[ChainId.BASE], '5'))).toBe(5n)
  })
})

describe('default swap pair', () => {
  // Every other chain quotes its native asset against a stablecoin. Arc's native asset is the
  // stablecoin, so the pair opens the other way round — and the two sides have to differ, or the
  // guard against a pair of identical tokens clears the output and the form opens half empty.
  it('opens Arc on the native currency against a different token', () => {
    const output = DEFAULT_OUTPUT_TOKENS[ChainId.ARC]
    expect(output?.symbol).toBe('WETH')
    expect(NativeCurrencies[ChainId.ARC].equals(output as Token)).toBe(false)
  })
})

describe('one currency, several ids', () => {
  // A currency answers to its address, its symbol, and — where the native asset is an ERC-20 token —
  // the native sentinel as well. `useOutputCurrency` compares the resolved pair for exactly this
  // reason: a URL like `0xEeee…-to-usdc` names one token twice while reading as two distinct ids.
  it('resolves the native sentinel to the same currency as the token on Arc', () => {
    expect(NativeCurrencies[ChainId.ARC].equals(arcUsdc)).toBe(true)
  })

  // The same comparison must leave a genuine wrap pair alone, or ETH -> WETH would stop working.
  it('keeps native and wrapped distinct on a chain with a real wrapper', () => {
    expect(NativeCurrencies[ChainId.BASE].equals(baseWeth)).toBe(false)
  })
})
