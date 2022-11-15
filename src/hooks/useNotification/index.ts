import axios from 'axios'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR, { mutate } from 'swr'

import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'

const getSubscribedTopicUrl = (account: string | null | undefined) =>
  account ? `${process.env.REACT_APP_NOTIFICATION_API}/v1/topics?walletAddress=${account}` : ''

const getSubscribeStatus = async (
  walletAddress: string,
  topicID: number,
  email: string,
): Promise<'VERIFIED' | 'UNVERIFIED'> => {
  const { data } = await axios.get(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics/verify/status`, {
    params: { walletAddress, topicID, email },
  })
  return data.data
}

type Topic = {
  id: number
  code: string
  description: string
}

export const NOTIFICATION_TOPICS = {
  TRENDING_SOON: 1, // todo
  POSITION_POOL: 1,
}
const useNotification = (topicId: number) => {
  const { isLoading, mapTopic = {} } = useSelector((state: AppState) => state.application.notification)
  const { isSubscribed, isVerified } = mapTopic[topicId] ?? {}

  const { mixpanelHandler } = useMixpanel()
  const { account } = useActiveWeb3React()
  const dispatch = useDispatch()

  const trackingSubScribe = useCallback(
    (topicId: number) => {
      switch (topicId) {
        case NOTIFICATION_TOPICS.TRENDING_SOON:
          mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS)
          break
      }
    },
    [mixpanelHandler],
  )

  const trackingUnSubScribe = useCallback(
    (topicId: number) => {
      switch (topicId) {
        case NOTIFICATION_TOPICS.TRENDING_SOON:
          mixpanelHandler(MIXPANEL_TYPE.DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS)
          break
      }
    },
    [mixpanelHandler],
  )

  const setTopicState = useCallback(
    (isSubscribed: boolean, isVerified = false) => {
      dispatch(setSubscribedNotificationTopic({ topicId, isSubscribed, isVerified }))
    },
    [dispatch, topicId],
  )

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoadingNotification(isLoading))
    },
    [dispatch],
  )

  const { data: { topics = [] } = {} } = useSWR(
    getSubscribedTopicUrl(account),
    (url: string) => {
      try {
        if (url) return axios.get(url).then(({ data }) => data.data)
      } catch (error) {}
      return
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  useEffect(() => {
    const topicInfo = topics?.find((el: Topic) => el.id === topicId)
    const hasSubscribed = !!topicInfo
    const email = topicInfo?.email
    if (email && account) {
      getSubscribeStatus(account, topicId, email)
        .then(data => {
          setTopicState(hasSubscribed, data === 'VERIFIED')
        })
        .catch(() => {
          setTopicState(hasSubscribed)
        })
    } else {
      setTopicState(hasSubscribed)
    }
  }, [topics, setTopicState, topicId, account])

  const handleSubscribe = useCallback(
    async (email: string) => {
      try {
        setLoading(true)
        await axios.post(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics/subscribe?userType=EMAIL`, {
          email,
          walletAddress: account,
          topicIDs: [topicId],
        })
        trackingSubScribe(topicId)
        setTopicState(true)
        mutate(getSubscribedTopicUrl(account))
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
      return
    },
    [setTopicState, setLoading, trackingSubScribe, topicId, account],
  )

  const handleUnsubscribe = useCallback(async () => {
    try {
      setLoading(true)
      await axios.post(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics/unsubscribe?userType=EMAIL`, {
        walletAddress: account,
        topicIDs: [topicId],
      })
      trackingUnSubScribe(topicId)
      setTopicState(false)
      mutate(getSubscribedTopicUrl(account))
    } catch (e) {
      return Promise.reject(e)
    } finally {
      setLoading(false)
    }
    return
  }, [setTopicState, setLoading, trackingUnSubScribe, topicId, account])

  return { isLoading, isSubscribed, isVerified, handleSubscribe, handleUnsubscribe }
}

export default useNotification
