import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useGetChainsConfigurationQuery, useLazyGetTokenListQuery } from 'services/ksSetting'

import { MAINNET_NETWORKS } from 'constants/networks'
import { TokenMap, formatAndCacheToken } from 'hooks/Tokens'
import { AppDispatch } from 'state'
import { isAddress } from 'utils'
import { getFormattedAddress } from 'utils/tokenInfo'

import { setTokenList } from './actions'
import { TokenInfo, WrappedTokenInfo } from './wrappedTokenInfo'

function listToTokenMap(list: TokenInfo[], chainId: ChainId): TokenMap {
  const map = list.reduce<TokenMap>((tokenMap, tokenInfo) => {
    const formattedAddress = getFormattedAddress(chainId, tokenInfo.address)
    if (!tokenInfo || tokenMap[formattedAddress] || !isAddress(chainId, tokenInfo.address)) {
      return tokenMap
    }
    const token = formatAndCacheToken(tokenInfo)
    if (token) tokenMap[formattedAddress] = token
    return tokenMap
  }, {})
  return map
}

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  const [fetchTokenList] = useLazyGetTokenListQuery()
  useGetChainsConfigurationQuery()

  useEffect(() => {
    const getTokens = async () => {
      ;[...MAINNET_NETWORKS, ChainId.GÖRLI].forEach(async chainId => {
        let tokens: TokenInfo[] = []
        const pageSize = 100
        const maximumPage = 15
        let page = 1
        while (true) {
          const { data } = await fetchTokenList({ chainId, page, pageSize, isWhitelisted: true })
          page++
          const tokensResponse = data?.data.tokens ?? []
          tokens = tokens.concat(tokensResponse)
          if (tokensResponse.length < pageSize || page >= maximumPage) break // out of tokens, and prevent infinity loop
        }

        const tokenList = listToTokenMap(tokens, chainId)

        if (chainId === ChainId.GÖRLI) {
          dispatch(
            setTokenList({
              chainId,
              tokenList: {
                ...tokenList,
                '0x1BBeeEdCF32dc2c1Ebc2F138e3FC7f3DeCD44D6A': new WrappedTokenInfo({
                  address: '0x1BBeeEdCF32dc2c1Ebc2F138e3FC7f3DeCD44D6A',
                  chainId: ChainId.GÖRLI,
                  decimals: 18,
                  name: 'DAI',
                  symbol: 'DAI',
                  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
                }),
                '0x2Bf64aCf7eAd856209749D0D125e9Ade2D908E7f': new WrappedTokenInfo({
                  address: '0x2Bf64aCf7eAd856209749D0D125e9Ade2D908E7f',
                  chainId: ChainId.GÖRLI,
                  decimals: 18,
                  name: 'USDT',
                  symbol: 'USDT',
                  logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
                }),
              },
            }),
          )
        } else dispatch(setTokenList({ chainId, tokenList }))
      })
    }

    getTokens()
  }, [dispatch, fetchTokenList])

  return null
}
