import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetSafePalCampaignUserStatsQuery, useJoinSafePalCampaignMutation } from 'services/campaignSafepal'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { resolveSelectedCampaignWeek } from 'pages/Campaign/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

const SAFEPAL_JOINED_SESSION_KEY = 'safepal_joined_weeks'

type JoinedWeeksStore = Record<string, Record<number, boolean>>

const readJoinedWeeksStore = (): JoinedWeeksStore => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(SAFEPAL_JOINED_SESSION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.warn('Failed to read SafePal session store', error)
    return {}
  }
}

const hasJoinedWeekInSession = (address: string, weekValue: number) => {
  if (weekValue < 0) return false
  const normalized = address.toLowerCase()
  const store = readJoinedWeeksStore()
  return !!store[normalized]?.[weekValue]
}

const saveJoinedWeekInSession = (address: string, weekValue: number) => {
  if (typeof window === 'undefined' || weekValue < 0) return
  const normalized = address.toLowerCase()
  const store = readJoinedWeeksStore()
  const accountStore = store[normalized] || {}
  const nextStore = {
    ...store,
    [normalized]: {
      ...accountStore,
      [weekValue]: true,
    },
  }
  try {
    window.sessionStorage.setItem(SAFEPAL_JOINED_SESSION_KEY, JSON.stringify(nextStore))
  } catch (error) {
    console.warn('Failed to save SafePal session store', error)
  }
}

type Props = {
  selectedWeek: number
  enabled: boolean
}

export const useSafePalCampaignJoin = ({ selectedWeek, enabled }: Props) => {
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()

  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()

  const { weeks } = campaignConfig[CampaignType.SafePal]
  const [joinCampaign] = useJoinSafePalCampaignMutation()

  const selectedRange = useMemo(() => resolveSelectedCampaignWeek(weeks, selectedWeek), [selectedWeek, weeks])
  const selectedWeekValue = selectedRange?.value ?? selectedWeek

  const {
    data: userStats,
    refetch: refetchUserStats,
    isLoading: isLoadingUserStats,
  } = useGetSafePalCampaignUserStatsQuery(
    {
      address: account || ZERO_ADDRESS,
      fromTs: selectedRange?.start || 0,
      toTs: selectedRange?.end || 0,
    },
    { skip: !enabled || !account || !selectedRange },
  )

  const [isSessionJoined, setIsSessionJoined] = useState(() =>
    account ? hasJoinedWeekInSession(account, selectedWeekValue) : false,
  )

  useEffect(() => {
    setIsSessionJoined(account ? hasJoinedWeekInSession(account, selectedWeekValue) : false)
  }, [account, selectedWeekValue])

  const isJoinedByWeek = useMemo(() => {
    const week = userStats?.weeks.find(week => week.cycle === selectedWeekValue)
    const participantJoined = week?.joined ?? userStats?.joined ?? false

    return participantJoined || isSessionJoined
  }, [isSessionJoined, selectedWeekValue, userStats])

  const onJoin = useCallback(async () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!library) {
      notify({
        title: t`Unable to access wallet`,
        summary: t`Please reconnect your wallet and try again.`,
        type: NotificationType.ERROR,
      })
      return
    }

    try {
      const nonce = String(10_000_000 + Math.floor(Math.random() * 90_000_000))
      const message = new SiweMessage({
        domain: window.location.host,
        address: account,
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      }).prepareMessage()

      const signature = await library.getSigner().signMessage(message)
      await joinCampaign({ userAddress: account, message, signature }).unwrap()
      saveJoinedWeekInSession(account, selectedWeekValue)
      setIsSessionJoined(true)

      notify({
        title: t`Joined SafePal Campaign`,
        type: NotificationType.SUCCESS,
      })
    } catch (error) {
      if (error.code === 4001) {
        notify({
          title: t`Signature canceled`,
          type: NotificationType.ERROR,
        })
      } else {
        notify({
          title: t`Unable to join SafePal Campaign`,
          summary: error.message || error.data?.message || t`Something went wrong. Please try again.`,
          type: NotificationType.ERROR,
        })
      }
    } finally {
      void refetchUserStats()
    }
  }, [account, chainId, joinCampaign, library, notify, refetchUserStats, selectedWeekValue, toggleWalletModal])

  return {
    onJoin,
    isJoinedByWeek,
    userStats,
    isLoadingUserStats,
  }
}
