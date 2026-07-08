import type {
  PoolAnalyticsWindow,
  PoolAprHistoryData,
  PoolAprHistoryPoint,
  PoolEarningsBucket,
  PoolEarningsData,
} from 'services/earn/types'

const SEVEN_DAY_BUCKET_COUNT = 7
const DAY_SECONDS = 24 * 60 * 60
const FOUR_HOUR_SECONDS = 4 * 60 * 60
const EARNING_SUM_FIELDS = ['lpFeeUsd', 'lmUsd', 'egUsd', 'totalUsd'] as const
const APR_AVERAGE_FIELDS = ['feeApr', 'lmApr', 'egApr', 'bonusApr', 'totalApr', 'tvlUsd'] as const
const OPTIONAL_APR_AVERAGE_FIELDS = ['activeApr', 'activeFeeApr', 'activeLmApr', 'activeEgApr'] as const

type AprHistoryAccumulator = PoolAprHistoryPoint & {
  count: number
  optionalFieldCounts: Record<(typeof OPTIONAL_APR_AVERAGE_FIELDS)[number], number>
}

const aggregateSevenDayEarningsBuckets = (buckets: PoolEarningsBucket[]) => {
  const bucketsByDay = buckets.reduce((acc, bucket) => {
    const bucketTimestamp = Math.floor(bucket.ts / DAY_SECONDS) * DAY_SECONDS
    const currentBucket = acc.get(bucketTimestamp) ?? {
      ts: bucketTimestamp,
      lpFeeUsd: 0,
      lmUsd: 0,
      egUsd: 0,
      totalUsd: 0,
    }

    EARNING_SUM_FIELDS.forEach(field => {
      currentBucket[field] += bucket[field]
    })

    if (bucket.bonusUsd !== undefined) {
      currentBucket.bonusUsd = (currentBucket.bonusUsd ?? 0) + bucket.bonusUsd
    }

    acc.set(bucketTimestamp, currentBucket)
    return acc
  }, new Map<number, PoolEarningsBucket>())

  return Array.from(bucketsByDay.values())
    .sort((a, b) => a.ts - b.ts)
    .slice(-SEVEN_DAY_BUCKET_COUNT)
}

const aggregateFourHourAprHistoryPoints = (points: PoolAprHistoryPoint[]) => {
  const buckets = points.reduce((acc, point) => {
    const bucketTimestamp = Math.floor(point.ts / FOUR_HOUR_SECONDS) * FOUR_HOUR_SECONDS
    const currentBucket = acc.get(bucketTimestamp) ?? {
      ...point,
      ts: bucketTimestamp,
      feeApr: 0,
      lmApr: 0,
      egApr: 0,
      bonusApr: 0,
      totalApr: 0,
      activeApr: undefined,
      activeFeeApr: undefined,
      activeLmApr: undefined,
      activeEgApr: undefined,
      tvlUsd: 0,
      volumeUsd: 0,
      count: 0,
      optionalFieldCounts: {
        activeApr: 0,
        activeFeeApr: 0,
        activeLmApr: 0,
        activeEgApr: 0,
      },
    }

    APR_AVERAGE_FIELDS.forEach(field => {
      currentBucket[field] += point[field]
    })

    OPTIONAL_APR_AVERAGE_FIELDS.forEach(field => {
      const value = point[field]

      if (value !== undefined) {
        currentBucket[field] = (currentBucket[field] ?? 0) + value
        currentBucket.optionalFieldCounts[field] += 1
      }
    })

    currentBucket.volumeUsd += point.volumeUsd
    currentBucket.high = Math.max(currentBucket.high, point.high)
    currentBucket.low = Math.min(currentBucket.low, point.low)
    currentBucket.close = point.close
    currentBucket.count += 1
    acc.set(bucketTimestamp, currentBucket)
    return acc
  }, new Map<number, AprHistoryAccumulator>())

  return Array.from(buckets.values()).map(({ count, optionalFieldCounts, ...bucket }): PoolAprHistoryPoint => {
    APR_AVERAGE_FIELDS.forEach(field => {
      bucket[field] /= count
    })

    OPTIONAL_APR_AVERAGE_FIELDS.forEach(field => {
      const value = bucket[field]
      bucket[field] =
        value !== undefined && optionalFieldCounts[field] > 0 ? value / optionalFieldCounts[field] : undefined
    })

    return bucket
  })
}

export const transformAprHistoryData = (data: PoolAprHistoryData, window: PoolAnalyticsWindow): PoolAprHistoryData => {
  const points = data.points
    .map(point => ({
      ...point,
      activeApr: point.activeApr !== undefined ? point.activeApr + point.bonusApr : undefined,
      volumeUsd: point.volumeUsd ?? 0,
    }))
    .sort((a, b) => a.ts - b.ts)

  return {
    ...data,
    points: window === '30d' ? aggregateFourHourAprHistoryPoints(points) : points,
  }
}

export const transformEarningsData = (data: PoolEarningsData, window: PoolAnalyticsWindow): PoolEarningsData => ({
  ...data,
  buckets: window === '7d' ? aggregateSevenDayEarningsBuckets(data.buckets) : data.buckets,
})
