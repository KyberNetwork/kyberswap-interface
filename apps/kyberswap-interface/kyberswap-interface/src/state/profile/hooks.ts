import KyberOauth2, { LoginMethod } from '@kyberswap/oauth2'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useSessionInfo } from 'state/authen/hooks'
import { UserProfile, authenActions } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'
import { CacheProfile, ProfileMap, SignedAccountParams, profileActions } from 'state/profile/reducer'
import getShortenAddress from 'utils/getShortenAddress'
import { isEmailValid } from 'utils/string'

const { setImportToken, setKeepCurrentProfile, setProfileMap, updateSignedAccount } = profileActions

export function useIsKeepCurrentProfile(): [boolean, () => void] {
  const dispatch = useAppDispatch()
  const isKeepCurrentProfile = useSelector((state: AppState) => state.profile.isKeepCurrentProfile)

  const toggle = useCallback(() => {
    dispatch(setKeepCurrentProfile(!isKeepCurrentProfile))
  }, [dispatch, isKeepCurrentProfile])

  return [isKeepCurrentProfile, toggle]
}

export function useImportToken() {
  const dispatch = useAppDispatch()
  const importToken = useSelector((state: AppState) => state.profile.importToken)

  const getImportToken = useCallback(
    (account: string) => {
      return importToken?.[account]
    },
    [importToken],
  )

  const saveImportToken = useCallback(
    (account: string, token: string) => {
      dispatch(setImportToken({ ...importToken, [account]: token }))
    },
    [importToken, dispatch],
  )

  const removeImportToken = useCallback(
    (account: string) => {
      const clone = { ...importToken }
      delete clone[account]
      dispatch(setImportToken(clone))
    },
    [importToken, dispatch],
  )

  return { getImportToken, saveImportToken, removeImportToken }
}

export function useSaveConnectedProfile() {
  const dispatch = useAppDispatch()
  const saveSignedAccount = useCallback(
    ({ account, method }: SignedAccountParams) => {
      dispatch(updateSignedAccount({ account, method }))
    },
    [dispatch],
  )
  return saveSignedAccount
}

export type ConnectedProfile = {
  active: boolean
  name: string
  id: string
  profile: UserProfile | undefined
  type: LoginMethod
  default?: boolean
}

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
    const getAccountGuest = (account: string): ConnectedProfile => ({
      name: account === KEY_GUEST_DEFAULT ? t`Guest` : t`Imported Guest`,
      active: account === signedAccount?.toLowerCase(),
      id: account,
      profile: getCacheProfile(account, true),
      type: LoginMethod.ANONYMOUS,
      default: account === KEY_GUEST_DEFAULT,
    })
    const getAccountSignIn = (account: string): ConnectedProfile => ({
      active: account === signedAccount?.toLowerCase(),
      name: account,
      id: account,
      profile: getCacheProfile(account, false),
      type: isEmailValid(account) ? LoginMethod.EMAIL : LoginMethod.ETH,
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

  const totalGuest = profiles.reduce((total, cur) => total + (cur.type === LoginMethod.ANONYMOUS ? 1 : 0), 0)
  return { profiles, totalGuest, profile, removeProfile, removeAllProfile, getCacheProfile, saveCacheProfile }
}

// info relate account currently signed in
export const useSignedAccountInfo = () => {
  const signedAccount = useSelector((state: AppState) => state.profile.signedAccount)
  const signedMethod = useSelector((state: AppState) => state.profile.signedMethod) as LoginMethod

  const { account } = useActiveWeb3React()

  const isSigInGuest = signedMethod === LoginMethod.ANONYMOUS
  const isSignInEmail = signedMethod === LoginMethod.EMAIL || signedMethod === LoginMethod.GOOGLE

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
    isSignInEth,
    isSignInEmail,
  }
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
      dispatch(authenActions.updateProfile({ profile, isAnonymous }))
      saveCacheProfile({
        isAnonymous,
        profile,
        id: isAnonymous ? account || KEY_GUEST_DEFAULT : account ?? '',
      })
    },
    [dispatch, saveCacheProfile],
  )
}

export const useGetProfileDisplayName = () => {
  const { getCacheProfile } = useProfileInfo()
  return useCallback(
    (desireAccount: string | undefined, guest: boolean) => {
      return getCacheProfile(desireAccount ?? '', guest)?.nickname || getShortenAddress(desireAccount ?? '')
    },
    [getCacheProfile],
  )
}
