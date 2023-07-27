import { configureStore } from '@reduxjs/toolkit'
import { load, save } from 'redux-localstorage-simple'
import kyberAISubscriptionApi from 'services/kyberAISubscription'
import priceAlertApi from 'services/priceAlert'
import routeApi from 'services/route'
import tokenApi from 'services/token'

import { ENV_LEVEL } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import kyberAIApi from 'pages/TrueSightV2/hooks/useKyberAIData'

import announcementApi, { publicAnnouncementApi } from '../services/announcement'
import crosschainApi from '../services/crossChain'
import earningApi from '../services/earning'
import geckoTerminalApi from '../services/geckoTermial'
import identifyApi from '../services/identity'
import ksSettingApi from '../services/ksSetting'
import socialApi from '../services/social'
import application from './application/reducer'
import authen from './authen/reducer'
import burnProAmm from './burn/proamm/reducer'
import burn from './burn/reducer'
import campaigns from './campaigns/reducer'
import crossChain from './crossChain/reducer'
import customizeDexes from './customizeDexes'
import farms from './farms/classic/reducer'
import elasticFarm from './farms/elastic'
import elasticFarmV2 from './farms/elasticv2'
import { updateVersion } from './global/actions'
import limit from './limit/reducer'
import lists from './lists/reducer'
import mintV2 from './mint/proamm/reducer'
import mint from './mint/reducer'
import multicall from './multicall/reducer'
import myEarnings from './myEarnings/reducer'
import pair from './pair/reducer'
import pools from './pools/reducer'
import profile from './profile/reducer'
import swap from './swap/reducer'
import tokenPrices from './tokenPrices'
import topTokens from './topTokens'
import transactions from './transactions/reducer'
import tutorial from './tutorial/reducer'
import user from './user/reducer'
import vesting from './vesting/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'profile']
ENV_LEVEL < ENV_TYPE.PROD && PERSISTED_KEYS.push('customizeDexes')

const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: {
    application,
    authen,
    profile,
    user,
    transactions,
    swap,
    limit,
    mint,
    mintV2,
    burn,
    burnProAmm,
    multicall,
    lists,
    pair,
    pools,
    farms,
    vesting,
    [announcementApi.reducerPath]: announcementApi.reducer,
    [publicAnnouncementApi.reducerPath]: publicAnnouncementApi.reducer,
    [geckoTerminalApi.reducerPath]: geckoTerminalApi.reducer,
    [kyberAIApi.reducerPath]: kyberAIApi.reducer,
    [kyberAISubscriptionApi.reducerPath]: kyberAISubscriptionApi.reducer,
    [identifyApi.reducerPath]: identifyApi.reducer,
    [ksSettingApi.reducerPath]: ksSettingApi.reducer,
    [crosschainApi.reducerPath]: crosschainApi.reducer,
    [priceAlertApi.reducerPath]: priceAlertApi.reducer,
    [socialApi.reducerPath]: socialApi.reducer,
    campaigns,
    tutorial,
    myEarnings,
    crossChain,
    customizeDexes,
    elasticFarm,
    elasticFarmV2,
    tokenPrices,
    topTokens,
    [routeApi.reducerPath]: routeApi.reducer,
    [earningApi.reducerPath]: earningApi.reducer,
    [tokenApi.reducerPath]: tokenApi.reducer,
    [socialApi.reducerPath]: socialApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ thunk: true, immutableCheck: false, serializableCheck: false })
      .concat(save({ states: PERSISTED_KEYS, debounce: 100 }))
      .concat(geckoTerminalApi.middleware)
      .concat(kyberAIApi.middleware)
      .concat(kyberAISubscriptionApi.middleware)
      .concat(identifyApi.middleware)
      .concat(announcementApi.middleware)
      .concat(publicAnnouncementApi.middleware)
      .concat(kyberAISubscriptionApi.middleware)
      .concat(identifyApi.middleware)
      .concat(ksSettingApi.middleware)
      .concat(socialApi.middleware)
      .concat(crosschainApi.middleware)
      .concat(priceAlertApi.middleware)
      .concat(routeApi.middleware)
      .concat(earningApi.middleware)
      .concat(socialApi.middleware)
      .concat(tokenApi.middleware),
  preloadedState: load({ states: PERSISTED_KEYS }),
})

const PREFIX_REDUX_PERSIST = 'redux_localstorage_simple_'
// remove unused redux keys in local storage
try {
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith(PREFIX_REDUX_PERSIST)) return
    const name = key.replace(PREFIX_REDUX_PERSIST, '')
    if (!PERSISTED_KEYS.includes(name)) {
      localStorage.removeItem(key)
    }
  })
} catch (error) {}

// remove all redux keys in local storage
export const removeAllReduxPersist = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      const name = key.replace(PREFIX_REDUX_PERSIST, '')
      if (PERSISTED_KEYS.includes(name)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {}
}

store.dispatch(updateVersion())

export default store
export type AppState = ReturnType<typeof store.getState>

/**
 * @see https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-dispatch-type
 */
export type AppDispatch = typeof store.dispatch
