import axios from 'axios'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWRImmutable from 'swr/immutable'

import { SWR_KEYS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import {
  setSelectedCampaignLeaderboardLookupAddress,
  setSelectedCampaignLeaderboardPageNumber,
  setSelectedCampaignLuckyWinnersLookupAddress,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'

export function useSelectedCampaignLeaderboardPageNumberManager() {
  const selectedCampaignLeaderboardPageNumber = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLeaderboardPageNumber,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLeaderboardPageNumberCallback = useCallback(
    (newPageNumber: number) => {
      dispatch(setSelectedCampaignLeaderboardPageNumber(newPageNumber))
    },
    [dispatch],
  )

  return useMemo(
    () => [selectedCampaignLeaderboardPageNumber, updateSelectedCampaignLeaderboardPageNumberCallback] as const,
    [selectedCampaignLeaderboardPageNumber, updateSelectedCampaignLeaderboardPageNumberCallback],
  )
}

export function useSelectedCampaignLeaderboardLookupAddressManager() {
  const selectedCampaignLeaderboardLookupAddress = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLeaderboardLookupAddress,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLeaderboardLookupAddressCallback = useCallback(
    (newLookupAddress: string) => {
      dispatch(setSelectedCampaignLeaderboardLookupAddress(newLookupAddress))
    },
    [dispatch],
  )

  return useMemo(
    () => [selectedCampaignLeaderboardLookupAddress, updateSelectedCampaignLeaderboardLookupAddressCallback] as const,
    [selectedCampaignLeaderboardLookupAddress, updateSelectedCampaignLeaderboardLookupAddressCallback],
  )
}

export function useSelectedCampaignLuckyWinnersLookupAddressManager() {
  const selectedCampaignLuckyWinnersLookupAddress = useSelector(
    (state: AppState) => state.campaigns.selectedCampaignLuckyWinnersLookupAddress,
  )
  const dispatch = useDispatch()

  const updateSelectedCampaignLuckyWinnersLookupAddressCallback = useCallback(
    (newLookupAddress: string) => {
      dispatch(setSelectedCampaignLuckyWinnersLookupAddress(newLookupAddress))
    },
    [dispatch],
  )

  return useMemo(
    () => [selectedCampaignLuckyWinnersLookupAddress, updateSelectedCampaignLuckyWinnersLookupAddressCallback] as const,
    [selectedCampaignLuckyWinnersLookupAddress, updateSelectedCampaignLuckyWinnersLookupAddressCallback],
  )
}

export function useIsConnectedAccountEligibleForSelectedCampaign(): {
  data: boolean
  loading: boolean
  error: Error | undefined
} {
  const { account } = useActiveWeb3React()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const {
    data: eligibleUser,
    isValidating,
    error,
  } = useSWRImmutable(
    selectedCampaign && account ? SWR_KEYS.getEligibleUser(selectedCampaign.id, account) : null,
    async () => {
      if (!selectedCampaign || !account) return undefined

      const resp = await axios({
        method: 'GET',
        url: SWR_KEYS.getEligibleUser(selectedCampaign.id, account),
      })

      if (resp.status === 200) {
        // todo nhdz
        console.log(`useIsConnectedWalletEligibleForSelectedCampaign`, resp.data)
      }

      return resp.data
    },
  )

  return useMemo(() => {
    return {
      data: Boolean(selectedCampaign && account && eligibleUser),
      loading: isValidating,
      error,
    }
  }, [account, eligibleUser, error, isValidating, selectedCampaign])
}
