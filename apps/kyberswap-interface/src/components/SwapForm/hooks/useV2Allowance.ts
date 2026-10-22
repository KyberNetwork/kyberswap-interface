import { Currency } from '@kyberswap/ks-sdk-core'
import { useReadContracts } from 'wagmi'

import { ERC20_ABI } from 'constants/abis'
import { useActiveWeb3React } from 'hooks'
import { AGGREGATION_ROUTER_V2, isAggregationRouterV3 } from 'utils/aggregationRouter'
import { paysNativeOnSwap } from 'utils/nativeErc20'
import { Address } from 'utils/viem'

// Read the old allowance only to explain re-approval; authorization still uses the route's router.
export default function useV2Allowance(currency: Currency | undefined, routerAddress: string | undefined) {
  const { account, chainId } = useActiveWeb3React()
  const enabled = !!account && !!currency && !paysNativeOnSwap(currency) && isAggregationRouterV3(routerAddress)
  const { data } = useReadContracts({
    contracts:
      enabled && currency && account
        ? [
            {
              address: currency.wrapped.address as Address,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [account, AGGREGATION_ROUTER_V2],
              chainId,
            },
          ]
        : [],
    query: { enabled },
  })
  const allowance = data?.[0]?.result
  return enabled && typeof allowance === 'bigint' && allowance > 0n
}
