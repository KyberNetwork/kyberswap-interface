import { type Middleware, combineReducers, configureStore } from '@reduxjs/toolkit'
import { load, save } from 'redux-localstorage-simple'
import aggregatorStatsApi from 'services/aggregatorStats'
import announcementApi, { publicAnnouncementApi } from 'services/announcement'
import blackjackApi from 'services/blackjack'
import campaignApi from 'services/campaign'
import raffleCampaignApi from 'services/campaignRaffle'
import safepalCampaignApi from 'services/campaignSafepal'
import coingeckoApi from 'services/coingecko'
import commonServiceApi from 'services/commonService'
import contractQuery from 'services/contractQuery'
import crosschainApi from 'services/crossChain'
import externalApi from 'services/externalApi'
import geckoTerminalApi from 'services/geckoTermial'
import identifyApi from 'services/identity'
import ksSettingApi from 'services/ksSetting'
import kyberDAO from 'services/kyberDAO'
import kyberdataServiceApi from 'services/kyberdata'
import limitOrderApi from 'services/limitOrder'
import marketOverviewApi from 'services/marketOverview'
import notificationApi from 'services/notification'
import priceAlertApi from 'services/priceAlert'
import referralApi from 'services/referral'
import restrictedTokensApi from 'services/restrictedTokens'
import rewardServiceApi from 'services/reward'
import rewardMerklApi from 'services/rewardMerkl'
import routeApi from 'services/route'
import smartExitApi from 'services/smartExit'
import socialApi from 'services/social'
import tipLinkApi from 'services/tipLink'
import tokenApi from 'services/token'
import tokenChartApi from 'services/tokenChart'
import zapApi from 'services/zap'
import zapEarnServiceApi from 'services/zapEarn'

import application from 'state/application/reducer'
import authen from 'state/authen/reducer'
import burnProAmm from 'state/burn/proamm/reducer'
import burn from 'state/burn/reducer'
import crossChainSwap from 'state/crossChainSwap'
import customizeDexes from 'state/customizeDexes'
import { updateVersion } from 'state/global/actions'
import lists from 'state/lists/reducer'
import mintV2 from 'state/mint/proamm/reducer'
import mint from 'state/mint/reducer'
import pair from 'state/pair/reducer'
import pools from 'state/pools/reducer'
import profile from 'state/profile/reducer'
import swap from 'state/swap/reducer'
import tokenPrices from 'state/tokenPrices'
import topTokens from 'state/topTokens'
import transactions from 'state/transactions/reducer'
import tutorial from 'state/tutorial/reducer'
import user, { UserState } from 'state/user/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'profile', 'crossChainSwap.transactions']

// Client-only: read persisted state from localStorage and migrate from old version to
// new version, preventing lost favorite tokens of user. Returns {} under SSR/prerender.
function getClientPreloadedState(): Partial<AppState> {
  if (typeof window === 'undefined') return {}
  const preloadedState: any = load({ states: PERSISTED_KEYS })
  if ('user' in preloadedState) {
    const userState: UserState = preloadedState.user
    if (userState.favoriteTokensByChainId) {
      userState.favoriteTokensByChainIdv2 = Object.entries(userState.favoriteTokensByChainId).reduce(
        (acc, [chainId, obj]) => {
          acc[chainId] = {}
          obj.addresses.forEach((address: string) => {
            acc[chainId][address.toLowerCase()] = true
          })
          return acc
        },
        {} as any,
      )
      userState.favoriteTokensByChainId = undefined
    }
  }
  return preloadedState
}

const rootReducer = combineReducers({
  application,
  authen,
  profile,
  user,
  transactions,
  crossChainSwap,
  swap,
  mint,
  mintV2,
  burn,
  burnProAmm,
  lists,
  pair,
  pools,
  [aggregatorStatsApi.reducerPath]: aggregatorStatsApi.reducer,
  [announcementApi.reducerPath]: announcementApi.reducer,
  [publicAnnouncementApi.reducerPath]: publicAnnouncementApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [geckoTerminalApi.reducerPath]: geckoTerminalApi.reducer,
  [coingeckoApi.reducerPath]: coingeckoApi.reducer,
  [contractQuery.reducerPath]: contractQuery.reducer,
  [limitOrderApi.reducerPath]: limitOrderApi.reducer,
  [externalApi.reducerPath]: externalApi.reducer,

  [kyberDAO.reducerPath]: kyberDAO.reducer,
  [identifyApi.reducerPath]: identifyApi.reducer,
  [ksSettingApi.reducerPath]: ksSettingApi.reducer,
  [crosschainApi.reducerPath]: crosschainApi.reducer,
  [priceAlertApi.reducerPath]: priceAlertApi.reducer,
  [socialApi.reducerPath]: socialApi.reducer,
  tutorial,
  customizeDexes,
  tokenPrices,
  topTokens,
  [zapApi.reducerPath]: zapApi.reducer,
  [routeApi.reducerPath]: routeApi.reducer,
  [tokenApi.reducerPath]: tokenApi.reducer,
  [zapEarnServiceApi.reducerPath]: zapEarnServiceApi.reducer,
  [rewardServiceApi.reducerPath]: rewardServiceApi.reducer,
  [rewardMerklApi.reducerPath]: rewardMerklApi.reducer,
  [kyberdataServiceApi.reducerPath]: kyberdataServiceApi.reducer,
  [referralApi.reducerPath]: referralApi.reducer,
  [raffleCampaignApi.reducerPath]: raffleCampaignApi.reducer,
  [safepalCampaignApi.reducerPath]: safepalCampaignApi.reducer,
  [campaignApi.reducerPath]: campaignApi.reducer,
  [commonServiceApi.reducerPath]: commonServiceApi.reducer,
  [blackjackApi.reducerPath]: blackjackApi.reducer,
  [marketOverviewApi.reducerPath]: marketOverviewApi.reducer,
  [smartExitApi.reducerPath]: smartExitApi.reducer,
  [tipLinkApi.reducerPath]: tipLinkApi.reducer,
  [tokenChartApi.reducerPath]: tokenChartApi.reducer,
  [restrictedTokensApi.reducerPath]: restrictedTokensApi.reducer,
})

export type AppState = ReturnType<typeof rootReducer>

const apiMiddlewares: Middleware[] = [
  geckoTerminalApi,
  coingeckoApi,
  externalApi,
  contractQuery,
  limitOrderApi,
  aggregatorStatsApi,
  announcementApi,
  publicAnnouncementApi,
  notificationApi,
  kyberDAO,
  identifyApi,
  ksSettingApi,
  crosschainApi,
  priceAlertApi,
  routeApi,
  socialApi,
  tokenApi,
  zapApi,
  zapEarnServiceApi,
  rewardServiceApi,
  rewardMerklApi,
  kyberdataServiceApi,
  referralApi,
  raffleCampaignApi,
  safepalCampaignApi,
  campaignApi,
  commonServiceApi,
  blackjackApi,
  marketOverviewApi,
  smartExitApi,
  tipLinkApi,
  tokenChartApi,
  restrictedTokensApi,
].map(api => api.middleware as Middleware)

export const makeStore = (preloadedState?: Partial<AppState>) =>
  configureStore({
    devTools: process.env.NODE_ENV !== 'production',
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: true, immutableCheck: false, serializableCheck: false })
        .concat(save({ states: PERSISTED_KEYS, debounce: 100 }) as Middleware)
        .concat(apiMiddlewares),
    preloadedState,
  })

export type AppStore = ReturnType<typeof makeStore>

const PREFIX_REDUX_PERSIST = 'redux_localstorage_simple_'
// remove unused redux keys in local storage (client-only)
function cleanupReduxPersist() {
  if (typeof window === 'undefined') return
  try {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(PREFIX_REDUX_PERSIST)) return
      const name = key.replace(PREFIX_REDUX_PERSIST, '')
      if (!PERSISTED_KEYS.includes(name)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {}
}

// remove all redux keys in local storage
export const removeAllReduxPersist = () => {
  if (typeof window === 'undefined') return
  try {
    Object.keys(localStorage).forEach(key => {
      const name = key.replace(PREFIX_REDUX_PERSIST, '')
      if (PERSISTED_KEYS.includes(name)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {}
}

let clientStore: AppStore | undefined
// Lazily create (once) the client-side store: hydrate from localStorage, prune stale
// persisted keys, and run the version migration. Only invoked on the client.
export const getClientStore = (): AppStore => {
  if (!clientStore) {
    clientStore = makeStore(getClientPreloadedState())
    cleanupReduxPersist()
    clientStore.dispatch(updateVersion())
  }
  return clientStore
}

// Default export: lazy client singleton in the browser; a fresh empty store under Node (prerender).
const store: AppStore = typeof window !== 'undefined' ? getClientStore() : makeStore()
export default store

/**
 * @see https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-dispatch-type
 */
export type AppDispatch = AppStore['dispatch']
