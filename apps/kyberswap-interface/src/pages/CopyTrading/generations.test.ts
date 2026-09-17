import type { AgentCard, Chain } from 'services/copyTrading/types/agents'
import { describe, expect, it } from 'vitest'

import { resolveStartCopyEligibility } from 'pages/CopyTrading/generations'

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
const agent: Pick<AgentCard, 'startCopyAvailabilities' | 'startCopyAvailability'> = {
  startCopyAvailability: { status: 'ADVISORY_ACTION_STATUS_UNAVAILABLE' },
  startCopyAvailabilities: [
    { generationId: 'second', availability: { status: 'ADVISORY_ACTION_STATUS_TRY_PREPARE' } },
    { generationId: 'first', availability: { status: 'ADVISORY_ACTION_STATUS_AVAILABLE' } },
  ],
}

describe('generation selection', () => {
  it('preserves the reason for a sole blocked generation', () => {
    expect(
      resolveStartCopyEligibility(
        { ...chain, accountGenerations: chain.accountGenerations?.slice(0, 1) },
        {
          startCopyAvailabilities: [
            {
              generationId: 'first',
              availability: {
                status: 'ADVISORY_ACTION_STATUS_UNAVAILABLE',
                reason: 'PREPARED_ACTION_REASON_FACTORY_PAUSED',
              },
            },
          ],
        },
      ),
    ).toEqual({ canStart: false, generationId: undefined, reason: 'PREPARED_ACTION_REASON_FACTORY_PAUSED' })
  })

  it('leaves multiple eligible generations unavailable instead of guessing by array order', () => {
    expect(resolveStartCopyEligibility(chain, agent)).toEqual({
      canStart: false,
      generationId: undefined,
      reason: undefined,
    })
  })

  it('explicitly selects the sole eligible ID and never selects by array order', () => {
    const choices = resolveStartCopyEligibility(chain, {
      ...agent,
      startCopyAvailabilities: [...(agent.startCopyAvailabilities || []).slice(0, 1)],
    })
    expect(choices).toEqual({ canStart: true, generationId: 'second', reason: undefined })
  })

  it('excludes retired generations from new Start eligibility', () => {
    const choices = resolveStartCopyEligibility(
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
    expect(choices.generationId).toBe('second')
  })

  it('does not invent support from singleton data, unknown lifecycle or missing capabilities', () => {
    expect(resolveStartCopyEligibility(undefined, agent).canStart).toBe(false)
    expect(resolveStartCopyEligibility({ ...chain, isEnabled: false }, agent).canStart).toBe(false)
    expect(
      resolveStartCopyEligibility(
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
    ).toMatchObject({ canStart: false, generationId: undefined })
    const choices = resolveStartCopyEligibility(chain, { startCopyAvailabilities: [] })
    expect(choices.canStart).toBe(false)
  })
})
