import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useBuildTelegramVerificationMutation,
  useGetSubscriptionTopicsQuery,
  useSubscribeTopicsMutation,
} from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'
import { useNotificationModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { pushUnique } from 'utils'

export enum TopicType {
  RESTRICT = 'restricted',
  NORMAL = 'common',
}

export type Topic = {
  id: number
  code: string
  description: string
  name: string
  isSubscribed: boolean
  topics: Topic[]
  priority: number
  type: TopicType
}

type SaveNotificationParam = {
  subscribeIds: number[]
  unsubscribeIds: number[]
  isEmail: boolean
  isTelegram?: boolean
}

const useNotification = () => {
  const { isLoading, topicGroups } = useSelector((state: AppState) => state.application.notification)
  const { formatUserInfo } = useSessionInfo()

  const { account, chainId } = useActiveWeb3React()
  const toggleSubscribeModal = useNotificationModalToggle()
  const dispatch = useDispatch()

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoadingNotification(isLoading))
    },
    [dispatch],
  )

  const { data: resp, refetch } = useGetSubscriptionTopicsQuery(undefined, { skip: !formatUserInfo })

  useEffect(() => {
    if (!resp) return
    const topicGroups: Topic[] = (resp?.topicGroups ?? []).map((e: Topic, i: number) => ({
      ...e,
      id: Date.now() + i,
      isSubscribed: e?.topics?.every(e => e.isSubscribed),
    }))
    dispatch(setSubscribedNotificationTopic({ topicGroups }))
  }, [resp, dispatch])

  const refreshTopics = useCallback(() => {
    try {
      account && refetch()
    } catch (error) {}
  }, [refetch, account])

  const [callSubscribeTopic] = useSubscribeTopicsMutation()
  const [buildTelegramVerification] = useBuildTelegramVerificationMutation()

  const saveNotification = useCallback(
    async ({ subscribeIds, unsubscribeIds, isEmail, isTelegram }: SaveNotificationParam) => {
      try {
        setLoading(true)
        if (isEmail) {
          let topicIds = topicGroups.reduce(
            (topics: number[], item) => [...topics, ...item.topics.filter(e => e.isSubscribed).map(e => e.id)],
            [],
          )
          if (unsubscribeIds.length) {
            topicIds = topicIds.filter(id => !unsubscribeIds.includes(id))
          }
          if (subscribeIds.length) {
            topicIds = topicIds.concat(subscribeIds)
          }
          await callSubscribeTopic({ topicIds: [...new Set(topicIds)] }).unwrap()
          return
        }
        if (isTelegram) {
          const data = await buildTelegramVerification({
            chainId: chainId + '',
            wallet: account ?? '',
            subscribe: subscribeIds,
            unsubscribe: unsubscribeIds,
          })
          return data
        }
        return
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, account, chainId, topicGroups, callSubscribeTopic, buildTelegramVerification],
  )

  const unsubscribeAll = useCallback(() => {
    let unsubscribeIds: number[] = []
    topicGroups.forEach(topic => {
      if (!topic.isSubscribed) return
      topic.topics.forEach(topic => {
        unsubscribeIds = pushUnique(unsubscribeIds, topic.id)
      })
    })
    if (!unsubscribeIds.length) return
    saveNotification({ isEmail: true, unsubscribeIds, subscribeIds: [] })
    setTimeout(() => {
      refreshTopics()
    }, 500)
  }, [topicGroups, saveNotification, refreshTopics])

  const showNotificationModal = useCallback(() => {
    refreshTopics()
    toggleSubscribeModal()
  }, [refreshTopics, toggleSubscribeModal])

  return {
    topicGroups,
    isLoading,
    saveNotification,
    showNotificationModal,
    refreshTopics,
    unsubscribeAll,
  }
}

export default useNotification
