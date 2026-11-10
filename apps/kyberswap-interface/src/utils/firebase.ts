import type { Firestore, collection, doc, onSnapshot, query } from 'firebase/firestore'

import { PopupContentAnnouncement } from 'components/Announcement/type'
import { ENV_KEY, ENV_LEVEL, ENV_TYPE, FIREBASE } from 'constants/env'

const { DEFAULT: FIREBASE_CONFIG_DEFAULT } = FIREBASE[ENV_KEY]

const COLLECTIONS = {
  ANNOUNCEMENT: 'wallets',
  IDENTITY: 'identities',
  ANNOUNCEMENT_POPUP: 'broadcast',
}

const enableNotification = ENV_LEVEL !== ENV_TYPE.LOCAL

type FirebaseContext = {
  dbNotification: Firestore
  collection: typeof collection
  doc: typeof doc
  onSnapshot: typeof onSnapshot
  query: typeof query
}

// firebase/firestore (+ firebase/compat) is heavy (~113KB gzip) and is only needed once a
// notification subscription actually runs — never at first paint. Initialize the
// firebase app and its firestore instance lazily on first subscribe, behind a singleton promise.
let contextPromise: Promise<FirebaseContext> | undefined
function getContext(): Promise<FirebaseContext> {
  return (contextPromise ??= (async () => {
    const [{ default: firebase }, firestore] = await Promise.all([
      import('firebase/compat/app'),
      import('firebase/firestore'),
    ])
    const { getFirestore, collection, doc, onSnapshot, query } = firestore

    const firebaseApp = firebase.initializeApp(FIREBASE_CONFIG_DEFAULT, 'default')

    return {
      dbNotification: getFirestore(firebaseApp),
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
