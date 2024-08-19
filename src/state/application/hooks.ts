import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { KyberSwapConfig, KyberSwapConfigResponse } from 'services/ksSetting'

import { ackAnnouncementPopup, getAnnouncementsAckMap, isPopupCanShow } from 'components/Announcement/helper'
import {
  AnnouncementTemplatePopup,
  PopupContent,
  PopupContentAnnouncement,
  PopupContentSimple,
  PopupContentTxn,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { NETWORKS_INFO } from 'constants/networks'
import { AppJsonRpcProvider } from 'constants/providers'
import { KNC_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks/index'
import { useAppSelector } from 'state/hooks'
import { AppDispatch, AppState } from 'state/index'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { createClient } from 'utils/client'

import { ApplicationModal, addPopup, closeModal, removePopup, setAnnouncementDetail, setOpenModal } from './actions'
import { ModalParams } from './types'

export function useBlockNumber(): number | undefined {
  const { chainId } = useActiveWeb3React()

  return useSelector((state: AppState) => state.application.blockNumber[chainId])
}

export const useCloseModal = (modal: ApplicationModal): (() => void) => {
  const dispatch = useDispatch<AppDispatch>()

  const onCloseModal = useCallback(() => {
    dispatch(closeModal(modal))
  }, [dispatch, modal])

  return onCloseModal
}

export function useModalOpen(modal: ApplicationModal): boolean {
  const openModal = useSelector((state: AppState) => state.application.openModal)
  return openModal === modal
}

export function useModalOpenParams<T extends ApplicationModal>(modal: T): ModalParams[T] | undefined {
  const openModalParams = useSelector((state: AppState) => state.application.openModalParams[modal])
  return openModalParams
}

type OpenModalReturnType<T extends ApplicationModal, U extends ModalParams[T]> = U extends undefined
  ? () => void
  : (params: U) => void

export function useToggleModal<T extends ApplicationModal, U extends ModalParams[T]>(
  modal: T,
): OpenModalReturnType<T, U> {
  const open = useModalOpen(modal)
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (params?: U) => {
      dispatch(setOpenModal({ modal: open ? null : modal, params }))
    },
    [dispatch, modal, open],
  ) as OpenModalReturnType<T, U>
}

export function useToggleNotificationCenter() {
  const toggleNotificationCenter = useToggleModal(ApplicationModal.NOTIFICATION_CENTER)
  const clearAllPopup = useRemoveAllPopupByType()
  return useCallback(() => {
    toggleNotificationCenter()
    clearAllPopup(PopupType.TOP_RIGHT)
  }, [clearAllPopup, toggleNotificationCenter])
}

export function useOpenModal<T extends ApplicationModal, U extends ModalParams[T]>(
  modal: T,
): OpenModalReturnType<T, U> {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (params?: U) => {
      dispatch(setOpenModal({ modal, params }))
    },
    [dispatch, modal],
  ) as OpenModalReturnType<T, U>
}

export function useNetworkModalToggle(): () => void {
  return useToggleModal(ApplicationModal.NETWORK)
}

export function useOpenNetworkModal(): () => void {
  return useOpenModal(ApplicationModal.NETWORK)
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET)
}

export function useToggleTransactionSettingsMenu(): () => void {
  return useToggleModal(ApplicationModal.TRANSACTION_SETTINGS)
}

export function usePoolDetailModalToggle(): () => void {
  return useToggleModal(ApplicationModal.POOL_DETAIL)
}

type AddPopupPayload = {
  content: PopupContent
  popupType: PopupType
  key?: string
  removeAfterMs?: number | null
  account?: string
}
// returns a function that allows adding a popup
export function useAddPopup(): (data: AddPopupPayload) => void {
  const dispatch = useDispatch()

  return useCallback(
    (data: AddPopupPayload) => {
      dispatch(addPopup(data))
    },
    [dispatch],
  )
}

// simple notify with text and description
export const useNotify = () => {
  const addPopup = useAddPopup()
  return useCallback(
    (data: PopupContentSimple, removeAfterMs: number | null | undefined = 4000) => {
      addPopup({ content: data, popupType: PopupType.SIMPLE, key: data.title + Math.random(), removeAfterMs })
    },
    [addPopup],
  )
}

// popup notify transaction
export const useTransactionNotify = () => {
  const addPopup = useAddPopup()
  return useCallback(
    (data: PopupContentTxn) => {
      addPopup({
        content: data,
        popupType: PopupType.TRANSACTION,
        key: data.hash,
        account: data.account,
      })
    },
    [addPopup],
  )
}

// returns a function that allows removing a popup via its key
export function useRemovePopup() {
  const dispatch = useDispatch()
  return useCallback(
    (popup: PopupItemType) => {
      const { key, popupType, content } = popup
      if ([PopupType.CENTER, PopupType.SNIPPET, PopupType.TOP_RIGHT, PopupType.TOP_BAR].includes(popupType)) {
        ackAnnouncementPopup((content as PopupContentAnnouncement).metaMessageId)
      }
      dispatch(removePopup({ key }))
    },
    [dispatch],
  )
}

export function useRemoveAllPopupByType() {
  const data = useActivePopups()
  const removePopup = useRemovePopup()

  return useCallback(
    (typesRemove: PopupType) => {
      const { snippetPopups, centerPopups, topPopups, topRightPopups } = data

      const map: Record<PopupType, PopupItemType[]> = {
        [PopupType.SNIPPET]: snippetPopups,
        [PopupType.CENTER]: centerPopups,
        [PopupType.TOP_BAR]: topPopups,
        [PopupType.TOP_RIGHT]: topRightPopups,
        [PopupType.SIMPLE]: topRightPopups,
        [PopupType.TRANSACTION]: topRightPopups,
      }
      const popups: PopupItemType[] = map[typesRemove] ?? []
      popups.forEach(removePopup)
    },
    [data, removePopup],
  )
}

// get the list of active popups
export function useActivePopups() {
  const popups = useSelector(
    (state: AppState) => state.application.popupList,
  ) as PopupItemType<PopupContentAnnouncement>[]
  const { chainId, account } = useActiveWeb3React()

  return useMemo(() => {
    const topRightPopups = popups.filter(item => {
      const { popupType, content } = item
      if (popupType === PopupType.SIMPLE) return true
      if (popupType === PopupType.TRANSACTION) return account === item.account

      const announcementsAckMap = getAnnouncementsAckMap()
      const isRead = announcementsAckMap[content?.metaMessageId]
      if (popupType === PopupType.TOP_RIGHT) return !isRead
      return false
    })

    const topPopups = popups.filter(e => e.popupType === PopupType.TOP_BAR && isPopupCanShow(e, chainId, account))
    const snippetPopups = popups.filter(e => e.popupType === PopupType.SNIPPET && isPopupCanShow(e, chainId, account))

    const centerPopups = popups.filter(e => e.popupType === PopupType.CENTER && isPopupCanShow(e, chainId, account))
    return {
      topPopups,
      centerPopups,
      topRightPopups,
      snippetPopups,
    }
  }, [popups, chainId, account])
}

// todo: should fetch from price service
export function useETHPrice(): AppState['application']['ethPrice'] {
  const ethPrice = useSelector((state: AppState) => state.application.ethPrice)

  return ethPrice
}

export function useKNCPrice() {
  const { data } = useTokenPricesWithLoading([KNC_ADDRESS], ChainId.MAINNET)
  if (!data) return 0
  return data[KNC_ADDRESS]
}

export const useServiceWorkerRegistration = () => {
  return useAppSelector(state => state.application.serviceWorkerRegistration)
}

type DetailAnnouncementParam = {
  selectedIndex: number | null
  hasMore?: boolean
  announcements?: AnnouncementTemplatePopup[]
}

export const useDetailAnnouncement = (): [DetailAnnouncementParam, (v: DetailAnnouncementParam) => void] => {
  const announcementDetail = useAppSelector(state => state.application.notification?.announcementDetail)
  const dispatch = useDispatch()
  const setDetail = useCallback(
    (data: DetailAnnouncementParam) => {
      dispatch(setAnnouncementDetail({ ...announcementDetail, ...data }))
    },
    [dispatch, announcementDetail],
  )
  return [announcementDetail, setDetail]
}

const cacheConfig: {
  rpc: { [rpc: string]: AppJsonRpcProvider }
  client: { [subgraphLink: string]: ApolloClient<NormalizedCacheObject> }
} = {
  rpc: {},
  client: {},
}

const cacheCalc: <T extends keyof typeof cacheConfig, U extends typeof cacheConfig[T][string]>(
  type: T,
  value: string,
  fallback: (value: string) => U,
) => U = <T extends keyof typeof cacheConfig, U extends typeof cacheConfig[T][string]>(
  type: T,
  value: string,
  fallback: (value: string) => U,
) => {
  if (!cacheConfig[type][value]) {
    cacheConfig[type][value] = fallback(value)
  }
  return cacheConfig[type][value] as U
}

function getDefaultConfig(chainId: ChainId): KyberSwapConfigResponse {
  return {
    rpc: NETWORKS_INFO[chainId].defaultRpcUrl,
    isEnableKNProtocol: false,
    isEnableBlockService: false,
    blockSubgraph: NETWORKS_INFO[chainId].defaultBlockSubgraph,
    elasticSubgraph: NETWORKS_INFO[chainId].elastic.defaultSubgraph,
    classicSubgraph: NETWORKS_INFO[chainId].classic.defaultSubgraph,
    commonTokens: undefined,
  }
}

export const useKyberSwapConfig = (customChainId?: ChainId): KyberSwapConfig => {
  const storeChainId = useAppSelector(state => state.user.chainId) || ChainId.MAINNET
  const chainId = customChainId || storeChainId

  const config = useAppSelector(state => state.application.config[chainId] || getDefaultConfig(chainId))

  const readProvider = useMemo(() => {
    return cacheCalc('rpc', config.rpc, rpc => new AppJsonRpcProvider(rpc, chainId))
  }, [config.rpc, chainId])
  const blockClient = useMemo(
    () => cacheCalc('client', config.blockSubgraph, subgraph => createClient(subgraph)),
    [config.blockSubgraph],
  )
  const classicClient = useMemo(
    () => cacheCalc('client', config.classicSubgraph, subgraph => createClient(subgraph)),
    [config.classicSubgraph],
  )
  const elasticClient = useMemo(
    () => cacheCalc('client', config.elasticSubgraph, subgraph => createClient(subgraph)),
    [config.elasticSubgraph],
  )

  return useMemo(() => {
    return {
      rpc: config.rpc,
      isEnableBlockService: config.isEnableBlockService,
      isEnableKNProtocol: config.isEnableKNProtocol,
      readProvider,
      blockClient,
      elasticClient,
      classicClient,
      commonTokens: config.commonTokens,
    }
  }, [
    config.rpc,
    config.isEnableBlockService,
    config.isEnableKNProtocol,
    config.commonTokens,
    readProvider,
    blockClient,
    elasticClient,
    classicClient,
  ])
}
