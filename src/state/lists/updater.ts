import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { AppDispatch } from 'state'
import { getTokenList } from 'utils/getTokenList'

import { setTokenList } from './actions'
import { WrappedTokenInfo } from './wrappedTokenInfo'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    ;[...MAINNET_NETWORKS, ChainId.GÖRLI].forEach(chainId => {
      const listUrl = NETWORKS_INFO[chainId].tokenListUrl
      getTokenList(listUrl, chainId)
        .then(tokenList => {
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
        .catch(error => {
          console.error(`Failed to get list at url ${listUrl}`, error)
        })
    })
  }, [dispatch])

  return null
}
