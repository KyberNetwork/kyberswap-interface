import { describe, expect, it } from 'vitest';

import { ChainId, NATIVE_TOKEN_ADDRESS } from '@kyber/schema';

import { nativeErc20Scale } from '../crypto';
import { isPaidAsNative, toZapInputToken, toZapPayment, toZapPayments } from './zap';

const ARC_USDC = '0x3600000000000000000000000000000000000000';
const ARC_EURC = '0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1';
const BASE_WETH = '0x4200000000000000000000000000000000000006';

const nativeSentinel = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: 'USDC',
  name: 'USDC',
  decimals: 18,
  logo: 'native.png',
};
const eurc = { address: ARC_EURC, symbol: 'EURC', name: 'EURC', decimals: 6 };

describe('toZapInputToken', () => {
  it('lists the native sentinel as its ERC-20 form where one exists', () => {
    const token = toZapInputToken(ChainId.Arc, nativeSentinel);
    expect(token.address).toBe(ARC_USDC);
    expect(token.decimals).toBe(6);
    expect(token.symbol).toBe('USDC');
    expect(token.logo).toBe('native.png');
  });

  it('leaves any other token on that chain unchanged', () => {
    expect(toZapInputToken(ChainId.Arc, eurc)).toBe(eurc);
  });

  it('leaves the native sentinel alone on an ordinary chain', () => {
    const eth = { ...nativeSentinel, symbol: 'ETH' };
    expect(toZapInputToken(ChainId.Base, eth)).toBe(eth);
  });
});

describe('isPaidAsNative', () => {
  it('is true for the ERC-20 form of a native asset, whatever the address case', () => {
    expect(isPaidAsNative(ChainId.Arc, ARC_USDC)).toBe(true);
    expect(isPaidAsNative(ChainId.Arc, ARC_USDC.toUpperCase().replace('0X', '0x'))).toBe(true);
  });

  it('is false for any other token on that chain', () => {
    expect(isPaidAsNative(ChainId.Arc, ARC_EURC)).toBe(false);
  });

  it('is false for the wrapped native token of an ordinary chain, which needs an allowance', () => {
    expect(isPaidAsNative(ChainId.Base, BASE_WETH)).toBe(false);
  });
});

describe('toZapPayment', () => {
  it('sends the ERC-20 form of a native asset as the sentinel, at native decimals', () => {
    expect(toZapPayment(ChainId.Arc, ARC_USDC, '1000000')).toEqual({
      address: NATIVE_TOKEN_ADDRESS,
      amount: '1000000000000000000',
    });
  });

  it('scales exactly, so no amount is rounded on the way', () => {
    expect(toZapPayment(ChainId.Arc, ARC_USDC, '1502832').amount).toBe('1502832000000000000');
  });

  it('sends any other token unchanged', () => {
    expect(toZapPayment(ChainId.Arc, ARC_EURC, '1000000')).toEqual({ address: ARC_EURC, amount: '1000000' });
  });

  it('sends the native sentinel of an ordinary chain unchanged', () => {
    const amount = '1000000000000000000';
    expect(toZapPayment(ChainId.Base, NATIVE_TOKEN_ADDRESS, amount)).toEqual({ address: NATIVE_TOKEN_ADDRESS, amount });
  });
});

describe('toZapPayments', () => {
  it('keeps each address with its own amount when only some inputs are paid as native', () => {
    expect(toZapPayments(ChainId.Arc, [ARC_EURC, ARC_USDC], ['2000000', '1000000'])).toEqual({
      tokensIn: `${ARC_EURC},${NATIVE_TOKEN_ADDRESS}`,
      amountsIn: '2000000,1000000000000000000',
    });
  });
});

describe('nativeErc20Scale', () => {
  it('is the gap between the native interface and the ERC-20 form where one exists', () => {
    expect(nativeErc20Scale(ChainId.Arc)).toBe(10n ** 12n);
  });

  it('is 1 on an ordinary chain, where there is nothing to scale', () => {
    expect(nativeErc20Scale(ChainId.Base)).toBe(1n);
  });
});
