import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { useGetRestrictedTokensQuery } from 'services/restrictedTokens'

import { NotificationType } from 'components/Announcement/type'
import { useNotify } from 'state/application/hooks'
import { getUserCountryCode } from 'utils/getUserCountryCode'
import { getTokenAddress } from 'utils/tokenInfo'

/** Build the lookup key used to match a token against the restricted set. */
export const restrictedTokenKey = (chainId: number | string, address: string): string =>
  `${Number(chainId)}-${address.toLowerCase()}`

/** User-facing message shown when a token is geo-restricted. */
export const restrictedTokenMessage = (symbol?: string): string => {
  const name = symbol || t`This token`
  return t`${name} is not available in your jurisdiction`
}

/**
 * The set of restricted token keys for the user's resolved country.
 * Empty when the country can't be resolved (fail-open) — this is a UX deterrent,
 * not a compliance boundary.
 */
export const useRestrictedTokenSet = (): Set<string> => {
  const countryCode = useMemo(() => getUserCountryCode(), [])
  const { data } = useGetRestrictedTokensQuery({ countryCode: countryCode ?? '' }, { skip: !countryCode })

  return useMemo(() => {
    const set = new Set<string>()
    data?.forEach(token => set.add(restrictedTokenKey(token.chainId, token.address)))
    return set
  }, [data])
}

/** Predicate over a raw (chainId, address) pair — for non-Currency callers (e.g. the token-selector package). */
export const useIsTokenAddressRestricted = (): ((chainId?: number | string, address?: string) => boolean) => {
  const set = useRestrictedTokenSet()
  return useCallback(
    (chainId?: number | string, address?: string) =>
      chainId != null && !!address && set.has(restrictedTokenKey(chainId, address)),
    [set],
  )
}

/** Predicate over a Currency (handles native via getTokenAddress). */
export const useIsTokenRestricted = (): ((currency?: Currency | null) => boolean) => {
  const isAddressRestricted = useIsTokenAddressRestricted()
  return useCallback(
    (currency?: Currency | null) => !!currency && isAddressRestricted(currency.chainId, getTokenAddress(currency)),
    [isAddressRestricted],
  )
}

/** Fire the standard "not available in your jurisdiction" warning toast. */
export const useNotifyRestrictedToken = (): ((token?: { symbol?: string } | null) => void) => {
  const notify = useNotify()
  return useCallback(
    (token?: { symbol?: string } | null) =>
      notify({
        title: t`Token not available`,
        type: NotificationType.WARNING,
        summary: restrictedTokenMessage(token?.symbol),
      }),
    [notify],
  )
}
