import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { TIMES_IN_SECS } from 'constants/index'
import { formatTimeDuration } from 'utils/time'

import { LimitOrderStatus } from './type'

export const DEFAULT_EXPIRED = 36500 * TIMES_IN_SECS.ONE_DAY

export const MIN_TIME_MINUTES = 5

export const getExpireOptions = () =>
  [
    // MIN_TIME_MINUTES * TIMES_IN_SECS.ONE_MIN,
    // 10 * TIMES_IN_SECS.ONE_MIN,
    // 30 * TIMES_IN_SECS.ONE_MIN,
    TIMES_IN_SECS.ONE_HOUR,
    TIMES_IN_SECS.ONE_DAY,
    // 3 * TIMES_IN_SECS.ONE_DAY,
    7 * TIMES_IN_SECS.ONE_DAY,
    30 * TIMES_IN_SECS.ONE_DAY,
    // 100 years for forever
    36500 * TIMES_IN_SECS.ONE_DAY,
  ].map(e => ({ value: e, label: formatTimeDuration(e) }))

export const ACTIVE_ORDER_OPTIONS = () => [
  {
    label: t`All Active Orders`,
    value: LimitOrderStatus.ACTIVE,
  },
  {
    label: t`Open Orders`,
    value: LimitOrderStatus.OPEN,
  },
  {
    label: t`Partially Filled Orders`,
    value: LimitOrderStatus.PARTIALLY_FILLED,
  },
]
export const CLOSE_ORDER_OPTIONS = () => [
  {
    label: t`All Closed Orders`,
    value: LimitOrderStatus.CLOSED,
  },
  {
    label: t`Filled Orders`,
    value: LimitOrderStatus.FILLED,
  },
  {
    label: t`Cancelled Orders`,
    value: LimitOrderStatus.CANCELLED,
  },
  {
    label: t`Expired Orders`,
    value: LimitOrderStatus.EXPIRED,
  },
]

const _USD_THRESHOLD: { [chainId: number]: number } = {
  [ChainId.MAINNET]: 300,
}
export const USD_THRESHOLD = new Proxy(_USD_THRESHOLD, {
  get(target, p) {
    const prop = p as any as ChainId
    if (p && target[prop]) return target[prop]
    return 10
  },
})

export const WORSE_PRICE_DIFF_THRESHOLD = -5
export const BETTER_PRICE_DIFF_THRESHOLD = 30

export const DOCS_LINKS = {
  GASLESS_CANCEL:
    'https://docs.kyberswap.com/kyberswap-solutions/limit-order/concepts/gasless-cancellation#gasless-cancel',
  HARD_CANCEL: 'https://docs.kyberswap.com/kyberswap-solutions/limit-order/concepts/gasless-cancellation#hard-cancel',
  CANCEL_GUIDE: 'https://docs.kyberswap.com/kyberswap-solutions/limit-order/user-guides/cancel-limit-orders',
  USER_GUIDE: 'https://docs.kyberswap.com/kyberswap-solutions/limit-order',
}
