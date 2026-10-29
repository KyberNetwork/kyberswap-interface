import { describe, expect, it } from 'vitest'

import { parseKyberCrossQuote } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'
import {
  debridgeQuoteSchema,
  evmTransactionSchema,
  lifiQuoteSchema,
  optimexQuoteSchema,
  parseMayanQuote,
  parseNearQuote,
  parseRelayQuote,
} from 'pages/CrossChainSwap/quote/rawQuote'

const address = '0x1111111111111111111111111111111111111111'

describe('provider payload boundaries', () => {
  it('rejects malformed EVM transactions before reaching the wallet', () => {
    for (const transaction of [
      null,
      {},
      { to: address, data: 'garbage', value: '1' },
      { to: 'wrong', data: '0x', value: '1' },
    ]) {
      expect(() => evmTransactionSchema.parse(transaction)).toThrow()
    }
    expect(evmTransactionSchema.parse({ to: address, data: '0x1234', value: '9007199254740993' }).value).toBe(
      '9007199254740993',
    )
  })

  it('accepts hexadecimal or omitted EVM transaction values', () => {
    expect(evmTransactionSchema.parse({ to: address, data: '0x' }).value).toBe('0')
    expect(evmTransactionSchema.parse({ to: address, data: '0x', value: '0x0' }).value).toBe('0x0')
  })

  it('accepts Solana serialized transactions without requiring an EVM address', () => {
    expect(lifiQuoteSchema.parse({ transactionRequest: { data: 'AQIDBA==' } }).transactionRequest.data).toBe('AQIDBA==')
    expect(debridgeQuoteSchema.parse({ orderId: 'order', tx: { data: '0x01020304' } }).tx.data).toBe('0x01020304')
  })

  it('keeps Optimex Bitcoin quotes without prebuilt transaction data', () => {
    expect(optimexQuoteSchema.parse({ session_id: 'session', txData: null }).txData).toBeNull()
    expect(() => optimexQuoteSchema.parse({ txData: { deposit_address: 'btc-address' } })).toThrow()
  })

  it('rejects mismatched provider payloads', () => {
    for (const parse of [parseMayanQuote, parseRelayQuote, parseNearQuote, parseKyberCrossQuote]) {
      expect(() => parse({ tx: { to: address, data: '0x', value: '0' } })).toThrow()
    }
  })

  it('accepts a completed Relay approval without data alongside a pending deposit', () => {
    const raw = {
      steps: [
        { id: 'approve', kind: 'transaction', items: [{ status: 'complete' }] },
        { id: 'deposit', kind: 'transaction', items: [{ status: 'incomplete', data: { to: address, value: '0' } }] },
      ],
    }
    expect(parseRelayQuote(raw)).toBe(raw)
  })

  it.each(['transaction', 'signature'])('rejects an incomplete Relay %s item without data', kind => {
    expect(() => parseRelayQuote({ steps: [{ id: 'deposit', kind, items: [{ status: 'incomplete' }] }] })).toThrow()
  })

  it('preserves opaque Relay SDK metadata without coercing its values', () => {
    const raw = {
      steps: [
        {
          id: 'deposit',
          kind: 'transaction',
          items: [{ status: 'incomplete', data: { value: '9007199254740993', chainId: 1 } }],
        },
      ],
      request: { id: 'request' },
    }
    expect(parseRelayQuote(raw)).toBe(raw)
  })
})
