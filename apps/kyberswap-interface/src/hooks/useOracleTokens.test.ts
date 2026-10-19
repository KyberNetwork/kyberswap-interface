import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { getOracleLookupAddress } from 'hooks/useOracleTokens'

describe('getOracleLookupAddress', () => {
  const WBNB = WETH[ChainId.BSCMAINNET].address.toLowerCase()

  it('looks a native coin up under its wrapped token', () => {
    expect(getOracleLookupAddress(NativeCurrencies[ChainId.BSCMAINNET])).toBe(WBNB)
  })

  it('treats the token list placeholder for the native coin the same way', () => {
    const listedNative = new Token(ChainId.BSCMAINNET, ETHER_ADDRESS, 18, 'BNB', 'BNB')
    expect(getOracleLookupAddress(listedNative)).toBe(WBNB)
  })

  it('looks any other token up under its own address', () => {
    const usdt = new Token(ChainId.BSCMAINNET, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT')
    expect(getOracleLookupAddress(usdt)).toBe('0x55d398326f99059ff775485246999027b3197955')
  })
})
