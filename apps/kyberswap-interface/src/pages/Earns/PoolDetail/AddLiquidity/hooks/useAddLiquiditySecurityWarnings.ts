import { NATIVE_TOKEN_ADDRESS, Pool } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetHoneypotInfoQuery } from 'services/zapInService'

interface UseAddLiquiditySecurityWarningsProps {
  chainId?: number
  pool?: Pool | null
}

export default function useAddLiquiditySecurityWarnings({ chainId, pool }: UseAddLiquiditySecurityWarningsProps) {
  const tokensToCheck = useMemo(
    () =>
      pool
        ? [pool.token0, pool.token1].filter(token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase())
        : [],
    [pool],
  )
  const { data: honeypotInfoMap } = useGetHoneypotInfoQuery(
    {
      chainId: chainId || ChainId.MAINNET,
      addresses: tokensToCheck.map(token => token.address),
    },
    {
      skip: !chainId || !tokensToCheck.length,
    },
  )

  return useMemo(
    () =>
      tokensToCheck.flatMap(token => {
        const info = honeypotInfoMap?.[token.address.toLowerCase()]
        if (!info) return []

        const warnings: string[] = []
        if (info.isHoneypot) {
          warnings.push(
            `Our security checks detected that ${token.symbol} may be a honeypot token (cannot be sold or carries extremely high sell fee). Please research carefully before adding liquidity or trading.`,
          )
        }
        if (info.isFOT) {
          warnings.push(
            `${token.symbol} is a Fee-On-Transfer token with a ${Math.round(
              info.tax * 100,
            )}% transaction fee applied on every transfer. Please beware before triggering trades with this token.`,
          )
        }

        return warnings
      }),
    [honeypotInfoMap, tokensToCheck],
  )
}
