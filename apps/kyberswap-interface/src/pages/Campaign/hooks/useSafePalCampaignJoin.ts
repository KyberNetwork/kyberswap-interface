import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { useGetSafePalCampaignUserStatsQuery, useJoinSafePalCampaignMutation } from 'services/campaignSafepal'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { resolveSelectedCampaignWeek } from 'pages/Campaign/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

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

  const isJoinedByWeek = useMemo(() => {
    const week = userStats?.weeks.find(week => week.cycle === selectedWeek)
    return week?.joined || false
  }, [userStats, selectedWeek])

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
      await refetchUserStats()

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
    }
  }, [account, chainId, joinCampaign, library, notify, refetchUserStats, toggleWalletModal])

  return {
    onJoin,
    isJoinedByWeek,
    userStats,
    isLoadingUserStats,
  }
}
