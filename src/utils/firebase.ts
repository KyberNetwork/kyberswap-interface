import { ChainId } from '@kyberswap/ks-sdk-core'
import firebase from 'firebase/compat/app'
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore'
import { getMessaging, getToken } from 'firebase/messaging'

import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'

// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_FIREBASE_APP_ID,
// }

// import {
//   FIREBASE_API_KEY,
//   FIREBASE_APP_ID,
//   FIREBASE_AUTH_DOMAIN,
//   FIREBASE_MESSAGING_SENDER_ID,
//   FIREBASE_PROJECT_ID,
//   FIREBASE_STORAGE_BUCKET,
//   FIREBASE_VAPID_KEY,
// } from 'constants/env'

const firebaseConfig = {
  apiKey: 'AIzaSyCZAD268JKihmZ3Om2gZ1YOA_P6stOkWoM',
  authDomain: 'caro-ai-h5.firebaseapp.com',
  databaseURL: 'https://caro-ai-h5.firebaseio.com',
  projectId: 'caro-ai-h5',
  storageBucket: 'caro-ai-h5.appspot.com',
  messagingSenderId: '422002001428',
  appId: '1:422002001428:web:6c277799e77bb555',
}

const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY
const firebaseApp = firebase.initializeApp(firebaseConfig)
const firestoreDb = getFirestore(firebaseApp)

export const fetchToken = () => {
  const messaging = getMessaging(firebaseApp)
  return getToken(messaging, {
    vapidKey,
  })
    .then(currentToken => {
      if (currentToken) {
        return currentToken
        // Track the token -> client mapping, by sending to backend server
        // show on the UI that permission is secured
      } else {
        return ''
        // shows on the UI that permission is required
      }
    })
    .catch(err => {
      console.log(err)
      // catch error while creating client token
      return ''
    })
}

const COLLECTIONS = {
  CANCELLING_ORDERS: 'cancellingOrders',
  CANCELLED_ORDERS: 'cancelledEvents',
  EXPIRED_ORDERS: 'expiredEvents',
  FILLED_ORDERS: 'filledEvents',
}
function subscribeFirebase(collection: string, collectionId: string, callback: (data: any) => void) {
  const ref = doc(firestoreDb, collection, collectionId)
  const unsubscribe = onSnapshot(
    ref,
    querySnapshot => {
      callback(querySnapshot.data())
    },
    error => console.error('listen error', error),
  )
  return unsubscribe
}

export function subscribeCancellingOrders(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeFirebase(COLLECTIONS.CANCELLING_ORDERS, `${chainId}:${account}`, callback)
}

export function subscribeNotificationOrderCancelled(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeFirebase(COLLECTIONS.CANCELLED_ORDERS, `${chainId}:${account}`, callback)
}

export function subscribeNotificationOrderFilled(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeFirebase(COLLECTIONS.FILLED_ORDERS, `${chainId}:${account}`, callback)
}
export function subscribeNotificationOrderExpired(account: string, chainId: ChainId, callback: (data: any) => void) {
  return subscribeFirebase(COLLECTIONS.EXPIRED_ORDERS, `${chainId}:${account}`, callback)
}

// todo remove
export const removeCollection = async (type: LimitOrderStatus, chainId: ChainId, account: string) => {
  const ref = doc(
    firestoreDb,
    type === LimitOrderStatus.CANCELLED
      ? COLLECTIONS.CANCELLED_ORDERS
      : type === LimitOrderStatus.FILLED
      ? COLLECTIONS.FILLED_ORDERS
      : COLLECTIONS.EXPIRED_ORDERS,
    `${chainId}:${account}`,
  )
  await setDoc(
    ref,
    {
      orders: [],
      all: [],
    },
    { merge: true },
  )
}

// todo rêmove
export const insertCancellingOrder = async (data: any, chainId: ChainId, account: string) => {
  const ref = doc(firestoreDb, COLLECTIONS.CANCELLING_ORDERS, `${chainId}:${account}`)
  const docSnap = await getDoc(ref)
  const newData = { ...docSnap.data(), ...data }
  await setDoc(ref, newData, { merge: true })
}

// todo rêmove
export const insertCancelledOrder = async (order: LimitOrder | null, chainId: ChainId, account: string) => {
  const ref = doc(firestoreDb, COLLECTIONS.CANCELLED_ORDERS, `${chainId}:${account}`)
  await setDoc(
    ref,
    !order
      ? { all: [{ isSuccessful: true }], orders: [] }
      : {
          all: [],
          orders: [{ ...order, isSuccessful: true }],
        },
    { merge: true },
  )
}
