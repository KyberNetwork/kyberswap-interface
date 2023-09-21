import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGetCampaignsQuery, useGetLeaderboardQuery, useGetLuckyWinnersQuery } from 'services/campaign'

import { APP_PATHS, CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE, EMPTY_ARRAY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import {
  CampaignLeaderboard,
  CampaignState,
  setCampaignDataByPage,
  setLastTimeRefreshData,
  setLoadingCampaignData,
  setLoadingCampaignDataError,
  setLoadingSelectedCampaignLeaderboard,
  setLoadingSelectedCampaignLuckyWinners,
  setSelectedCampaign,
  setSelectedCampaignLeaderboard,
  setSelectedCampaignLuckyWinners,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'
import { getCampaignIdFromSlug, getSlugUrlCampaign } from 'utils/campaign'

import CampaignContent from './CampaignContent'

const MAXIMUM_ITEMS_PER_REQUEST = 10

const LEADERBOARD_DEFAULT: CampaignLeaderboard = {
  finalizedAt: 0,
  distributedRewardsAt: 0,
  userRank: 0,
  totalParticipants: 0,
  rankings: [],
  rewards: [],
}

const getQueryDefault = (userAddress: string | undefined) => ({
  campaignName: '',
  userAddress,
  offset: 0,
  limit: MAXIMUM_ITEMS_PER_REQUEST,
})

export default function CampaignsUpdater() {
  const dispatch = useDispatch()
  const { account } = useActiveWeb3React()
  const { pathname } = useLocation()

  /**********************CAMPAIGN DATA**********************/
  const [queryParams, setQueryParams] = useState(getQueryDefault(account))
  const [hasMoreCampaign, setHasMoreCampaign] = useState(false)

  const onSearchCampaign = useCallback((campaignName: string) => {
    return setQueryParams(pre => ({ ...pre, campaignName, offset: 0 }))
  }, [])

  const { data: currentCampaigns } = useSelector((state: AppState) => state.campaigns)

  const loadMoreCampaign = useCallback(() => {
    if (!currentCampaigns.length) return
    return setQueryParams(pre => ({ ...pre, offset: pre.offset + MAXIMUM_ITEMS_PER_REQUEST }))
  }, [currentCampaigns.length])

  useEffect(() => {
    setQueryParams(getQueryDefault(account))
  }, [account, setQueryParams])

  const {
    data: campaignData = EMPTY_ARRAY,
    isFetching: isLoadingCampaignData,
    error: loadingCampaignDataError,
    refetch,
  } = useGetCampaignsQuery(queryParams)

  useEffect(() => {
    setHasMoreCampaign(campaignData.length === MAXIMUM_ITEMS_PER_REQUEST)
  }, [campaignData])

  const refreshListCampaign = useCallback(async () => {
    try {
      await refetch().unwrap()
      dispatch(setLastTimeRefreshData())
    } catch (error) {}
  }, [refetch, dispatch])

  const slug = pathname.replace(APP_PATHS.CAMPAIGN, '')
  const { selectedCampaignId = getCampaignIdFromSlug(slug) } = useParsedQueryString<{ selectedCampaignId: string }>()

  const navigate = useNavigate()

  useEffect(() => {
    dispatch(setCampaignDataByPage({ campaigns: campaignData || [], isReset: queryParams.offset === 0 }))
  }, [campaignData, dispatch, queryParams.offset])

  useEffect(() => {
    if (!currentCampaigns?.length) return
    const navigateFirsOne = () => {
      navigate(getSlugUrlCampaign(currentCampaigns[0].id, currentCampaigns[0].name), {
        replace: true,
      })
    }
    if (selectedCampaignId === undefined) {
      navigateFirsOne()
      return
    }
    const selectedCampaign = currentCampaigns.find(campaign => campaign.id.toString() === selectedCampaignId)
    if (selectedCampaign) {
      dispatch(setSelectedCampaign({ campaign: selectedCampaign }))
    } else {
      navigateFirsOne()
    }
  }, [currentCampaigns, dispatch, selectedCampaignId, navigate])

  useEffect(() => {
    if (isLoadingCampaignData === false) dispatch(setLoadingCampaignData(isLoadingCampaignData))
  }, [dispatch, isLoadingCampaignData])

  useEffect(() => {
    dispatch(setLoadingCampaignDataError(!!loadingCampaignDataError))
  }, [dispatch, loadingCampaignDataError])

  /**********************CAMPAIGN LEADERBOARD**********************/

  const { selectedCampaignLeaderboardPageNumber, selectedCampaignLeaderboardLookupAddress, selectedCampaign } =
    useSelector((state: AppState) => state.campaigns)

  const {
    data,
    isFetching: isLoadingLeaderboard,
    isError,
  } = useGetLeaderboardQuery(
    {
      campaignId: selectedCampaign?.id || 0,
      pageNumber: selectedCampaignLeaderboardPageNumber,
      userAddress: account ?? '',
      lookupAddress: selectedCampaignLeaderboardLookupAddress,
      pageSize: CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE,
    },
    { skip: !selectedCampaign?.id },
  )
  const leaderboard = (!isError ? data : LEADERBOARD_DEFAULT) || LEADERBOARD_DEFAULT

  useEffect(() => {
    if (leaderboard) {
      dispatch(setSelectedCampaignLeaderboard({ leaderboard }))
    }
  }, [dispatch, leaderboard])

  useEffect(() => {
    dispatch(setLoadingSelectedCampaignLeaderboard(isLoadingLeaderboard))
  }, [dispatch, isLoadingLeaderboard])

  /**********************CAMPAIGN LUCKY WINNERS**********************/

  const { selectedCampaignLuckyWinnersPageNumber, selectedCampaignLuckyWinnersLookupAddress } = useSelector(
    (state: AppState) => state.campaigns,
  )

  const {
    data: dataLuckWinners,
    isError: isErrorLuckyWinner,
    isFetching: isLoadingLuckyWinners,
  } = useGetLuckyWinnersQuery(
    {
      pageSize: CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE,
      pageNumber: selectedCampaignLuckyWinnersPageNumber,
      lookupAddress: selectedCampaignLuckyWinnersLookupAddress,
      campaignId: selectedCampaign?.id || 0,
    },
    { skip: !selectedCampaign?.id },
  )

  const luckyWinners =
    (isErrorLuckyWinner || selectedCampaign?.campaignState === CampaignState.CampaignStateReady
      ? EMPTY_ARRAY
      : dataLuckWinners) || EMPTY_ARRAY

  useEffect(() => {
    if (luckyWinners !== undefined) {
      dispatch(setSelectedCampaignLuckyWinners({ luckyWinners: luckyWinners }))
    }
  }, [dispatch, luckyWinners])

  useEffect(() => {
    dispatch(setLoadingSelectedCampaignLuckyWinners(isLoadingLuckyWinners))
  }, [dispatch, isLoadingLuckyWinners])

  return (
    <CampaignContent
      refreshListCampaign={refreshListCampaign}
      loadMoreCampaign={loadMoreCampaign}
      hasMoreCampaign={hasMoreCampaign}
      onSearchCampaign={onSearchCampaign}
    />
  )
}
