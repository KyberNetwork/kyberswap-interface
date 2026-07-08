import type { PoolAnalyticsWindow, PoolAprHistoryData, PoolEarningsBucket, PoolEarningsData } from 'services/earn/types'

const SEVEN_DAY_BUCKET_COUNT = 7
const DAY_SECONDS = 24 * 60 * 60
const EARNING_SUM_FIELDS = ['lpFeeUsd', 'lmUsd', 'egUsd', 'totalUsd'] as const

const normalizeSevenDayEarningsBuckets = (buckets: PoolEarningsBucket[]) => {
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

export const transformAprHistoryData = (data: PoolAprHistoryData): PoolAprHistoryData => ({
  ...data,
  points: data.points.map(point => ({
    ...point,
    activeApr: point.activeApr !== undefined ? point.activeApr + point.bonusApr : undefined,
    volumeUsd: point.volumeUsd ?? 0,
  })),
})

export const transformEarningsData = (data: PoolEarningsData, window: PoolAnalyticsWindow): PoolEarningsData => ({
  ...data,
  buckets: window === '7d' ? normalizeSevenDayEarningsBuckets(data.buckets) : data.buckets,
})
