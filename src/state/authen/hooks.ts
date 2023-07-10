import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setConfirmProfile, updateConnectingWallet, updateProcessingLogin, updateProfile } from 'state/authen/actions'
import { AuthenState, ConfirmProfile, UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'
import { setProfileMap } from 'state/profile/actions'
import { CacheProfile, ProfileMap } from 'state/profile/reducer'

// connecting metamask ...
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

export type ConnectedProfile = {
  active: boolean
  address: string
  profile: UserProfile | undefined
  guest: boolean
  id: string
  default?: boolean
}

// todo move hook
export const useProfileInfo = (): {
  profiles: ConnectedProfile[]
  profile: UserProfile | undefined
  totalGuest: number
  removeProfile: (id: string | undefined, isAnonymous?: boolean) => void
  removeAllProfile: () => void
  getCacheProfile: (key: string, isAnonymous: boolean) => UserProfile | undefined
  saveCacheProfile: (data: { isAnonymous: boolean; profile: UserProfile | undefined; id: string }) => void
} => {
  const profileInfo = useSelector((state: AppState) => state.profile.profileMap)
  const dispatch = useAppDispatch()
  const { userInfo } = useSessionInfo()
  const { isSigInGuest, signedAccount } = useSignedAccountInfo()
  const profileMap = useSelector((state: AppState) => state.profile.profileMap)
  const setProfile = useCallback(
    (v: CacheProfile) => {
      dispatch(setProfileMap(v))
    },
    [dispatch],
  )

  const saveCacheProfile = useCallback(
    ({ isAnonymous, id, profile }: { isAnonymous: boolean; profile: UserProfile | undefined; id: string }) => {
      const key = id.toLowerCase()
      const newData = { ...profileMap }
      const guest: ProfileMap = { ...newData.guest }
      const wallet: ProfileMap = { ...newData.wallet }
      if (isAnonymous) {
        if (profile) guest[key] = profile
        else delete guest[key]
      } else {
        if (profile) wallet[key] = profile
        else delete wallet[key]
      }
      setProfile({ guest, wallet })
    },
    [profileMap, setProfile],
  )

  const removeAllProfile = useCallback(() => {
    const activeAccount = signedAccount || KEY_GUEST_DEFAULT
    setProfile({ wallet: {}, guest: { [activeAccount]: profileMap.guest[activeAccount] } })
  }, [setProfile, profileMap, signedAccount])

  const getCacheProfile = useCallback(
    (key: string, isAnonymous: boolean): UserProfile | undefined => {
      const id = key.toLowerCase()
      return isAnonymous ? profileMap?.guest?.[id] : profileMap?.wallet?.[id]
    },
    [profileMap],
  )

  const profile = userInfo || getCacheProfile(signedAccount ? signedAccount : KEY_GUEST_DEFAULT, isSigInGuest)

  const profiles = useMemo(() => {
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

    const results = Object.keys(profileInfo?.wallet ?? {})
      .map(getAccountSignIn)
      .concat(Object.keys(profileInfo?.guest ?? {}).map(getAccountGuest))

    KyberOauth2.getConnectedAccounts().forEach(acc => {
      if (results.some(account => account.id === acc)) return
      results.push(getAccountSignIn(acc))
    })
    KyberOauth2.getConnectedAnonymousAccounts().forEach(acc => {
      if (results.some(account => account.id === acc)) return
      results.push(getAccountGuest(acc))
    })

    return results.sort(a => (a.active ? -1 : 1))
  }, [getCacheProfile, signedAccount, profileInfo])

  const removeProfile = useCallback(
    (account: string | undefined, isAnonymous = false) => {
      if (!account) return
      saveCacheProfile({ isAnonymous, profile: undefined, id: account })
    },
    [saveCacheProfile],
  )

  const totalGuest = profiles.reduce((total, cur) => total + (cur.guest ? 1 : 0), 0)
  return { profiles, totalGuest, profile, removeProfile, removeAllProfile, getCacheProfile, saveCacheProfile }
}

// info relate account currently signed in
export const useSignedAccountInfo = () => {
  const signedAccount = useSelector((state: AppState) => state.profile.signedAccount)
  const signedMethod = useSelector((state: AppState) => state.profile.signedMethod)

  const { account } = useActiveWeb3React()

  const isSigInGuest = signedMethod === LoginMethod.ANONYMOUS
  const isSignInEmail = signedMethod === LoginMethod.GOOGLE

  const isSignInEth = signedMethod === LoginMethod.ETH
  const isSignInDifferentWallet =
    (isSignInEth && account?.toLowerCase() !== signedAccount?.toLowerCase()) || isSigInGuest || isSignInEmail

  const isSignInGuestDefault = isSigInGuest && signedAccount === KEY_GUEST_DEFAULT

  return {
    signedMethod,
    signedAccount,
    isSignInDifferentWallet,
    isSigInGuest,
    isSignInGuestDefault,
    isSignInEmail,
    isSignInEth,
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
  const { saveCacheProfile } = useProfileInfo()
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
    },
    [dispatch, saveCacheProfile],
  )
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

export const useSetConfirmProfile = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (value: ConfirmProfile) => {
      dispatch(setConfirmProfile(value))
    },
    [dispatch],
  )
}
