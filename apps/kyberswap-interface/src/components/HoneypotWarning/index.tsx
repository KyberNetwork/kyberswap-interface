import { Trans } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { useGetHoneypotInfoQuery } from 'services/tokenCatalog'

import { ErrorWarning } from 'components/ErrorWarning'

type UseHoneypotWarningProps = {
  chainId?: number
  tokenAddress?: string
  tokenSymbol?: string
}

export const useHoneypotWarning = ({ chainId, tokenAddress, tokenSymbol }: UseHoneypotWarningProps) => {
  const { currentData } = useGetHoneypotInfoQuery(
    { chainId: chainId ?? 0, address: tokenAddress?.toLowerCase() ?? '' },
    { skip: !chainId || !tokenAddress },
  )
  const honeypot = currentData?.data ?? null

  const message = useMemo(() => {
    if (honeypot?.isHoneypot) {
      return (
        <Trans>
          Our simulation detects that {tokenSymbol} token can not be sold immediately or has an extremely high sell fee
          after being bought, please check further before buying!
        </Trans>
      )
    }

    if (honeypot?.isFOT) {
      return (
        <Trans>
          Our simulation detects that {tokenSymbol} has {honeypot.tax * 100}% fee on transfer, please check further
          before buying.
        </Trans>
      )
    }

    return null
  }, [honeypot?.isFOT, honeypot?.isHoneypot, honeypot?.tax, tokenSymbol])

  return { honeypot, message }
}

export const HoneypotWarning = ({ message }: { message: ReactNode }) =>
  message ? <ErrorWarning type="warn" title={message} /> : null
