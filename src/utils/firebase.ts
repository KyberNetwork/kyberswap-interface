import { ChainId } from '@kyberswap/ks-sdk-core'
import firebase from 'firebase/compat/app'
import { collection, doc, getFirestore, onSnapshot, query } from 'firebase/firestore'

import { PopupContentAnnouncement } from 'components/Announcement/type'
import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from 'constants/env'

const firebaseConfig2 = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
}

const firebaseConfig = {
  apiKey: 'AIzaSyDszHtJ4CJq0mwjBJ1pTt5OOzG5tiooEsg',
  authDomain: 'test-bace2.firebaseapp.com',
  databaseURL: 'https://test-bace2-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'test-bace2',
  storageBucket: 'test-bace2.appspot.com',
  messagingSenderId: '337703820408',
  appId: '1:337703820408:web:2fb16ef71941817dec618d',
}

const firebaseApp = firebase.initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)

const COLLECTIONS = {
  LO_CANCELLING_ORDERS: 'cancellingOrders',
  LO_CANCELLED_ORDERS: 'cancelledEvents',
  LO_EXPIRED_ORDERS: 'expiredEvents',
  LO_FILLED_ORDERS: 'filledEvents',

  TELEGRAM_SUBSCRIPTION: 'telegramSubscription',
  ANNOUNCEMENT: 'wallets',
  ANNOUNCEMENT_POPUP: 'broadcast',
}

function subscribeDocument(collectionName: string, paths: string[], callback: (data: any) => void) {
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

type AllItem = { isSuccessful: boolean; id: string; txHash: string }
type ListOrderResponse = {
  orders: LimitOrder[]
  all: AllItem[]
}

function subscribeListDocument(collectionName: string, paths: string[], callback: (data: any) => void) {
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

function subscribeListLimitOrder(
  collectionName: string,
  account: string,
  chainId: ChainId,
  callback: (data: ListOrderResponse) => void,
) {
  const unsubscribe = subscribeListDocument(collectionName, [account.toLowerCase(), chainId.toString()], data => {
    const result: ListOrderResponse = {
      orders: [],
      all: [],
    }
    data.forEach((e: any) => {
      if (e.id.startsWith('nonce')) {
        result.all.push(e as AllItem)
      } else {
        result.orders.push({ ...e, id: Number(e.id) } as LimitOrder)
      }
    })
    callback(result)
  })

  return unsubscribe
}

export function subscribeCancellingOrders(
  account: string,
  chainId: ChainId,
  callback: (data: { orderIds: number[]; nonces: number[] }) => void,
) {
  return subscribeDocument(COLLECTIONS.LO_CANCELLING_ORDERS, [`${account.toLowerCase()}:${chainId}`], callback)
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

export function subscribeTelegramSubscription(account: string, callback: (data: { isSuccessfully: boolean }) => void) {
  return subscribeDocument(COLLECTIONS.TELEGRAM_SUBSCRIPTION, [account.toLowerCase()], callback)
}

export function subscribePrivateAnnouncement(
  account: string | undefined,
  callback: (data: PopupContentAnnouncement[]) => void,
) {
  if (!account) return
  return subscribeDocument(COLLECTIONS.ANNOUNCEMENT, [account.toLowerCase()], data =>
    callback(data?.metaMessages ?? []),
  )
}

export function subscribeAnnouncement(callback: (data: PopupContentAnnouncement[]) => void) {
  return subscribeListDocument(COLLECTIONS.ANNOUNCEMENT_POPUP, [], callback)
}
