import KyberOauth2 from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import {
  updateAllProfile,
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

// info relate wallet currently singed in
export const useSignedWalletInfo = () => {
  const [signedWallet] = useSignedWallet()
  const { account } = useActiveWeb3React()
  const isSignedWallet = useCallback(
    (address: string) => signedWallet && signedWallet?.toLowerCase() === address?.toLowerCase(),
    [signedWallet],
  )
  const isGuest = !signedWallet
  return {
    signedWallet,
    signedDifferentWallet: account?.toLowerCase() !== signedWallet?.toLowerCase(),
    canSignInEth: !signedWallet || account?.toLowerCase() !== signedWallet?.toLowerCase(),
    isGuest,
    isSignedWallet,
  }
}

// info relate profile, session
export function useSessionInfo(): AuthenState & { userInfo: UserProfile | undefined } {
  const authen = useSelector((state: AppState) => state.authen)
  const userInfo = useMemo(
    () => (authen.isLogin ? authen.signedUserInfo : authen.anonymousUserInfo),
    [authen.signedUserInfo, authen.anonymousUserInfo, authen.isLogin],
  )
  return { ...authen, userInfo }
}

export const KEY_GUEST_DEFAULT = 'default'
export const useSaveUserProfile = () => {
  const dispatch = useAppDispatch()
  const { saveCacheProfile } = useCacheProfile()
  const { refresh: refreshListProfile } = useAllProfileInfo()
  return useCallback(
    ({
      profile,
      isAnonymous = false,
      walletAddress,
    }: {
      profile: UserProfile | undefined
      isAnonymous?: boolean
      walletAddress: string | undefined
    }) => {
      dispatch(updateProfile({ profile, isAnonymous }))
      saveCacheProfile({ isAnonymous, profile, id: (isAnonymous ? '' : walletAddress) || KEY_GUEST_DEFAULT })
      refreshListProfile()
    },
    [dispatch, saveCacheProfile, refreshListProfile],
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
      if (isAnonymous) {
        if (!newData.guest) newData.guest = {}
        if (profile) newData.guest[key] = profile
        else delete newData.guest[key]
      } else {
        if (!newData.wallet) newData.wallet = {}
        if (profile) newData.wallet[key] = profile
        else delete newData.wallet[key]
      }
      setProfileLocalStorage(ProfileLocalStorageKeys.PROFILE, newData)
    },
    [],
  )

  const removeAllSignedAccount = useCallback(() => {
    const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
    profileMap.wallet = {}
    setProfileLocalStorage(ProfileLocalStorageKeys.PROFILE, profileMap)
  }, [])

  const getCacheProfile = useCallback((key: string, isAnonymous: boolean): UserProfile | undefined => {
    const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
    const id = key.toLowerCase()
    return isAnonymous ? profileMap?.guest?.[id] : profileMap?.wallet?.[id]
  }, [])

  return { saveCacheProfile, getCacheProfile, removeAllSignedAccount }
}

export const useRefreshProfile = () => {
  const setProfile = useSaveUserProfile()
  const [getProfile] = useGetOrCreateProfileMutation()
  const { signedWallet } = useSignedWalletInfo()
  return useCallback(
    async (isAnonymous: boolean) => {
      const profile = await getProfile().unwrap()
      setProfile({ profile, isAnonymous, walletAddress: signedWallet })
    },
    [getProfile, setProfile, signedWallet],
  )
}

export type ConnectedProfile = { active: boolean; address: string; profile: UserProfile | undefined; guest: boolean }
export const useAllProfileInfo = () => {
  const { signedWallet, isGuest } = useSignedWalletInfo()
  const { getCacheProfile } = useCacheProfile()
  const { saveCacheProfile, removeAllSignedAccount } = useCacheProfile()
  const [connectedAccounts, setConnectAccounts] = useState(
    Object.keys(getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE)?.wallet ?? {}),
  )
  const profilesState = useSelector((state: AppState) => state.authen.profiles)

  const refresh = useCallback(() => {
    const listAddress = Object.keys(getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE)?.wallet ?? {})
    setConnectAccounts([...new Set(listAddress.concat(KyberOauth2.getConnectedEthAccounts()))])
  }, [])

  const removeProfile = useCallback(
    (wallet: string) => {
      if (!wallet) return
      saveCacheProfile({ isAnonymous: false, profile: undefined, id: wallet })
      refresh()
    },
    [refresh, saveCacheProfile],
  )

  const removeAllProfile = useCallback(() => {
    removeAllSignedAccount()
    setConnectAccounts([])
  }, [removeAllSignedAccount])

  const profiles: ConnectedProfile[] = useMemo(() => {
    return connectedAccounts
      .map(address => ({
        active: address === signedWallet?.toLowerCase(),
        address,
        profile: getCacheProfile(address, false),
        guest: false,
      }))
      .concat({
        address: t`Guest`,
        active: isGuest,
        profile: getCacheProfile(KEY_GUEST_DEFAULT, true),
        guest: true,
      })
      .sort(a => (a.active ? -1 : 1))
  }, [signedWallet, getCacheProfile, connectedAccounts, isGuest])

  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(updateAllProfile(profiles))
  }, [profiles, dispatch])

  return { profiles: profilesState, refresh, removeProfile, removeAllProfile }
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
