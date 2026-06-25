import { ChainId } from '@kyberswap/ks-sdk-core'
import type { Firestore, collection, doc, onSnapshot, query } from 'firebase/firestore'

import { PopupContentAnnouncement } from 'components/Announcement/type'
import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import { ENV_KEY, ENV_LEVEL, FIREBASE } from 'constants/env'
import { ENV_TYPE } from 'constants/type'

const { DEFAULT: FIREBASE_CONFIG_DEFAULT, LIMIT_ORDER: FIREBASE_CONFIG_LO } = FIREBASE[ENV_KEY]

const COLLECTIONS = {
  LO_CANCELLING_ORDERS: 'cancellingOrders',
  LO_CANCELLED_ORDERS: 'cancelledEventsByContract',
  LO_EXPIRED_ORDERS: 'expiredEvents',
  LO_FILLED_ORDERS: 'filledEvents',

  ANNOUNCEMENT: 'wallets',
  IDENTITY: 'identities',
  ANNOUNCEMENT_POPUP: 'broadcast',
}

const enableNotification = ENV_LEVEL !== ENV_TYPE.LOCAL

type FirebaseContext = {
  dbNotification: Firestore
  dbLimitOrder: Firestore
  collection: typeof collection
  doc: typeof doc
  onSnapshot: typeof onSnapshot
  query: typeof query
}

// firebase/firestore (+ firebase/compat) is heavy (~113KB gzip) and is only needed once a
// notification/limit-order subscription actually runs — never at first paint. Initialize the
// firebase apps and firestore instances lazily on first subscribe, behind a singleton promise.
let contextPromise: Promise<FirebaseContext> | undefined
function getContext(): Promise<FirebaseContext> {
  return (contextPromise ??= (async () => {
    const [{ default: firebase }, firestore] = await Promise.all([
      import('firebase/compat/app'),
      import('firebase/firestore'),
    ])
    const { getFirestore, collection, doc, onSnapshot, query } = firestore

    const firebaseApp = firebase.initializeApp(FIREBASE_CONFIG_DEFAULT, 'default')
    const firebaseAppLimitOrder = FIREBASE_CONFIG_LO
      ? firebase.initializeApp(FIREBASE_CONFIG_LO, 'limit_order')
      : firebaseApp

    return {
      dbNotification: getFirestore(firebaseApp),
      dbLimitOrder: getFirestore(firebaseAppLimitOrder),
      collection,
      doc,
      onSnapshot,
      query,
    }
  })())
}

type Unsubscribe = () => void
type DbSelector = (ctx: FirebaseContext) => Firestore

// Returns a synchronous unsubscribe so the public API stays stable for effect-driven call sites
// (`const unsubscribe = subscribeX(...); return () => unsubscribe?.()`). The actual firestore
// listener is wired up asynchronously once the lazy context resolves; the returned function cancels
// it even if cleanup runs before initialization finished.
function lazySubscribe(setup: (ctx: FirebaseContext) => Unsubscribe): Unsubscribe {
  if (!enableNotification) return () => {}
  let realUnsubscribe: Unsubscribe | undefined
  let cancelled = false
  getContext()
    .then(ctx => {
      if (cancelled) return
      realUnsubscribe = setup(ctx)
    })
    .catch(error => console.error('firestore init error', error))
  return () => {
    cancelled = true
    realUnsubscribe?.()
  }
}

function subscribeDocument(
  selectDb: DbSelector,
  collectionName: string,
  paths: string[],
  callback: (data: any) => void,
): Unsubscribe {
  return lazySubscribe(ctx => {
    const ref = ctx.doc(selectDb(ctx), collectionName, ...paths)
    return ctx.onSnapshot(
      ref,
      querySnapshot => {
        callback(querySnapshot.data())
      },
      error => console.error('listen error', error),
    )
  })
}

function subscribeListDocument(
  selectDb: DbSelector,
  collectionName: string,
  paths: string[],
  callback: (data: any) => void,
): Unsubscribe {
  return lazySubscribe(ctx => {
    const q = ctx.query(ctx.collection(selectDb(ctx), collectionName, ...paths))
    return ctx.onSnapshot(
      q,
      querySnapshot => {
        const result: any = []
        querySnapshot?.forEach(e => {
          result.push({ ...e.data(), id: e.id })
        })
        callback(result)
      },
      (error: any) => console.error('listen list error', error),
    )
  })
}

type AllItem = { isSuccessful: boolean; id: string; txHash: string }
type ListOrderResponse = {
  orders: LimitOrder[]
  all: AllItem[]
}

function subscribeListLimitOrder(
  collectionName: string,
  account: string,
  chainId: ChainId,
  callback: (data: ListOrderResponse) => void,
): Unsubscribe {
  return subscribeListDocument(
    ctx => ctx.dbLimitOrder,
    collectionName,
    [account.toLowerCase(), chainId.toString()],
    data => {
      const result: ListOrderResponse = {
        orders: [],
        all: [],
      }
      data.forEach((e: any) => {
        if (e.id.includes('nonce')) {
          result.all.push(e as AllItem)
        } else {
          result.orders.push({ ...e, id: Number(e.id) } as LimitOrder)
        }
      })
      callback(result)
    },
  )
}

export type OrderNonces = { [key: string]: number[] }
export function subscribeCancellingOrders(
  account: string,
  chainId: ChainId,
  callback: (data: { orderIds: number[]; noncesByContract: OrderNonces }) => void,
) {
  return subscribeDocument(
    ctx => ctx.dbLimitOrder,
    COLLECTIONS.LO_CANCELLING_ORDERS,
    [`${account.toLowerCase()}:${chainId}`],
    callback,
  )
}

export function subscribeNotificationOrderCancelled(
  account: string,
  chainId: ChainId,
  callback: (data: ListOrderResponse) => void,
) {
  return subscribeListLimitOrder(COLLECTIONS.LO_CANCELLED_ORDERS, account, chainId, callback)
}

export function subscribeNotificationOrderFilled(
  account: string,
  chainId: ChainId,
  callback: (data: ListOrderResponse) => void,
) {
  return subscribeListLimitOrder(COLLECTIONS.LO_FILLED_ORDERS, account, chainId, callback)
}

export function subscribeNotificationOrderExpired(
  account: string,
  chainId: ChainId,
  callback: (data: ListOrderResponse) => void,
) {
  return subscribeListLimitOrder(COLLECTIONS.LO_EXPIRED_ORDERS, account, chainId, callback)
}

export function subscribePrivateAnnouncement(
  account: string | undefined,
  callback: (data: PopupContentAnnouncement[]) => void,
) {
  if (!account) return
  return subscribeListDocument(
    ctx => ctx.dbNotification,
    COLLECTIONS.ANNOUNCEMENT,
    [account.toLowerCase(), 'metaMessages'],
    data => callback(data ?? []),
  )
}

export function subscribePrivateAnnouncementProfile(
  identityID: string | undefined,
  callback: (data: PopupContentAnnouncement[]) => void,
) {
  if (!identityID) return
  return subscribeListDocument(
    ctx => ctx.dbNotification,
    COLLECTIONS.IDENTITY,
    [identityID.toLowerCase(), 'metaMessages'],
    data => callback(data ?? []),
  )
}

export function subscribeAnnouncement(callback: (data: PopupContentAnnouncement[]) => void) {
  return subscribeListDocument(ctx => ctx.dbNotification, COLLECTIONS.ANNOUNCEMENT_POPUP, [], callback)
}
