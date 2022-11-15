import axios from 'axios'
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR, { mutate } from 'swr'

import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { AppState } from 'state'
import {
  setLoadingNotification,
  setNeedShowModalSubscribe,
  setSubscribedNotificationTopic,
} from 'state/application/actions'
import { useNotificationModalToggle } from 'state/application/hooks'

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
  TRENDING_SOON: 2,
  POSITION_POOL: 1, // todo
}

const useNotification = (topicId: number) => {
  const {
    isLoading,
    mapTopic = {},
    needShowModalSubscribe,
  } = useSelector((state: AppState) => state.application.notification)
  const { isSubscribed, isVerified, verifiedEmail } = mapTopic[topicId] ?? {}

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
    (isSubscribed: boolean, isVerified = false, verifiedEmail?: string) => {
      dispatch(setSubscribedNotificationTopic({ topicId, isSubscribed, isVerified, verifiedEmail }))
    },
    [dispatch, topicId],
  )

  const setNeedShowModalSubscribeState = useCallback(
    (value: boolean) => {
      dispatch(setNeedShowModalSubscribe(value))
    },
    [dispatch],
  )

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoadingNotification(isLoading))
    },
    [dispatch],
  )

  const { data: { topics } = {} } = useSWR(
    getSubscribedTopicUrl(account),
    (url: string) => {
      try {
        if (url) {
          return axios.get(url).then(({ data }) => data.data)
        }
      } catch (error) {}
      return
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const toggleSubscribeModal = useNotificationModalToggle()
  const refToggleSubscribeModal = useRef(toggleSubscribeModal)
  refToggleSubscribeModal.current = toggleSubscribeModal

  useEffect(() => {
    const topicInfo = topics?.find((el: Topic) => el.id === topicId)
    // topics: null | array when called api, undefined when not call api yet

    const hasSubscribed = !!topicInfo
    const email = topicInfo?.email
    const setState = (hasSubscribed: boolean, isVerified = false, email?: string) => {
      setTopicState(hasSubscribed, isVerified, email)
      if (!hasSubscribed && needShowModalSubscribe && account && topics !== undefined) {
        refToggleSubscribeModal.current?.()
        setNeedShowModalSubscribeState(false)
      }
    }
    if (email && account) {
      getSubscribeStatus(account, topicId, email)
        .then(data => {
          setState(hasSubscribed, data === 'VERIFIED', email)
        })
        .catch(() => {
          setState(hasSubscribed)
        })
    } else {
      setState(hasSubscribed)
    }
  }, [topics, setTopicState, topicId, account, setNeedShowModalSubscribeState, needShowModalSubscribe])

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

  return {
    isLoading,
    isSubscribed,
    isVerified,
    verifiedEmail,
    handleSubscribe,
    handleUnsubscribe,
    setNeedShowModalSubscribeState,
  }
}

export default useNotification
