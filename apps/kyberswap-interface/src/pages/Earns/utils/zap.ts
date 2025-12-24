import { Web3Provider } from '@ethersproject/providers'
import { API_URLS, CHAIN_ID_TO_CHAIN, ChainId, NATIVE_TOKEN_ADDRESS, PoolType, Token } from '@kyber/schema'
import axios, { AxiosError } from 'axios'

import { APP_PATHS } from 'constants/index'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import { getTokenId } from 'pages/Earns/utils'

const nativeAddressLower = NATIVE_TOKEN_ADDRESS.toLowerCase()

export const sortTokensByAddress = (tokenA: Token, tokenB: Token): [Token, Token] => {
  const addressA = tokenA.address.toLowerCase()
  const addressB = tokenB.address.toLowerCase()

  if (addressA === nativeAddressLower) return [tokenA, tokenB]
  if (addressB === nativeAddressLower) return [tokenB, tokenA]

  return addressA < addressB ? [tokenA, tokenB] : [tokenB, tokenA]
}

const getConfigHooksAddress = (poolType?: PoolType): string | undefined => {
  if (poolType === PoolType.DEX_UNISWAP_V4_FAIRFLOW) {
    return '0x4440854B2d02C57A0Dc5c58b7A884562D875c0c4'
  }
  if (poolType === PoolType.DEX_PANCAKE_INFINITY_CL_FAIRFLOW) {
    return '0x44428C6ce391915D51F963C0Dd395Cd0f95fdFD2'
  }
  return undefined
}

export const fetchExistingPoolAddress = async (input: {
  chainId: number
  protocol: Exchange
  token0: Token | null
  token1: Token | null
  fee: number
}) => {
  if (!input.token0 || !input.token1) return undefined
  const [token0, token1] = sortTokensByAddress(input.token0, input.token1)
  const configFee = input.fee * 10_000
  const tickSpacing = Math.max(Math.round((2 * configFee) / 100), 1)
  const poolType = ZAPIN_DEX_MAPPING[input.protocol]
  return axios
    .get(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[input.chainId as ChainId]}/api/v1/create/route`, {
      params: {
        dex: poolType,
        'pool.tokens': `${token0.address},${token1.address}`,
        'pool.uniswap_v4_config.fee': configFee,
        'pool.uniswap_v4_config.tick_spacing': tickSpacing,
        'zap_in.position.tick_lower': tickSpacing * 1,
        'zap_in.position.tick_upper': tickSpacing * 10,
        'zap_in.tokens_in': token0.address,
        'zap_in.amounts_in': 10 ** (token0.decimals - 1),
        'pool.uniswap_v4_config.hooks': getConfigHooksAddress(poolType),
      },
    })
    .then(() => undefined)
    .catch((error: AxiosError<{ message: string }>) => {
      const message = error.response?.data.message || ''
      const matches = message.match(/pool already exists: (0x[a-fA-F0-9]+)/)
      return matches?.[1]
    })
}

export const navigateToPositionAfterZap = async (
  library: Web3Provider,
  txHash: string,
  chainId: number,
  exchange: Exchange,
  poolId: string,
  navigateFunc: (url: string) => void,
  defaultTokenId?: number,
) => {
  let url
  const isUniv2 = EARN_DEXES[exchange].isForkFrom === CoreProtocol.UniswapV2

  if (isUniv2) {
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolId)
        .replace(':chainId', chainId.toString())
        .replace(':exchange', exchange) + '?forceLoading=true'
  } else {
    const tokenId = defaultTokenId || (await getTokenId(library, txHash, exchange))
    if (!tokenId) {
      navigateFunc(APP_PATHS.EARN_POSITIONS)
      return
    }
    const nftContractObj = EARN_DEXES[exchange].nftManagerContract
    const nftContract =
      typeof nftContractObj === 'string'
        ? nftContractObj
        : nftContractObj[chainId as unknown as keyof typeof nftContractObj]
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', `${nftContract}-${tokenId}`)
        .replace(':chainId', chainId.toString())
        .replace(':exchange', exchange) + '?forceLoading=true'
  }

  navigateFunc(url)
}
