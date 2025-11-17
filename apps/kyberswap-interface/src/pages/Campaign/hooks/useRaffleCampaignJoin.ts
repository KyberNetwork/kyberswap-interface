import { t } from '@lingui/macro'
import { useCallback } from 'react'
import {
  useGetRaffleCampaignParticipantQuery,
  useGetRaffleCampaignStatsQuery,
  useJoinRaffleCampaignMutation,
} from 'services/campaignRaffle'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

import { isRaffleStarted } from '../constants'

type Props = {
  selectedWeek: number
}

export const useRaffleCampaignJoin = ({ selectedWeek }: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()

  const [joinCampaign] = useJoinRaffleCampaignMutation()

  const { data: campaignStats, refetch: refetchCampaignStats } = useGetRaffleCampaignStatsQuery(undefined, {
    skip: !isRaffleStarted,
    pollingInterval: 10_000,
  })

  const { data: participant, refetch: refetchParticipant } = useGetRaffleCampaignParticipantQuery(
    { address: account ?? '' },
    {
      skip: !isRaffleStarted || !account,
      pollingInterval: 10_000,
    },
  )

  const isNotEligible = !!account && participant?.eligible === false
  const isJoinedByWeek =
    !!participant?.[`joined_week${selectedWeek + 1}_at` as keyof typeof participant] && selectedWeek >= 0

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
      await joinCampaign({ address: account, message, signature, week: `week_${selectedWeek + 1}` }).unwrap()

      notify({
        title: t`Joined Raffle Campaign`,
        type: NotificationType.SUCCESS,
      })
    } catch (error) {
      console.warn('Raffle campaign join error:', error)
      notify({
        title: t`Unable to join Raffle Campaign`,
        summary: error.message || error.data?.message || t`Something went wrong. Please try again.`,
        type: NotificationType.ERROR,
      })
    } finally {
      refetchParticipant()
      refetchCampaignStats()
    }
  }, [
    account,
    chainId,
    joinCampaign,
    library,
    selectedWeek,
    notify,
    refetchParticipant,
    refetchCampaignStats,
    toggleWalletModal,
  ])

  return {
    onJoin,
    isJoinedByWeek,
    isNotEligible,
    participant,
    campaignStats,
  }
}
