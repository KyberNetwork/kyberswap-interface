import KyberOauth2 from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import {
  updatePossibleWalletAddress,
  updateProcessingLogin,
  updateProfile,
  updateSignedWallet,
} from 'state/authen/actions'
import { AuthenState, UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'

export const ProfileLocalStorageKeys = {
  PROFILE: 'profile',
  /** sub */
  CONNECTED_WALLET: 'wallet',
  CONNECTING_WALLET: 'connecting_wallet',
  PROFILE_INFO: 'profileInfo',
}

export const getProfileLocalStorage = (key: string) => {
  const bridgeInfo: { [key: string]: any } = JSON.parse(
    localStorage.getItem(ProfileLocalStorageKeys.PROFILE_INFO) || '{}',
  )
  return bridgeInfo?.[key]
}

export const setProfileLocalStorage = (key: string, value: any) => {
  const bridgeInfo: { [key: string]: any } = JSON.parse(
    localStorage.getItem(ProfileLocalStorageKeys.PROFILE_INFO) || '{}',
  )
  localStorage.setItem(ProfileLocalStorageKeys.PROFILE_INFO, JSON.stringify({ ...bridgeInfo, [key]: value }))
}

// wallet connected: same as account of useActiveWeb3React but quickly return value
export function useConnectedWallet(): [string | null | undefined, (data: string | null | undefined) => void] {
  const dispatch = useAppDispatch()
  const wallet = useSelector((state: AppState) => state.authen.possibleConnectedWalletAddress)

  const setConnectedWallet = useCallback(
    (data: string | null | undefined) => {
      dispatch(updatePossibleWalletAddress(data))
    },
    [dispatch],
  )

  return [wallet, setConnectedWallet]
}

// wallet signed in
export function useSignedWallet(): [string | undefined, (data: string | undefined) => void] {
  const dispatch = useAppDispatch()
  const wallet = useSelector((state: AppState) => state.authen.signedWalletAddress)

  const setWallet = useCallback(
    (data: string | undefined) => {
      dispatch(updateSignedWallet(data))
      setProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_WALLET, data)
    },
    [dispatch],
  )

  return [getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_WALLET) || wallet, setWallet]
}

export function useSessionInfo(): AuthenState & { formatUserInfo: UserProfile | undefined } {
  const { account } = useActiveWeb3React()
  const authen = useSelector((state: AppState) => state.authen)
  const isLogin = Boolean(authen.isLogin && account)
  const formatUserInfo = useMemo(
    () => (isLogin ? authen.userInfo : authen.anonymousUserInfo),
    [authen.userInfo, authen.anonymousUserInfo, isLogin],
  ) // todo rename
  return { ...authen, isLogin, formatUserInfo }
}

const KEY_GUEST_DEFAULT = 'default'
export const useSaveUserProfile = () => {
  const dispatch = useAppDispatch()
  const { saveCacheProfile } = useCacheProfile()
  const [signedWallet] = useSignedWallet()
  return useCallback(
    ({ profile, isAnonymous = false }: { profile: UserProfile | undefined; isAnonymous?: boolean }) => {
      dispatch(updateProfile({ profile, isAnonymous }))
      saveCacheProfile({ isAnonymous, profile, id: (isAnonymous ? '' : signedWallet) || KEY_GUEST_DEFAULT })
    },
    [dispatch, saveCacheProfile, signedWallet],
  )
}

type ProfileMap = { [address: string]: UserProfile }
type CacheProfile = {
  wallet: ProfileMap
  guest: ProfileMap
}

export const useCacheProfile = () => {
  const saveCacheProfile = useCallback(
    ({ isAnonymous, id, profile }: { isAnonymous: boolean; profile: UserProfile | undefined; id: string }) => {
      const key = id.toLowerCase()
      const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
      const newData = { ...profileMap } as CacheProfile
      if (!profile) return
      if (isAnonymous) {
        if (!newData.guest) newData.guest = {}
        newData.guest[key] = profile
      } else {
        if (!newData.wallet) newData.wallet = {}
        newData.wallet[key] = profile
      }
      setProfileLocalStorage(ProfileLocalStorageKeys.PROFILE, newData)
    },
    [],
  )

  const getCacheProfile = useCallback((key: string, isAnonymous: boolean): UserProfile | undefined => {
    const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
    const id = key.toLowerCase()
    return isAnonymous ? profileMap?.guest?.[id] : profileMap?.wallet?.[id]
  }, [])

  return { saveCacheProfile, getCacheProfile }
}

export const useRefreshProfile = () => {
  const setProfile = useSaveUserProfile()
  const [getProfile] = useGetOrCreateProfileMutation()
  return useCallback(
    async (isAnonymous: boolean) => {
      const profile = await getProfile().unwrap()
      setProfile({ profile, isAnonymous })
    },
    [getProfile, setProfile],
  )
}

export type ConnectedProfile = { active: boolean; address: string; profile: UserProfile | undefined; guest: boolean }
export const useAllProfileInfo = () => {
  const [signInWallet] = useSignedWallet()
  const { getCacheProfile } = useCacheProfile()

  const profiles = useMemo(() => {
    return KyberOauth2.getConnectedEthAccounts()
      .map(address => ({
        active: address === signInWallet?.toLowerCase(),
        address,
        profile: getCacheProfile(address, false),
        guest: false,
      }))
      .concat({
        address: t`Guest`,
        active: !signInWallet,
        profile: getCacheProfile(KEY_GUEST_DEFAULT, true),
        guest: true,
      })
  }, [signInWallet, getCacheProfile])

  return profiles
}

export const useSetPendingAuthentication = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (value: boolean) => {
      dispatch(updateProcessingLogin(value))
    },
    [dispatch],
  )
}
