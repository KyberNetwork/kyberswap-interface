import { describe, expect, it } from 'vitest'

import { getLimitOrderPreview, getStopMarketExecution } from 'components/Announcement/helpers'
import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { getStopMarketExecutedTemplateIds } from 'constants/env'

const templateId = Number(getStopMarketExecutedTemplateIds())

const announcement = (order: Record<string, string>, id = templateId) =>
  ({
    id: 1,
    templateId: id,
    templateType: PrivateAnnouncementType.LIMIT_ORDER,
    templateBody: { order },
    isRead: false,
    sentAt: 1793076455,
  } as unknown as PrivateAnnouncement)

describe('getStopMarketExecution', () => {
  it('reads an executed order', () => {
    const execution = getStopMarketExecution(
      announcement({
        chainId: '56',
        txHash: '0x7c45',
        tokenInSymbol: 'USDC',
        amountIn: '6.852263049938648388',
        tokenOutSymbol: 'WBNB',
        amountOut: '0.009011013868562235',
        triggerPrice: '0.00135924',
        executedAt: '1793076451',
      }),
    )
    expect(execution).toMatchObject({
      chainId: 56,
      txHash: '0x7c45',
      tokenInSymbol: 'USDC',
      amountOut: '0.009011013868562235',
      triggerPrice: '0.00135924',
      executedAt: 1793076451,
    })
  })

  it('drops the fields the service left as placeholders', () => {
    const execution = getStopMarketExecution(
      announcement({
        chainId: '56',
        status: 'unknown',
        tokenInLogoURL: '{{.tokenInLogoURL}}',
        triggerPrice: '{{.triggerPrice}}',
        executedAt: '{{.executedAt}}',
      }),
    )
    expect(execution).toMatchObject({ chainId: 56 })
    expect(execution?.tokenInLogoURL).toBeUndefined()
    expect(execution?.triggerPrice).toBeUndefined()
    expect(execution?.executedAt).toBeUndefined()
  })

  it('ignores other templates', () => {
    expect(getStopMarketExecution(announcement({ chainId: '56' }, templateId + 1000))).toBeUndefined()
  })
})

describe('getLimitOrderPreview', () => {
  it('previews a stop market execution by its pair', () => {
    expect(getLimitOrderPreview(announcement({ tokenInSymbol: 'WBNB', tokenOutSymbol: 'USDC' }))).toEqual({
      pair: 'WBNB/USDC',
      status: 'Stop Market Executed',
    })
  })
})
