import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer, nanoid } from '@reduxjs/toolkit'
import ksSettingApi, { KyberSwapConfigResponse } from 'services/ksSetting'

import { AnnouncementTemplatePopup, PopupItemType } from 'components/Announcement/type'
import { NETWORKS_INFO } from 'constants/networks'
import { Topic } from 'hooks/useNotification'

import {
  ApplicationModal,
  addPopup,
  closeModal,
  removePopup,
  setAnnouncementDetail,
  setCoinbaseIsSubscribed,
  setCoinbaseLoading,
  setCoinbaseScriptLoaded,
  setConfirmData,
  setLoadingNotification,
  setOpenModal,
  setSubscribedNotificationTopic,
  updateBlockNumber,
  updateETHPrice,
  updatePrommETHPrice,
  updateServiceWorker,
} from './actions'
import { ModalParams } from './types'

type ETHPrice = {
  currentPrice?: string
  oneDayBackPrice?: string
  pricePercentChange?: number
}

export type ConfirmModalState = {
  isOpen: boolean
  cancelText?: string
  confirmText: string
  title?: string
  content: string | React.ReactNode
  onConfirm?: () => void
  onCancel?: () => void
}

interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupItemType[]
  readonly openModal: ApplicationModal | null
  readonly openModalParams: { [key in ApplicationModal]?: ModalParams[key] }
  readonly ethPrice: ETHPrice
  readonly prommEthPrice: ETHPrice
  readonly serviceWorkerRegistration: ServiceWorkerRegistration | null

  readonly notification: {
    isLoading: boolean
    topicGroups: Topic[]
    announcementDetail: {
      selectedIndex: number | null // current announcement
      announcements: AnnouncementTemplatePopup[]
      hasMore: boolean // need to load more or not
    }
  }
  readonly config: {
    [chainId in ChainId]?: KyberSwapConfigResponse
  }
  readonly confirmModal: ConfirmModalState
  readonly coinbaseSubscribe: {
    isLoading: boolean
    isSubscribed: boolean
    isScriptLoaded: boolean
  }
}
const initialStateNotification = {
  isLoading: false,
  topicGroups: [],
  announcementDetail: {
    selectedIndex: null,
    announcements: [],
    hasMore: false,
  },
}

export const initialStateConfirmModal = {
  isOpen: false,
  cancelText: '',
  confirmText: '',
  content: '',
  title: '',
  onConfirm: undefined,
  onCancel: undefined,
}

const initialState: ApplicationState = {
  blockNumber: {},
  popupList: [],
  openModal: null,
  openModalParams: {},
  ethPrice: {},
  prommEthPrice: {},
  serviceWorkerRegistration: null,
  notification: initialStateNotification,
  config: {},
  confirmModal: initialStateConfirmModal,
  coinbaseSubscribe: {
    isLoading: true,
    isSubscribed: false,
    isScriptLoaded: false,
  },
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateBlockNumber, (state, action) => {
      const { chainId, blockNumber } = action.payload
      if (typeof state.blockNumber[chainId] !== 'number') {
        state.blockNumber[chainId] = blockNumber
      } else {
        state.blockNumber[chainId] = Math.max(blockNumber, state.blockNumber[chainId])
      }
    })
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload.modal
      if (action.payload.modal) state.openModalParams[action.payload.modal] = action.payload.params as any
    })
    .addCase(closeModal, (state, action) => {
      if (state.openModal === action.payload) {
        state.openModal = null
      }
    })
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15000, popupType, account } }) => {
      const { popupList } = state
      state.popupList = (key ? popupList.filter(popup => popup.key !== key) : popupList).concat([
        {
          key: key || nanoid(),
          content,
          removeAfterMs,
          popupType,
          account,
        },
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList = state.popupList.filter(p => p.key !== key)
    })
    .addCase(updatePrommETHPrice, (state, { payload: { currentPrice, oneDayBackPrice, pricePercentChange } }) => {
      state.prommEthPrice.currentPrice = currentPrice
      state.prommEthPrice.oneDayBackPrice = oneDayBackPrice
      state.prommEthPrice.pricePercentChange = pricePercentChange
    })

    .addCase(updateETHPrice, (state, { payload: { currentPrice, oneDayBackPrice, pricePercentChange } }) => {
      state.ethPrice.currentPrice = currentPrice
      state.ethPrice.oneDayBackPrice = oneDayBackPrice
      state.ethPrice.pricePercentChange = pricePercentChange
    })

    .addCase(updateServiceWorker, (state, { payload }) => {
      state.serviceWorkerRegistration = payload
    })
    .addCase(setConfirmData, (state, { payload }) => {
      state.confirmModal = payload
    })

    // ------ notification subscription ------
    .addCase(setLoadingNotification, (state, { payload: isLoading }) => {
      const notification = state.notification ?? initialStateNotification
      state.notification = { ...notification, isLoading }
    })
    .addCase(setSubscribedNotificationTopic, (state, { payload: { topicGroups } }) => {
      const notification = state.notification ?? initialStateNotification
      state.notification = {
        ...notification,
        topicGroups: topicGroups ?? notification.topicGroups,
      }
    })
    .addCase(setAnnouncementDetail, (state, { payload }) => {
      const notification = state.notification ?? initialStateNotification
      const announcementDetail = { ...notification.announcementDetail, ...payload }
      state.notification = {
        ...notification,
        announcementDetail,
      }
    })
    .addCase(setCoinbaseLoading, (state, { payload }) => {
      state.coinbaseSubscribe = {
        ...state.coinbaseSubscribe,
        isLoading: payload,
      }
    })
    .addCase(setCoinbaseIsSubscribed, (state, { payload }) => {
      state.coinbaseSubscribe = {
        ...state.coinbaseSubscribe,
        isSubscribed: payload,
      }
    })
    .addCase(setCoinbaseScriptLoaded, (state, { payload }) => {
      state.coinbaseSubscribe = {
        ...state.coinbaseSubscribe,
        isScriptLoaded: payload,
      }
    })

    .addMatcher(ksSettingApi.endpoints.getKyberswapConfiguration.matchFulfilled, (state, action) => {
      const chainId = action.meta.arg.originalArgs
      const data = action.payload.data.config
      const rpc = data?.rpc || NETWORKS_INFO[chainId].defaultRpcUrl
      const isEnableBlockService = data?.isEnableBlockService ?? false
      const isEnableKNProtocol = data?.isEnableKNProtocol ?? false

      const blockSubgraph = data?.blockSubgraph || NETWORKS_INFO[chainId].defaultBlockSubgraph

      const classicSubgraph = data?.classicSubgraph || NETWORKS_INFO[chainId].classic.defaultSubgraph

      const elasticSubgraph = data?.elasticSubgraph || NETWORKS_INFO[chainId].elastic.defaultSubgraph

      if (!state.config) state.config = {}
      state.config = {
        ...state.config,
        [chainId]: {
          rpc,
          isEnableBlockService,
          isEnableKNProtocol,
          blockSubgraph,
          elasticSubgraph,
          classicSubgraph,
          commonTokens: data.commonTokens,
        },
      }
    }),
)
