import { renderToStaticMarkup } from 'react-dom/server'
import { adaptCopyRunResponse } from 'services/copyTrading/adapters/copyRuns'
import type { FieldGroupQuality, ResponseMeta } from 'services/copyTrading/types/primitives'
import { describe, expect, it } from 'vitest'

import { CapitalInCardValue, SyncingTag } from 'pages/CopyTrading/components/common/status'
import { isFieldGroupSyncing } from 'pages/CopyTrading/helpers'

describe('Copy Trading syncing indicators', () => {
  it('scopes the tag to the matching response field group and removes it when complete', () => {
    const meta: ResponseMeta = {
      fieldQualities: [{ group: 'FIELD_GROUP_FEES', completeness: 'DATA_COMPLETENESS_PENDING' }],
    }
    expect(isFieldGroupSyncing(meta, 'FIELD_GROUP_CAPITAL')).toBe(false)
    expect(renderToStaticMarkup(<SyncingTag meta={meta} groups={['FIELD_GROUP_FEES']} />)).toContain('Syncing')
    meta.fieldQualities = [{ group: 'FIELD_GROUP_FEES', completeness: 'DATA_COMPLETENESS_COMPLETE' }]
    expect(renderToStaticMarkup(<SyncingTag meta={meta} groups={['FIELD_GROUP_FEES']} />)).toBe('')
  })

  it.each<FieldGroupQuality>([
    {},
    { freshness: 'DATA_STATUS_STALE' },
    { freshness: 'DATA_STATUS_UNAVAILABLE' },
    { finality: 'DATA_FINALITY_PROVISIONAL', completeness: 'DATA_COMPLETENESS_COMPLETE' },
    { completeness: 'DATA_COMPLETENESS_PARTIAL', reason: 'DATA_QUALITY_REASON_PROVIDER_UNAVAILABLE' },
  ])('does not label stale, unavailable, provisional or unknown data as syncing: %j', quality => {
    const meta: ResponseMeta = {
      status: 'DATA_STATUS_STALE',
      fieldQualities: [{ ...quality, group: 'FIELD_GROUP_CAPITAL' }],
    }
    expect(renderToStaticMarkup(<SyncingTag meta={meta} groups={['FIELD_GROUP_CAPITAL']} />)).toBe('')
    expect(isFieldGroupSyncing(undefined, 'FIELD_GROUP_CAPITAL')).toBe(false)
  })

  it.each([
    'DATA_QUALITY_REASON_SOURCE_LAG',
    'DATA_QUALITY_REASON_DEPENDENCY_PENDING',
    'DATA_QUALITY_REASON_REORG_REPAIR',
  ] as const)('labels partial coverage with %s as syncing', reason => {
    expect(
      isFieldGroupSyncing(
        {
          fieldQualities: [
            {
              group: 'FIELD_GROUP_PERFORMANCE',
              completeness: 'DATA_COMPLETENESS_PARTIAL',
              reason,
            },
          ],
        },
        'FIELD_GROUP_PERFORMANCE',
      ),
    ).toBe(true)
  })

  it('preserves a valid zero without a tag even for a pending capital projection', () => {
    const run = adaptCopyRunResponse({
      data: {
        capitalInUsd: { value: '0', status: 'METRIC_STATUS_STALE' },
        capitalInProjectionStatus: 'CAPITAL_IN_PROJECTION_STATUS_SYNCING',
      },
    }).data
    const html = renderToStaticMarkup(<CapitalInCardValue run={run} />)
    expect(html).toContain('$0')
    expect(html).not.toContain('Syncing')
    expect(html).not.toContain('Stale')
    expect(html).not.toContain('N/A')
  })
})
