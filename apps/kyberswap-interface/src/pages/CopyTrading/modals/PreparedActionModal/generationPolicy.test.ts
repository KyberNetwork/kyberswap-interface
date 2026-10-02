import type { AccountGeneration, Chain } from 'services/copyTrading/types/agents'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { describe, expect, it } from 'vitest'

import { getGenerationExecutionError } from 'pages/CopyTrading/modals/PreparedActionModal/generationPolicy'

const generation: AccountGeneration = {
  generationId: 'original',
  lifecycle: 'ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY',
  capabilities: ['ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_QUOTE'],
}
const catalog = (overrides: Partial<AccountGeneration> = {}): Chain[] => [
  {
    chainId: 8453,
    name: 'Base',
    slug: 'base',
    iconUrl: '',
    isEnabled: true,
    accountGenerations: [{ ...generation, ...overrides }],
  },
]
const action = (overrides: Partial<PreparedAction> = {}): PreparedAction => ({
  chainId: '8453',
  generationId: 'original',
  status: 'PREPARED_ACTION_STATUS_READY',
  displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE' },
  ...overrides,
})

describe('generation execution policy', () => {
  it('allows supported existing-account actions during retirement', () => {
    expect(getGenerationExecutionError(catalog(), action(), 'withdrawQuote')).toBeUndefined()
    expect(getGenerationExecutionError(catalog(), action(), 'stopCopy')).toContain('does not support this action')
  })
  it('blocks all actions for read-only generations, even withdrawals and funding', () => {
    const chains = catalog({ lifecycle: 'ACCOUNT_GENERATION_LIFECYCLE_READ_ONLY' })
    expect(getGenerationExecutionError(chains, action(), 'withdrawQuote')).toContain('read-only')
    expect(
      getGenerationExecutionError(
        chains,
        action({ startCopy: { stage: 'START_COPY_STAGE_FUNDING_REQUIRED' } }),
        'startCopy',
      ),
    ).toContain('read-only')
  })
  it('permits authoritative funding continuation but prevents new creates after retirement', () => {
    expect(
      getGenerationExecutionError(
        catalog(),
        action({ startCopy: { stage: 'START_COPY_STAGE_CREATE_REQUIRED' } }),
        'startCopy',
      ),
    ).toContain('no longer supports new copies')
    expect(
      getGenerationExecutionError(
        catalog(),
        action({ startCopy: { stage: 'START_COPY_STAGE_FUNDING_REQUIRED' } }),
        'startCopy',
      ),
    ).toBeUndefined()
  })
  it('never derives generation from another chain or allows unknown lifecycle', () => {
    expect(getGenerationExecutionError(catalog(), action({ chainId: '1' }), 'withdrawQuote')).toContain('unavailable')
    expect(
      getGenerationExecutionError(
        catalog({ lifecycle: 'ACCOUNT_GENERATION_LIFECYCLE_UNSPECIFIED' }),
        action(),
        'withdrawQuote',
      ),
    ).toContain('does not support execution')
  })
})
