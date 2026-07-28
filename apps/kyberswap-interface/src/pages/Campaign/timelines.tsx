import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

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
      <span>
        <span className="text-white">Week {value}</span> {formatShortDateUtc(start)} - {formatShortDateUtc(end)}
      </span>
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
      <span>
        <Trans>
          <span className="text-white">Week 2</span> Jul 28 - Aug 03
        </Trans>
      </span>
    ),
    start: 1753660800,
    end: 1754265600,
  },
  {
    value: 30,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 1</span> Jul 21 - Jul 27
        </Trans>
      </span>
    ),
    start: 1753056000,
    end: 1753660800,
  },
].reverse()

export const mayTradingWeeks: CampaignWeek[] = [
  {
    value: 22,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 1</span> May 19 - May 25
        </Trans>
      </span>
    ),
    start: 1748304000,
    end: 1748822400,
  },
]

export const stipWeeks: CampaignWeek[] = [
  {
    value: 37,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 10</span> Sep 09 - Sep 15
        </Trans>
      </span>
    ),
    start: 1725840000,
    end: 1726444800,
  },
  {
    value: 36,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 9</span> Sep 02 - Sep 08
        </Trans>
      </span>
    ),
    start: 1725235200,
    end: 1725840000,
  },
  {
    value: 35,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 8</span> Aug 26 - Sep 01
        </Trans>
      </span>
    ),
    start: 1724630400,
    end: 1725235200,
  },
  {
    value: 34,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 7</span> Aug 19 - Aug 25
        </Trans>
      </span>
    ),
    start: 1724025600,
    end: 1724630400,
  },
  {
    value: 33,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 6</span> Aug 12 - Aug 18
        </Trans>
      </span>
    ),
    start: 1723420800,
    end: 1724025600,
  },
  {
    value: 32,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 5</span> Aug 05 - Aug 11
        </Trans>
      </span>
    ),
    start: 1722816000,
    end: 1723420800,
  },
  {
    value: 31,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 4</span> July 29 - Aug 04
        </Trans>
      </span>
    ),
    start: 1722211200,
    end: 1722816000,
  },
  {
    value: 30,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 3</span> July 22 - July 28
        </Trans>
      </span>
    ),
    start: 1721606400,
    end: 1722211200,
  },
  {
    value: 29,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 2</span> July 15 - July 21
        </Trans>
      </span>
    ),
    start: 1721001600,
    end: 1721606400,
  },
  {
    value: 28,
    label: (
      <span>
        <Trans>
          <span className="text-white">Week 1</span> July 08 - July 14
        </Trans>
      </span>
    ),
    start: 1720396800,
    end: 1721001600,
  },
].reverse()
