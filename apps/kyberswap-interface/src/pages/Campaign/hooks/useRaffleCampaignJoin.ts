import { t } from '@lingui/macro'
import { useCallback } from 'react'
import { useGetRaffleCampaignParticipantQuery, useJoinRaffleCampaignMutation } from 'services/campaignRaffle'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

type Props = {
  selectedWeek: number
}

export const useRaffleCampaignJoin = ({ selectedWeek }: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()

  const [joinRaffleCampaign] = useJoinRaffleCampaignMutation()
  const { data: raffleParticipant, refetch: refetchParticipant } = useGetRaffleCampaignParticipantQuery(
    { address: account ?? '' },
    { skip: !account },
  )
  const isNotEligible = !!account && raffleParticipant?.eligible === false
  const isJoinedByWeek =
    !!raffleParticipant?.[`joined_week${selectedWeek + 1}_at` as keyof typeof raffleParticipant] && selectedWeek >= 0

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
      const nonce = '12345678' //TODO: replace with real nonce from backend

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
      const result = await joinRaffleCampaign({ address: account, message, signature }).unwrap()

      if (!result?.success) {
        throw new Error(result?.message || t`Join campaign request failed.`)
      }

      notify({
        title: t`Joined Raffle Campaign`,
        summary: t`Your wallet has been registered. Eligible trades will now be tracked automatically.`,
        type: NotificationType.SUCCESS,
      })
      if (account) {
        await refetchParticipant()
      }
    } catch (error) {
      console.log('Error joining raffle campaign:', error)
      notify({
        title: t`Unable to join Raffle Campaign`,
        summary: error instanceof Error ? error.message : t`Something went wrong. Please try again.`,
        type: NotificationType.ERROR,
      })
    }
  }, [account, chainId, joinRaffleCampaign, library, notify, refetchParticipant, toggleWalletModal])

  return {
    onJoin,
    isJoinedByWeek,
    isNotEligible,
  }
}
