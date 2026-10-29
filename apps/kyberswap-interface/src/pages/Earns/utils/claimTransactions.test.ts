import { describe, expect, it } from 'vitest'

import { getClaimTransactions } from 'pages/Earns/utils/reward'

const ACTIVE_DISTRIBUTOR = '0x9fDf58C2Ae688C2BC9f11107c672C4D4CC909857'
const DEPRECATED_DISTRIBUTOR = '0xEae300Ac9409B2072697CA1d5fD137f8bB286f9c'

describe('getClaimTransactions', () => {
  it('returns every distributor transaction so no contract is left unclaimed', () => {
    const transactions = getClaimTransactions({
      calldata: 'aaaa',
      contractAddress: ACTIVE_DISTRIBUTOR,
      transactions: [
        {
          contractAddress: ACTIVE_DISTRIBUTOR,
          distributorStatus: 'active',
          calldata: 'aaaa',
          rewardTokens: ['0xtoken'],
          rewardAmounts: ['10000'],
        },
        {
          contractAddress: DEPRECATED_DISTRIBUTOR,
          distributorStatus: 'deprecated',
          calldata: 'bbbb',
          rewardTokens: ['0xtoken'],
          rewardAmounts: ['19531'],
        },
      ],
    })

    expect(transactions).toHaveLength(2)
    expect(transactions.map(transaction => transaction.contractAddress)).toEqual([
      ACTIVE_DISTRIBUTOR,
      DEPRECATED_DISTRIBUTOR,
    ])
  })

  // The scalar pair mirrors only the active distributor, so reading it instead of the array would
  // drop the deprecated contract's rewards.
  it('does not collapse to the mirrored scalar pair when an array is present', () => {
    const transactions = getClaimTransactions({
      calldata: 'aaaa',
      contractAddress: ACTIVE_DISTRIBUTOR,
      transactions: [
        { contractAddress: ACTIVE_DISTRIBUTOR, distributorStatus: 'active', calldata: 'aaaa' },
        { contractAddress: DEPRECATED_DISTRIBUTOR, distributorStatus: 'deprecated', calldata: 'bbbb' },
      ],
    })

    expect(transactions.map(transaction => transaction.calldata)).toContain('bbbb')
  })

  it('falls back to the scalar pair for reward-service builds without the array', () => {
    expect(getClaimTransactions({ calldata: 'aaaa', contractAddress: DEPRECATED_DISTRIBUTOR })).toEqual([
      { contractAddress: DEPRECATED_DISTRIBUTOR, calldata: 'aaaa' },
    ])
  })

  it('falls back to the scalar pair when the array comes back empty', () => {
    expect(
      getClaimTransactions({ calldata: 'aaaa', contractAddress: DEPRECATED_DISTRIBUTOR, transactions: [] }),
    ).toEqual([{ contractAddress: DEPRECATED_DISTRIBUTOR, calldata: 'aaaa' }])
  })

  it('keeps a single-distributor claim at one transaction', () => {
    const transactions = getClaimTransactions({
      calldata: 'aaaa',
      contractAddress: ACTIVE_DISTRIBUTOR,
      transactions: [{ contractAddress: ACTIVE_DISTRIBUTOR, distributorStatus: 'active', calldata: 'aaaa' }],
    })

    expect(transactions).toHaveLength(1)
  })
})
