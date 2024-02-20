import { createAction } from '@reduxjs/toolkit'

import { AnnouncementTemplatePopup, PopupContent, PopupType } from 'components/Announcement/type'
import { Topic } from 'hooks/useNotification'
import { ConfirmModalState } from 'state/application/reducer'

import { ApplicationModal, ModalParams } from './types'

export { ApplicationModal }

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')
export const setOpenModal = createAction<{
  modal: ApplicationModal | null
  params: ModalParams[ApplicationModal] | undefined
}>('application/setOpenModal')
export const closeModal = createAction<ApplicationModal | null>('application/closeModal')
export const addPopup = createAction<{
  key?: string
  removeAfterMs?: number | null
  content: PopupContent
  popupType: PopupType
  account?: string
}>('application/addPopup')
export const removePopup = createAction<{ key: string }>('application/removePopup')

export const updatePrommETHPrice = createAction<{
  currentPrice: string
  oneDayBackPrice: string
  pricePercentChange: number
}>('application/updatePrommETHPrice')

export const updateETHPrice = createAction<{
  currentPrice: string
  oneDayBackPrice: string
  pricePercentChange: number
}>('application/updateETHPrice')

export const updateServiceWorker = createAction<ServiceWorkerRegistration>('application/updateServiceWorker')

export const setSubscribedNotificationTopic = createAction<{
  topicGroups: Topic[]
}>('application/setSubscribedNotificationTopic')

export const setLoadingNotification = createAction<boolean>('application/setLoadingNotification')

export const setAnnouncementDetail = createAction<{
  selectedIndex: number | null
  announcements: AnnouncementTemplatePopup[]
  hasMore: boolean
}>('application/setAnnouncementDetail')

export const setConfirmData = createAction<ConfirmModalState>('application/setConfirmData')
export const setCoinbaseLoading = createAction<boolean>('application/setCoinbaseLoading')
export const setCoinbaseIsSubscribed = createAction<boolean>('application/setCoinbaseIsSubscribed')
export const setCoinbaseScriptLoaded = createAction<boolean>('application/setCoinbaseScriptLoaded')
