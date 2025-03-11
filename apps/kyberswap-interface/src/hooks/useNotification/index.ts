import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useCreateWatchWalletMutation,
  useGetSubscriptionTopicsQuery,
  useSubscribeTopicsMutation,
} from 'services/identity'

import { ELASTIC_POOL_TOPIC_ID, PRICE_ALERT_TOPIC_ID } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'
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
  isPriceAlert: boolean
  isPriceElasticPool: boolean
}

type SaveNotificationParam = {
  subscribeIds: number[]
  unsubscribeIds: number[]
}

const useNotification = () => {
  const { isLoading, topicGroups } = useSelector((state: AppState) => state.application.notification)
  const { userInfo } = useSessionInfo()

  const { account } = useActiveWeb3React()
  const dispatch = useDispatch()

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoadingNotification(isLoading))
    },
    [dispatch],
  )

  const { data: resp, refetch } = useGetSubscriptionTopicsQuery(undefined, { skip: !userInfo })

  useEffect(() => {
    if (!resp) return
    const topicGroups: Topic[] = (resp?.topicGroups ?? []).map((e: Topic, i: number) => ({
      ...e,
      id: Date.now() + i,
      isSubscribed: e?.topics?.every(e => e.isSubscribed),
      isPriceAlert: e?.topics?.some(e => e.id + '' === PRICE_ALERT_TOPIC_ID),
      isPriceElasticPool: e?.topics?.some(e => e.id + '' === ELASTIC_POOL_TOPIC_ID),
    }))
    dispatch(setSubscribedNotificationTopic({ topicGroups }))
  }, [resp, dispatch])

  useEffect(() => {
    try {
      refetch()
    } catch (error) {}
  }, [userInfo?.identityId, refetch])

  const [requestWatchWallet] = useCreateWatchWalletMutation()
  const [callSubscribeTopic] = useSubscribeTopicsMutation()

  const saveNotification = useCallback(
    async ({ subscribeIds, unsubscribeIds }: SaveNotificationParam) => {
      try {
        setLoading(true)
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
        const hasElasticBool = (() => {
          const topicPools = ELASTIC_POOL_TOPIC_ID.split(',').map(Number)
          return subscribeIds.some(id => topicPools.includes(id))
        })()
        if (hasElasticBool && account) {
          await requestWatchWallet({ walletAddress: account }).unwrap()
        }
        await callSubscribeTopic({ topicIds: [...new Set(topicIds)] }).unwrap()
        return
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, account, topicGroups, callSubscribeTopic, requestWatchWallet],
  )

  const subscribeOne = useCallback(
    (topic: number) => {
      saveNotification({ subscribeIds: [topic], unsubscribeIds: [] })
    },
    [saveNotification],
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
    saveNotification({ unsubscribeIds, subscribeIds: [] })
  }, [topicGroups, saveNotification])

  return {
    topicGroups,
    isLoading,
    saveNotification,
    unsubscribeAll,
    subscribeOne,
  }
}

export default useNotification
