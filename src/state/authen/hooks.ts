import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import {
  updateAllProfile,
  updateConnectingWallet,
  updateProcessingLogin,
  updateProfile,
  updateSignedAccount,
} from 'state/authen/actions'
import { AuthenState, UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'
import {
  ProfileLocalStorageKeys,
  getConnectedProfile,
  getProfileLocalStorage,
  setConnectedProfile,
  setProfileLocalStorage,
} from 'utils/profile'

export function useIsConnectingWallet(): [boolean, (data: boolean) => void] {
  const dispatch = useAppDispatch()
  const connectingWallet = useSelector((state: AppState) => state.authen.isConnectingWallet)

  const setConnectedWallet = useCallback(
    (data: boolean) => {
      dispatch(updateConnectingWallet(data))
    },
    [dispatch],
  )

  return [connectingWallet, setConnectedWallet]
}

// account signed in
type Param = { account: string | undefined; method: LoginMethod }
export function useSignedAccount(): [string | undefined, (data: Param) => void] {
  const dispatch = useAppDispatch()
  const wallet = useSelector((state: AppState) => state.authen.signedAccount)

  const setAccount = useCallback(
    ({ account, method }: Param) => {
      dispatch(updateSignedAccount(account))
      setConnectedProfile(account, method)
    },
    [dispatch],
  )

  const { connectedAccount } = getConnectedProfile()
  return [connectedAccount || wallet, setAccount]
}

export type ConnectedProfile = {
  active: boolean
  address: string
  profile: UserProfile | undefined
  guest: boolean
  id: string
  default?: boolean
}
export const useAllProfileInfo = () => {
  const { signedAccount } = useSignedAccountInfo()
  const { getCacheProfile, saveCacheProfile, removeAllProfile: removeAllProfileLocal } = useCacheProfile()

  const getAllProfileFromLocal = useCallback(() => {
    const profileInfo = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE)
    const getAccountGuest = (account: string) => ({
      address: account === KEY_GUEST_DEFAULT ? t`Guest` : t`Imported Guest`,
      active: account === signedAccount?.toLowerCase(),
      id: account,
      profile: getCacheProfile(account, true),
      guest: true,
      default: account === KEY_GUEST_DEFAULT,
    })
    const getAccountSignIn = (account: string) => ({
      active: account === signedAccount?.toLowerCase(),
      address: account,
      id: account,
      profile: getCacheProfile(account, false),
      guest: false,
    })

    const profiles = Object.keys(profileInfo?.wallet ?? {})
      .map(getAccountSignIn)
      .concat(Object.keys(profileInfo?.guest ?? {}).map(getAccountGuest))

    KyberOauth2.getConnectedAccounts().forEach(acc => {
      if (profiles.some(account => account.id === acc)) return
      profiles.push(getAccountSignIn(acc))
    })
    KyberOauth2.getConnectedAnonymousAccounts().forEach(acc => {
      if (profiles.some(account => account.id === acc)) return
      profiles.push(getAccountGuest(acc))
    })

    return profiles.sort(a => (a.active ? -1 : 1))
  }, [getCacheProfile, signedAccount])

  const [profiles, setAllProfile] = useState(getAllProfileFromLocal())
  const profilesState = useSelector((state: AppState) => state.authen.profiles)

  const refresh = useCallback(() => {
    setAllProfile(getAllProfileFromLocal())
  }, [getAllProfileFromLocal])

  const removeProfile = useCallback(
    (account: string | undefined, isAnonymous = false) => {
      if (!account) return
      saveCacheProfile({ isAnonymous, profile: undefined, id: account })
      refresh()
    },
    [refresh, saveCacheProfile],
  )

  const removeAllProfile = useCallback(() => {
    removeAllProfileLocal(signedAccount || KEY_GUEST_DEFAULT)
    setAllProfile(getAllProfileFromLocal().filter(el => el.id !== signedAccount))
  }, [removeAllProfileLocal, getAllProfileFromLocal, signedAccount])

  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(updateAllProfile(profiles))
  }, [profiles, dispatch])
  const totalGuest = profilesState.reduce((total, cur) => total + (cur.guest ? 1 : 0), 0)
  return { profiles: profilesState, totalGuest, refresh, removeProfile, removeAllProfile }
}

// info relate account currently signed in
export const useSignedAccountInfo = () => {
  const [signedAccount] = useSignedAccount()
  const { account } = useActiveWeb3React()

  const profilesState = useSelector((state: AppState) => state.authen.profiles)
  const totalGuest = profilesState.reduce((total, cur) => total + (cur.guest ? 1 : 0), 0) // todo

  const { connectedMethod } = getConnectedProfile()

  const isSigInGuest = connectedMethod === LoginMethod.ANONYMOUS
  const isSignInEmail = connectedMethod === LoginMethod.GOOGLE

  const isSignInEth = connectedMethod === LoginMethod.ETH
  const isSignInDifferentWallet =
    (isSignInEth && account?.toLowerCase() !== signedAccount?.toLowerCase()) || isSigInGuest || isSignInEmail

  const isSignInGuestDefault = isSigInGuest && signedAccount === KEY_GUEST_DEFAULT

  return {
    loginMethod: connectedMethod,
    isSignInDifferentWallet,
    isSigInGuest,
    isSignInGuestDefault,
    isSignInEmail,
    isSignInEth,
    signedAccount,
    canSignOut: !isSigInGuest || (isSigInGuest && totalGuest > 1),
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
      account,
    }: {
      profile: UserProfile | undefined
      isAnonymous?: boolean
      account: string | undefined
    }) => {
      dispatch(updateProfile({ profile, isAnonymous }))
      saveCacheProfile({
        isAnonymous,
        profile,
        id: isAnonymous ? account || KEY_GUEST_DEFAULT : account ?? '',
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

  const removeAllProfile = useCallback((activeAccount: string) => {
    const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
    profileMap.wallet = {}
    profileMap.guest = { [activeAccount]: profileMap.guest[activeAccount] }
    setProfileLocalStorage(ProfileLocalStorageKeys.PROFILE, profileMap)
  }, [])

  const getCacheProfile = useCallback((key: string, isAnonymous: boolean): UserProfile | undefined => {
    const profileMap = getProfileLocalStorage(ProfileLocalStorageKeys.PROFILE) || {}
    const id = key.toLowerCase()
    return isAnonymous ? profileMap?.guest?.[id] : profileMap?.wallet?.[id]
  }, [])

  const { userInfo } = useSessionInfo()
  const { isSigInGuest, signedAccount } = useSignedAccountInfo()
  const profile = userInfo || getCacheProfile(signedAccount ? signedAccount : KEY_GUEST_DEFAULT, isSigInGuest)

  return { saveCacheProfile, getCacheProfile, removeAllProfile, profile }
}

export const useRefreshProfile = () => {
  const setProfile = useSaveUserProfile()
  const [getProfile] = useGetOrCreateProfileMutation()
  const { signedAccount } = useSignedAccountInfo()
  const { isLogin } = useSessionInfo()
  return useCallback(async () => {
    const profile = await getProfile().unwrap()
    setProfile({ profile, isAnonymous: !isLogin, account: signedAccount })
  }, [getProfile, setProfile, signedAccount, isLogin])
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
