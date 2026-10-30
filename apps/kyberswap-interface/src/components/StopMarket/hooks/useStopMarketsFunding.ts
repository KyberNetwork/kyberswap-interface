import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQueries } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useCallback, useMemo } from 'react'
import stopMarketApi from 'services/stopMarket'

import { StopMarket } from 'components/StopMarket/types'
import { StopMarketFunding, getStopMarketFundingKey, groupStopMarketTokensByChain } from 'components/StopMarket/utils'
import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch } from 'state/hooks'
import { Address } from 'utils/viem'

/**
 * The wallet's own chain refreshes as often as the list does, since that is where the user acts on
 * their balance; another chain's figures move only when the user goes there, so they are read less often.
 */
const WALLET_CHAIN_POLL_MS = 10_000
const OTHER_CHAIN_POLL_MS = 30_000

const EMPTY_FUNDING: Record<string, StopMarketFunding> = {}

const toBigInt = (value: unknown) => (typeof value === 'bigint' ? value : undefined)

/**
 * What the wallet holds of each open order's sell token, and what it lets the smartIntent contract
 * spend, read on each order's own chain: one multicall per chain covers every token on screen there.
 * Polled on a timer rather than per block, because the app follows block heights only on the wallet's
 * chain, which would leave the figures for every other chain read once and never again.
 */
export const useStopMarketsFunding = (orders: StopMarket[], enabled: boolean): Record<string, StopMarketFunding> => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  const tokensByChain = useMemo(
    () => (enabled && account ? groupStopMarketTokensByChain(orders) : []),
    [enabled, account, orders],
  )

  const fetchFunding = useCallback(
    async (chainId: ChainId, tokens: string[]): Promise<Record<string, StopMarketFunding>> => {
      if (!account) return EMPTY_FUNDING
      // Without the spender an allowance cannot be read, but a balance still can.
      const spender = await dispatch(
        stopMarketApi.endpoints.getStopMarketConfig.initiate(chainId, { subscribe: false }),
      )
        .unwrap()
        .then(config => config.smartIntentAddress || undefined)
        .catch(() => undefined)

      const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
      if (!publicClient) return EMPTY_FUNDING
      const results = await publicClient.multicall({
        contracts: tokens.flatMap(token => [
          { address: token as Address, abi: ERC20_ABI, functionName: 'balanceOf', args: [account] },
          ...(spender
            ? [{ address: token as Address, abi: ERC20_ABI, functionName: 'allowance', args: [account, spender] }]
            : []),
        ]),
        allowFailure: true,
      })

      const callsPerToken = spender ? 2 : 1
      return Object.fromEntries(
        tokens.map((token, index) => {
          const balance = results[index * callsPerToken]
          const allowance = spender ? results[index * callsPerToken + 1] : undefined
          return [
            getStopMarketFundingKey(chainId, token),
            {
              balance: balance?.status === 'success' ? toBigInt(balance.result) : undefined,
              allowance: allowance?.status === 'success' ? toBigInt(allowance.result) : undefined,
            },
          ]
        }),
      )
    },
    [account, dispatch],
  )

  return useQueries({
    queries: tokensByChain.map(({ chainId, tokens }) => ({
      queryKey: ['stop-market-funding', chainId, account, tokens],
      queryFn: () => fetchFunding(chainId, tokens),
      refetchInterval: chainId === walletChainId ? WALLET_CHAIN_POLL_MS : OTHER_CHAIN_POLL_MS,
      refetchOnWindowFocus: false,
    })),
    combine: results =>
      results.some(result => result.data)
        ? Object.assign({}, ...results.map(result => result.data ?? EMPTY_FUNDING))
        : EMPTY_FUNDING,
  })
}
