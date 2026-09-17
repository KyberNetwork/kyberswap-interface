import type { AgentCard, Chain } from 'services/copyTrading/types/agents'
import { describe, expect, it } from 'vitest'

import { getSelectedStartGenerationId, getStartGenerationChoices } from 'pages/CopyTrading/generations'

const chain: Chain = {
  chainId: 8453,
  slug: 'base',
  name: 'Base',
  iconUrl: '',
  isEnabled: true,
  accountGenerations: ['first', 'second'].map(generationId => ({
    generationId,
    lifecycle: 'ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED',
    capabilities: ['ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY'],
  })),
}
const agent: Pick<AgentCard, 'startCopyAvailabilities' | 'feePolicies' | 'startCopyAvailability'> = {
  startCopyAvailability: { status: 'ADVISORY_ACTION_STATUS_UNAVAILABLE' },
  startCopyAvailabilities: [
    { generationId: 'second', availability: { status: 'ADVISORY_ACTION_STATUS_TRY_PREPARE' } },
    { generationId: 'first', availability: { status: 'ADVISORY_ACTION_STATUS_AVAILABLE' } },
  ],
  feePolicies: [
    { generationId: 'second', flatFeeRatePct: { value: '2', status: 'METRIC_STATUS_CURRENT' } },
    { generationId: 'first', flatFeeRatePct: { status: 'METRIC_STATUS_UNAVAILABLE' } },
  ],
}

describe('generation selection', () => {
  it('joins by opaque ID despite different array ordering and unavailable singleton', () => {
    const choices = getStartGenerationChoices(chain, agent)
    expect(choices.map(choice => choice.availability?.status)).toEqual([
      'ADVISORY_ACTION_STATUS_AVAILABLE',
      'ADVISORY_ACTION_STATUS_TRY_PREPARE',
    ])
    expect(choices[0].feePolicy?.flatFeeRatePct?.status).toBe('METRIC_STATUS_UNAVAILABLE')
    expect(choices[1].feePolicy?.flatFeeRatePct?.value).toBe('2')
    expect(getSelectedStartGenerationId(choices)).toBeUndefined()
  })

  it('explicitly selects the sole eligible ID and never selects by array order', () => {
    const choices = getStartGenerationChoices(chain, {
      ...agent,
      startCopyAvailabilities: [...(agent.startCopyAvailabilities || []).slice(0, 1)],
    })
    expect(getSelectedStartGenerationId(choices)).toBe('second')
  })

  it('retains an existing selection after retirement instead of assigning the replacement', () => {
    const choices = getStartGenerationChoices(
      {
        ...chain,
        accountGenerations: (chain.accountGenerations || []).map(generation =>
          generation.generationId === 'first'
            ? { ...generation, lifecycle: 'ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY' }
            : generation,
        ),
      },
      agent,
    )
    expect(choices.map(choice => choice.generationId)).toEqual(['second'])
    expect(getSelectedStartGenerationId(choices, 'first')).toBe('first')
  })

  it('does not invent support from singleton data, unknown lifecycle or missing capabilities', () => {
    expect(getStartGenerationChoices(undefined, agent)).toEqual([])
    expect(getStartGenerationChoices({ ...chain, isEnabled: false }, agent)).toEqual([])
    expect(
      getStartGenerationChoices(
        {
          ...chain,
          accountGenerations: [
            {
              generationId: 'first',
              lifecycle: 'ACCOUNT_GENERATION_LIFECYCLE_UNSPECIFIED',
              capabilities: [],
            },
          ],
        },
        agent,
      ),
    ).toEqual([])
    const choices = getStartGenerationChoices(chain, { startCopyAvailabilities: [], feePolicies: [] })
    expect(getSelectedStartGenerationId(choices)).toBeUndefined()
  })
})
