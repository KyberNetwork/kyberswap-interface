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
  PROFILE_INFO: 'profileInfo',
  /** sub item*/
  CONNECTED_WALLET: 'wallet',
  CONNECTED_GUEST: 'guest',
  CONNECTING_WALLET: 'connecting_wallet',
  PROFILE: 'profile',
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
  const signedDifferentWallet = account?.toLowerCase() !== signedWallet?.toLowerCase()
  const signedGuest = getProfileLocalStorage(ProfileLocalStorageKeys.CONNECTED_GUEST)
  const isGuestDefault = signedGuest === KEY_GUEST_DEFAULT
  const isGuest = isGuestDefault || !!signedGuest
  return {
    signedWallet,
    signedDifferentWallet,
    canSignInEth: !signedWallet || signedDifferentWallet,
    isGuest,
    isGuestDefault,
    signedGuest,
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
// save to store and local storage as well
export const useSaveUserProfile = () => {
  const dispatch = useAppDispatch()
  const { saveCacheProfile } = useCacheProfile()
  const { refresh: refreshListProfile } = useAllProfileInfo()
  return useCallback(
    ({
      profile,
      isAnonymous = false,
      walletAddress,
      guestAccount,
    }: {
      profile: UserProfile | undefined
      isAnonymous?: boolean
      walletAddress: string | undefined
      guestAccount: string | undefined
    }) => {
      dispatch(updateProfile({ profile, isAnonymous }))
      saveCacheProfile({
        isAnonymous,
        profile,
        id: isAnonymous ? guestAccount || KEY_GUEST_DEFAULT : walletAddress ?? '',
      })
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
    profileMap.guest = { [KEY_GUEST_DEFAULT]: profileMap.guest[KEY_GUEST_DEFAULT] }
    setProfileLocalStorage(ProfileLocalStorageKeys.PROFILE, profileMap)
  }, [])

  const getCacheProfile = useCallback((key: string, isAnonymous: boolean): UserProfile | undefined => {
    const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
    const id = key.toLowerCase()
    return isAnonymous ? profileMap?.guest?.[id] : profileMap?.wallet?.[id]
  }, [])

  const { userInfo } = useSessionInfo()
  const { signedWallet, isGuest } = useSignedWalletInfo()
  const cacheProfile = userInfo || getCacheProfile(signedWallet ? signedWallet : KEY_GUEST_DEFAULT, isGuest)

  return { saveCacheProfile, getCacheProfile, removeAllSignedAccount, cacheProfile }
}

export const useRefreshProfile = () => {
  const setProfile = useSaveUserProfile()
  const [getProfile] = useGetOrCreateProfileMutation()
  const { signedWallet, signedGuest } = useSignedWalletInfo()
  return useCallback(
    async (isAnonymous: boolean) => {
      const profile = await getProfile().unwrap()
      setProfile({ profile, isAnonymous, walletAddress: signedWallet, guestAccount: signedGuest })
    },
    [getProfile, setProfile, signedWallet, signedGuest],
  )
}

export type ConnectedProfile = {
  active: boolean
  address: string
  profile: UserProfile | undefined
  guest: boolean
  key: string
  default?: boolean
}
export const useAllProfileInfo = () => {
  const { signedWallet, signedGuest } = useSignedWalletInfo()
  const { getCacheProfile, saveCacheProfile, removeAllSignedAccount } = useCacheProfile()

  const getAllProfileFromLocal = useCallback(() => {
    const profileInfo = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE)
    const getAccountGuest = (account: string) => ({
      address: account === KEY_GUEST_DEFAULT ? t`Guest` : `(Guest Imported) ${account}`,
      active: account === signedGuest?.toLowerCase(),
      key: account,
      profile: getCacheProfile(account, true),
      guest: true,
      default: account === KEY_GUEST_DEFAULT,
    })
    const getAccountSignIn = (account: string) => ({
      active: account === signedWallet?.toLowerCase(),
      address: account,
      key: account,
      profile: getCacheProfile(account, false),
      guest: false,
    })

    const profiles = Object.keys(profileInfo?.wallet ?? {})
      .map(getAccountSignIn)
      .concat(Object.keys(profileInfo?.guest ?? {}).map(getAccountGuest))

    KyberOauth2.getConnectedAccounts().forEach(acc => {
      if (profiles.some(account => account.key === acc)) return
      profiles.push(getAccountSignIn(acc))
    })
    KyberOauth2.getConnectedAnonymousAccounts().forEach(acc => {
      if (profiles.some(account => account.key === acc)) return
      profiles.push(getAccountGuest(acc))
    })
    return profiles.sort(a => (a.active ? -1 : 1))
  }, [signedWallet, getCacheProfile, signedGuest])

  const [profiles, setAllProfile] = useState(getAllProfileFromLocal())
  const profilesState = useSelector((state: AppState) => state.authen.profiles)

  const refresh = useCallback(() => {
    setAllProfile(getAllProfileFromLocal())
  }, [getAllProfileFromLocal])

  const removeProfile = useCallback(
    (account: string | undefined, isGuest = false) => {
      if (!account) return
      saveCacheProfile({ isAnonymous: isGuest, profile: undefined, id: account })
      refresh()
    },
    [refresh, saveCacheProfile],
  )

  const removeAllProfile = useCallback(() => {
    removeAllSignedAccount()
    setAllProfile([
      {
        address: t`Guest`,
        active: true,
        key: KEY_GUEST_DEFAULT,
        profile: getCacheProfile(KEY_GUEST_DEFAULT, true),
        guest: true,
      },
    ])
  }, [removeAllSignedAccount, getCacheProfile])

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
