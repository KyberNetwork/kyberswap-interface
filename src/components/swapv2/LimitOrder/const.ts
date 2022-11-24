export const DEFAULT_EXPIRED = 7 * 86400

export const MIN_TIME_MINUTES = 5

const TIMES_IN_SECS = {
  ONE_DAY: 86400,
  ONE_HOUR: 3600,
  ONE_MIN: 60,
}

export const EXPIRED_OPTIONS = [
  // value in sec
  { label: `${MIN_TIME_MINUTES} Minutes`, value: MIN_TIME_MINUTES * TIMES_IN_SECS.ONE_MIN },
  { label: '10 Minutes', value: 10 * TIMES_IN_SECS.ONE_MIN },
  { label: '1 Hour', value: TIMES_IN_SECS.ONE_HOUR },
  { label: '3 Days', value: 3 * TIMES_IN_SECS.ONE_DAY },
  { label: '7 Days', value: 7 * TIMES_IN_SECS.ONE_DAY },
  { label: '30 Days', value: 30 * TIMES_IN_SECS.ONE_DAY },
]

export const LIMIT_ORDER_CONTRACT = '0x2892e28b58ab329741f27fd1ea56dca0192a3884'
