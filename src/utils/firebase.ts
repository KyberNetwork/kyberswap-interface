import { ChainId } from '@kyberswap/ks-sdk-core'
import firebase from 'firebase/compat/app'
import { collection, doc, getFirestore, onSnapshot, query } from 'firebase/firestore'

import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from 'constants/env'

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
}

const firebaseApp = firebase.initializeApp(firebaseConfig)
const firestoreDB = getFirestore(firebaseApp)

const COLLECTIONS = {
  CANCELLING_ORDERS: 'cancellingOrders',
  CANCELLED_ORDERS: 'cancelledEvents',
  EXPIRED_ORDERS: 'expiredEvents',
  FILLED_ORDERS: 'filledEvents',
}

function subscribeDocumentFirebase(collectionName: string, paths: string[], callback: (data: any) => void) {
  const ref = doc(firestoreDB, collectionName, ...paths)
  const unsubscribe = onSnapshot(
    ref,
    querySnapshot => {
      callback(querySnapshot.data())
    },
    error => console.error('listen error', error),
  )
  return unsubscribe
}

function subscribeListOrderFirebase(
  collectionName: string,
  account: string,
  chainId: ChainId,
  callback: (data: any) => void,
) {
  const q = query(collection(firestoreDB, collectionName, account.toLowerCase(), chainId.toString()))
  const unsubscribe = onSnapshot(
    q,
    querySnapshot => {
      const result: {
        orders: LimitOrder[]
        all: { isSuccessful: boolean }[]
      } = {
        orders: [],
        all: [],
      }
      querySnapshot?.forEach(e => {
        if (e.id.startsWith('nonce')) {
          result.all.push(e.data() as { isSuccessful: boolean })
        } else {
          result.orders.push({ id: Number(e.id), ...e.data() } as LimitOrder)
        }
      })
      callback(result)
    },
    (error: any) => console.error('listen list error', error),
  )

  return unsubscribe
}

// todo any
export function subscribeCancellingOrders(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeDocumentFirebase(COLLECTIONS.CANCELLING_ORDERS, [`${account}:${chainId}`], callback)
}

export function subscribeNotificationOrderCancelled(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeListOrderFirebase(COLLECTIONS.CANCELLED_ORDERS, account, chainId, callback)
}

export function subscribeNotificationOrderFilled(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeListOrderFirebase(COLLECTIONS.FILLED_ORDERS, account, chainId, callback)
}
export function subscribeNotificationOrderExpired(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeListOrderFirebase(COLLECTIONS.EXPIRED_ORDERS, account, chainId, callback)
}
