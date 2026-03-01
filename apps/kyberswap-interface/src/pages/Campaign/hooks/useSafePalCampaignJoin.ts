import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { useJoinSafePalCampaignMutation } from 'services/campaignSafepal'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

const SAFEPAL_JOINED_SESSION_KEY = 'safepal_joined'

type JoinedStore = Record<string, boolean>

const readJoinedStore = (): JoinedStore => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(SAFEPAL_JOINED_SESSION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.warn('Failed to read safepal session store', error)
    return {}
  }
}

const isJoinedInSession = (address: string) => {
  const store = readJoinedStore()
  return !!store[address.toLowerCase()]
}

const saveJoinedInSession = (address: string) => {
  if (typeof window === 'undefined') return
  const store = readJoinedStore()
  try {
    window.sessionStorage.setItem(
      SAFEPAL_JOINED_SESSION_KEY,
      JSON.stringify({
        ...store,
        [address.toLowerCase()]: true,
      }),
    )
  } catch (error) {
    console.warn('Failed to save safepal session store', error)
  }
}

export const useSafePalCampaignJoin = () => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()

  const [joinCampaign] = useJoinSafePalCampaignMutation()

  const isJoined = useMemo(() => !!account && isJoinedInSession(account), [account])

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
      await joinCampaign({
        userAddress: account,
        message,
        signature,
      }).unwrap()

      saveJoinedInSession(account)

      notify({
        title: t`Joined SafePal Campaign`,
        type: NotificationType.SUCCESS,
      })
    } catch (error) {
      console.warn('SafePal campaign join error:', error)
      notify({
        title: t`Unable to join SafePal Campaign`,
        summary: error.message || error.data?.message || t`Something went wrong. Please try again.`,
        type: NotificationType.ERROR,
      })
    }
  }, [account, chainId, joinCampaign, library, notify, toggleWalletModal])

  return {
    onJoin,
    isJoined,
  }
}
