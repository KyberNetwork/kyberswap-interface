import axios from 'axios'
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { AppState } from 'state'
import { setSubscribedNotificationState } from 'state/application/actions'

const getSubscribedTopics = async (account: string): Promise<{ topics: Topic[] }> => {
  const { data } = await axios.get(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics?walletAddress=${account}`) // todo change and check api call
  return data.data
}
type Topic = {
  id: number
  code: string
  description: string
}

export const NOTIFICATION_TOPICS = {
  TRENDING_SOON: 1,
  POSITION_POOL: 2,
}
// todo check sync 2 topic khác nhau
const useNotification = (topicId: number) => {
  const { hasSubscribedEmail, isLoading } = useSelector((state: AppState) => state.application.notification)

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

  const setHasSubscribed = useCallback(
    (hasSubscribedEmail: boolean, loading?: boolean) => {
      dispatch(setSubscribedNotificationState({ hasSubscribedEmail }))
    },
    [dispatch],
  )
  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setSubscribedNotificationState({ isLoading }))
    },
    [dispatch],
  )

  const checkingTopic = useRef(false)
  useEffect(() => {
    if (!account || checkingTopic.current) return
    checkingTopic.current = true
    getSubscribedTopics(account)
      .then(({ topics = [] }) => {
        // todo check api call
        setHasSubscribed(!!topics.find(el => el.id === topicId))
      })
      .catch(console.error)
      .finally(() => {
        checkingTopic.current = false
      })
  }, [account, topicId, setHasSubscribed])

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
        setHasSubscribed(true)
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
      return
    },
    [setHasSubscribed, setLoading, trackingSubScribe, topicId, account],
  )

  const handleUnsubscribe = useCallback(async () => {
    try {
      setLoading(true)
      await axios.post(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics/unsubscribe?userType=EMAIL`, {
        data: {
          walletAddress: account,
          topicIDs: [topicId],
        },
      })
      trackingUnSubScribe(topicId)
      setHasSubscribed(false)
    } catch (e) {
      return Promise.reject(e)
    } finally {
      setLoading(false)
    }
    return
  }, [setHasSubscribed, setLoading, trackingUnSubScribe, topicId, account])

  return { isLoading, hasSubscribedEmail, handleSubscribe, handleUnsubscribe }
}

export default useNotification
