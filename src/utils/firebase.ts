import { ChainId } from '@kyberswap/ks-sdk-core'
import firebase from 'firebase/compat/app'
import { Firestore, collection, doc, getFirestore, onSnapshot, query } from 'firebase/firestore'

import { PopupContentAnnouncement } from 'components/Announcement/type'
import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import { ENV_KEY, ENV_LEVEL, FIREBASE } from 'constants/env'
import { ENV_TYPE } from 'constants/type'

const { DEFAULT: FIREBASE_CONFIG_DEFAULT, LIMIT_ORDER: FIREBASE_CONFIG_LO } = FIREBASE[ENV_KEY]

const firebaseApp = firebase.initializeApp(FIREBASE_CONFIG_DEFAULT, 'default')
const firebaseAppLimitOrder = FIREBASE_CONFIG_LO
  ? firebase.initializeApp(FIREBASE_CONFIG_LO, 'limit_order')
  : firebaseApp

const dbNotification = getFirestore(firebaseApp)
const dbLimitOrder = getFirestore(firebaseAppLimitOrder)

const COLLECTIONS = {
  LO_CANCELLING_ORDERS: 'cancellingOrders',
  LO_CANCELLED_ORDERS: 'cancelledEvents',
  LO_EXPIRED_ORDERS: 'expiredEvents',
  LO_FILLED_ORDERS: 'filledEvents',

  ANNOUNCEMENT: 'wallets',
  IDENTITY: 'identities',
  ANNOUNCEMENT_POPUP: 'broadcast',
}

const enableNotification = ENV_LEVEL !== ENV_TYPE.LOCAL

function subscribeDocument(db: Firestore, collectionName: string, paths: string[], callback: (data: any) => void) {
  if (!enableNotification) return
  const ref = doc(db, collectionName, ...paths)
  const unsubscribe = onSnapshot(
    ref,
    querySnapshot => {
      callback(querySnapshot.data())
    },
    error => console.error('listen error', error),
  )
  return unsubscribe
}

function subscribeListDocument(db: Firestore, collectionName: string, paths: string[], callback: (data: any) => void) {
  if (!enableNotification) return
  const q = query(collection(db, collectionName, ...paths))
  const unsubscribe = onSnapshot(
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
  return unsubscribe
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
) {
  const unsubscribe = subscribeListDocument(
    dbLimitOrder,
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

  return unsubscribe
}

export type OrderNonces = { [key: string]: number[] }
export function subscribeCancellingOrders(
  account: string,
  chainId: ChainId,
  callback: (data: { orderIds: number[]; noncesByContract: OrderNonces }) => void,
) {
  return subscribeDocument(
    dbLimitOrder,
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
    dbNotification,
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
  return subscribeListDocument(dbNotification, COLLECTIONS.IDENTITY, [identityID.toLowerCase(), 'metaMessages'], data =>
    callback(data ?? []),
  )
}

export function subscribeAnnouncement(callback: (data: PopupContentAnnouncement[]) => void) {
  return subscribeListDocument(dbNotification, COLLECTIONS.ANNOUNCEMENT_POPUP, [], callback)
}
