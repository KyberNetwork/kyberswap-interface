import { ChainId } from '@kyberswap/ks-sdk-core'
import { debounce } from 'lodash'
import { stringify } from 'querystring'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PRICE_API } from 'constants/env'
import { NETWORKS_INFO, isEVM as isEVMChain } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

const getAddress = (address: string, isEVM: boolean) => (isEVM ? address.toLowerCase() : address)

export const useTokenPricesWithLoading = (
  addresses: Array<string>,
  customChain?: ChainId,
): {
  data: { [address: string]: number }
  loading: boolean
  fetchPrices: (value: string[]) => Promise<{ [key: string]: number | undefined }>
  refetch: () => void
} => {
  const tokenPrices = useAppSelector(state => state.tokenPrices)
  const dispatch = useAppDispatch()
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const isEVM = isEVMChain(chainId)

  const [loading, setLoading] = useState(true)
  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const addressKeys = addresses
    .sort()
    .map(x => getAddress(x, isEVM))
    .join(',')

  const tokenList = useMemo(() => {
    return addressKeys.split(',').filter(Boolean)
  }, [addressKeys])

  const unknownPriceList = useMemo(() => {
    return tokenList.filter(item => tokenPrices[`${item}_${chainId}`] === undefined)
  }, [tokenList, chainId, tokenPrices])

  const fetchPrices = useCallback(
    async (list: string[]) => {
      if (list.length === 0) {
        return {}
      }

      try {
        setLoading(true)
        const payload = {
          ids: list.join(','),
        }
        const promise = isEVM
          ? fetch(`${PRICE_API}/${NETWORKS_INFO[chainId].priceRoute}/api/v1/prices`, {
              method: 'POST',
              body: JSON.stringify(payload),
            })
          : fetch(`${aggregatorDomain}/solana/prices?${stringify(payload)}`)

        const res = await promise.then(res => res.json())
        let prices = res?.data?.prices || res
        if (chainId === ChainId.GÖRLI) {
          prices = prices.concat([
            {
              address: '0x325697956767826a1ddf0ee8d5eb0f8ae3a2c171',
              price: 1.012345,
              preferPriceSource: 'kyberswap',
            },
            {
              address: '0xeac23a03f26df44fe3bb67bde1ecaecbee0daaa9',
              price: 0.98765,
              preferPriceSource: 'kyberswap',
            },
            {
              address: '0x543c9d27ee4ef9b405d7b41f264fa777f445ae88',
              price: 13,
              preferPriceSource: 'kyberswap',
            },
            {
              address: '0x1bbeeedcf32dc2c1ebc2f138e3fc7f3decd44d6a',
              price: 0.99,
              preferPriceSource: 'kyberswap',
            },
            {
              address: '0x2bf64acf7ead856209749d0d125e9ade2d908e7f',
              price: 1.01,
              preferPriceSource: 'kyberswap',
            },
            {
              address: '0x48f6d7dae56623dde5a0d56b283165cae1753d70',
              price: 1800,
              preferPriceSource: 'kyberswap',
            },
          ])
        }

        if (prices?.length) {
          const formattedPrices = list.map(address => {
            const price = prices.find(
              (p: {
                address: string
                marketPrice: number
                price: number
                preferPriceSource: 'kyberswap' | 'coingecko'
              }) => getAddress(p.address, isEVM) === address,
            )

            return {
              address,
              chainId: chainId,
              price: price?.preferPriceSource === 'kyberswap' ? price?.price || 0 : price?.marketPrice || 0,
            }
          })

          dispatch(updatePrices(formattedPrices))
          return formattedPrices.reduce(
            (acc, cur) => ({
              ...acc,
              [cur.address]: cur.price,
              [isAddressString(chainId, cur.address)]: cur.price,
            }),
            {},
          )
        }

        // hardcoded for goerli to test
        if (chainId === ChainId.GÖRLI) {
          return {
            '0x325697956767826a1ddf0ee8d5eb0f8ae3a2c171': 1.012345,
            '0xeac23a03f26df44fe3bb67bde1ecaecbee0daaa9': 0.98765,
            '0x325697956767826a1DDf0Ee8D5Eb0f8AE3a2c171': 1.012345,
            '0xEAC23a03F26df44fe3bB67BDE1ECAeCbEE0DAaA9': 0.98765,
            '0x543C9D27Ee4ef9b405D7B41F264fa777F445ae88': 13,
            '0x543c9d27ee4ef9b405d7b41f264fa777f445ae88': 13,
            '0x1bbeeedcf32dc2c1ebc2f138e3fc7f3decd44d6a': 0.99,
            '0x2bf64acf7ead856209749d0d125e9ade2d908e7f': 1.01,
            '0x48f6d7dae56623dde5a0d56b283165cae1753d70': 1800,
            '0x48f6D7dAE56623Dde5a0D56B283165cAE1753D70': 1800,
            '0x2Bf64aCf7eAd856209749D0D125e9Ade2D908E7f': 1,
            '0x1BBeeEdCF32dc2c1Ebc2F138e3FC7f3DeCD44D6A': 0.99,
          }
        }
        return {}
      } catch (e) {
        console.log(e)
        // empty
        return {}
      } finally {
        setLoading(false)
      }
    },
    [chainId, dispatch, isEVM, aggregatorDomain],
  )

  useEffect(() => {
    if (unknownPriceList.length) fetchPrices(unknownPriceList)
    else {
      setLoading(false)
    }
  }, [unknownPriceList, fetchPrices])

  const refetch = useMemo(() => debounce(() => fetchPrices(tokenList), 300), [fetchPrices, tokenList])

  const data: {
    [address: string]: number
  } = useMemo(() => {
    return tokenList.reduce((acc, address) => {
      const key = `${address}_${chainId}`
      return {
        ...acc,
        [address]: tokenPrices[key] || 0,
        [isAddressString(chainId, address)]: tokenPrices[key] || 0,
      }
    }, {})
  }, [tokenList, chainId, tokenPrices])

  return { data, loading, fetchPrices, refetch }
}

export const useTokenPrices = (
  addresses: Array<string>,
): {
  [address: string]: number
} => {
  const { data } = useTokenPricesWithLoading(addresses)
  return data
}
