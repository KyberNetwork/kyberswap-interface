import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Text } from 'rebass'

export type CampaignWeek = {
  value: number
  label?: ReactNode
  start: number
  end: number
}

const ONE_DAY_SECONDS = 24 * 60 * 60
const ONE_WEEK_SECONDS = 7 * ONE_DAY_SECONDS

const getStartOfCurrentMondayUtc = () => {
  const now = new Date()
  const currentDay = now.getUTCDay()
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() + diffToMonday)
  return Math.floor(monday.getTime() / 1000)
}

const formatShortDateUtc = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })

const safepalTempStart = getStartOfCurrentMondayUtc()

// TODO: Remove and use `safepalWeeks`
export const safepalTempWeeks: CampaignWeek[] = [
  {
    value: 1,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          {formatShortDateUtc(safepalTempStart)} - {formatShortDateUtc(safepalTempStart + ONE_WEEK_SECONDS)}
        </Trans>
      </Text>
    ),
    start: safepalTempStart,
    end: safepalTempStart + ONE_WEEK_SECONDS,
  },
  {
    value: 2,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 2
          </Text>{' '}
          {formatShortDateUtc(safepalTempStart + ONE_WEEK_SECONDS)} -{' '}
          {formatShortDateUtc(safepalTempStart + ONE_WEEK_SECONDS * 2)}
        </Trans>
      </Text>
    ),
    start: safepalTempStart + ONE_WEEK_SECONDS,
    end: safepalTempStart + ONE_WEEK_SECONDS * 2,
  },
]

export const safepalWeeks: CampaignWeek[] = [
  {
    value: 11,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          Mar 09 - Mar 15
        </Trans>
      </Text>
    ),
    start: 1773014400,
    end: 1773619200,
  },
  {
    value: 12,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 2
          </Text>{' '}
          Mar 16 - Mar 22
        </Trans>
      </Text>
    ),
    start: 1773619200,
    end: 1774224000,
  },
  {
    value: 13,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 3
          </Text>{' '}
          Mar 23 - Mar 29
        </Trans>
      </Text>
    ),
    start: 1774224000,
    end: 1774828800,
  },
  {
    value: 14,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 4
          </Text>{' '}
          Mar 30 - Apr 05
        </Trans>
      </Text>
    ),
    start: 1774828800,
    end: 1775433600,
  },
  {
    value: 15,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 5
          </Text>{' '}
          Apr 06 - Apr 12
        </Trans>
      </Text>
    ),
    start: 1775433600,
    end: 1776038400,
  },
  {
    value: 16,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 6
          </Text>{' '}
          Apr 13 - Apr 19
        </Trans>
      </Text>
    ),
    start: 1776038400,
    end: 1776643200,
  },
]

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
