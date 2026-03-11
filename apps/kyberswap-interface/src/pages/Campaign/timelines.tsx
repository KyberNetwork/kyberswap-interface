import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Text } from 'rebass'

export type CampaignWeek = {
  value: number
  label?: ReactNode
  start: number
  end: number
}

const utcSeconds = (isoString: string) => Math.floor(new Date(isoString).getTime() / 1000)

const formatShortDateUtc = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })

export const safepalClaimWeeks = [
  { value: 1, start: utcSeconds('2026-03-24T08:00:00.000Z'), end: utcSeconds('2026-03-30T08:00:00.000Z') },
  { value: 2, start: utcSeconds('2026-03-31T08:00:00.000Z'), end: utcSeconds('2026-04-06T08:00:00.000Z') },
  { value: 3, start: utcSeconds('2026-04-07T08:00:00.000Z'), end: utcSeconds('2026-04-13T08:00:00.000Z') },
  { value: 4, start: utcSeconds('2026-04-14T08:00:00.000Z'), end: utcSeconds('2026-04-20T08:00:00.000Z') },
  { value: 5, start: utcSeconds('2026-04-21T08:00:00.000Z'), end: utcSeconds('2026-04-27T08:00:00.000Z') },
  { value: 6, start: utcSeconds('2026-04-28T08:00:00.000Z'), end: utcSeconds('2026-05-04T08:00:00.000Z') },
]

export const safepalWeeks: CampaignWeek[] = [
  { value: 1, start: utcSeconds('2026-03-16T08:00:00.000Z'), end: utcSeconds('2026-03-23T08:00:00.000Z') },
  { value: 2, start: utcSeconds('2026-03-23T08:00:00.000Z'), end: utcSeconds('2026-03-30T08:00:00.000Z') },
  { value: 3, start: utcSeconds('2026-03-30T08:00:00.000Z'), end: utcSeconds('2026-04-06T08:00:00.000Z') },
  { value: 4, start: utcSeconds('2026-04-06T08:00:00.000Z'), end: utcSeconds('2026-04-13T08:00:00.000Z') },
  { value: 5, start: utcSeconds('2026-04-13T08:00:00.000Z'), end: utcSeconds('2026-04-20T08:00:00.000Z') },
  { value: 6, start: utcSeconds('2026-04-20T08:00:00.000Z'), end: utcSeconds('2026-04-27T08:00:00.000Z') },
].map(({ value, start, end }) => {
  return {
    value,
    label: (
      <Text>
        <Text as="span" color="#ffffff">
          Week {value}
        </Text>{' '}
        {formatShortDateUtc(start)} - {formatShortDateUtc(end)}
      </Text>
    ),
    start,
    end,
  }
})

export const raffleWeeks: CampaignWeek[] = []

export const nearIntentWeeks: CampaignWeek[] = [
  {
    value: 31,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 2
          </Text>{' '}
          Jul 28 - Aug 03
        </Trans>
      </Text>
    ),
    start: 1753660800,
    end: 1754265600,
  },
  {
    value: 30,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          Jul 21 - Jul 27
        </Trans>
      </Text>
    ),
    start: 1753056000,
    end: 1753660800,
  },
].reverse()

export const mayTradingWeeks: CampaignWeek[] = [
  {
    value: 22,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          May 19 - May 25
        </Trans>
      </Text>
    ),
    start: 1748304000,
    end: 1748822400,
  },
]

export const stipWeeks: CampaignWeek[] = [
  {
    value: 37,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 10
          </Text>{' '}
          Sep 09 - Sep 15
        </Trans>
      </Text>
    ),
    start: 1725840000,
    end: 1726444800,
  },
  {
    value: 36,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 9
          </Text>{' '}
          Sep 02 - Sep 08
        </Trans>
      </Text>
    ),
    start: 1725235200,
    end: 1725840000,
  },
  {
    value: 35,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 8
          </Text>{' '}
          Aug 26 - Sep 01
        </Trans>
      </Text>
    ),
    start: 1724630400,
    end: 1725235200,
  },
  {
    value: 34,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 7
          </Text>{' '}
          Aug 19 - Aug 25
        </Trans>
      </Text>
    ),
    start: 1724025600,
    end: 1724630400,
  },
  {
    value: 33,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 6
          </Text>{' '}
          Aug 12 - Aug 18
        </Trans>
      </Text>
    ),
    start: 1723420800,
    end: 1724025600,
  },
  {
    value: 32,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 5
          </Text>{' '}
          Aug 05 - Aug 11
        </Trans>
      </Text>
    ),
    start: 1722816000,
    end: 1723420800,
  },
  {
    value: 31,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 4
          </Text>{' '}
          July 29 - Aug 04
        </Trans>
      </Text>
    ),
    start: 1722211200,
    end: 1722816000,
  },
  {
    value: 30,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 3
          </Text>{' '}
          July 22 - July 28
        </Trans>
      </Text>
    ),
    start: 1721606400,
    end: 1722211200,
  },
  {
    value: 29,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 2
          </Text>{' '}
          July 15 - July 21
        </Trans>
      </Text>
    ),
    start: 1721001600,
    end: 1721606400,
  },
  {
    value: 28,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          July 08 - July 14
        </Trans>
      </Text>
    ),
    start: 1720396800,
    end: 1721001600,
  },
].reverse()
