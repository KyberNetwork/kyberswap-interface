import { ChainId } from '@kyberswap/ks-sdk-core'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { TOKEN_API_URL } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

interface PriceResponse {
  data: { [chainId: string]: { [address: string]: { PriceBuy: number; PriceSell: number } } }
}

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

  const [loading, setLoading] = useState(true)
  const addressKeys = addresses
    .sort()
    .map(x => x.toLowerCase())
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
        const r: PriceResponse = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
          method: 'POST',
          body: JSON.stringify({
            [chainId]: list,
          }),
        }).then(res => res.json())

        let prices: { address: string; price: number }[] = Object.keys(r?.data?.[chainId] || {}).map(address => ({
          address,
          price: r.data[chainId][address].PriceBuy,
        }))

        if (chainId === ChainId.GÖRLI) {
          prices = prices.concat([
            {
              address: '0x325697956767826a1ddf0ee8d5eb0f8ae3a2c171',
              price: 1.012345,
            },
            {
              address: '0xeac23a03f26df44fe3bb67bde1ecaecbee0daaa9',
              price: 0.98765,
            },
            {
              address: '0x543c9d27ee4ef9b405d7b41f264fa777f445ae88',
              price: 13,
            },
            {
              address: '0x1bbeeedcf32dc2c1ebc2f138e3fc7f3decd44d6a',
              price: 1,
            },
            {
              address: '0x2bf64acf7ead856209749d0d125e9ade2d908e7f',
              price: 1,
            },
            {
              address: '0x48f6d7dae56623dde5a0d56b283165cae1753d70',
              price: 1740,
            },
            {
              address: '0x3e0e7dbb7dd24934ffe06e16fbcad11bed2c65e2',
              price: 1.74,
            },
            {
              address: '0xd6c528a95f68f1ea923d3af97064c5c931d5106f',
              price: 0.5,
            },
            {
              address: '0x620791f237fb2233e2d5868ffcdcaa69ec468aba',
              price: 30423,
            },
            {
              address: '0x8d890dda6535aa3b6c2a00dad0baa0977722dbb0',
              price: 0.00100587,
            },
          ])
        }

        if (prices?.length) {
          const formattedPrices = list.map(address => {
            const price = prices.find(
              (p: { address: string; price: number }) => p.address.toLowerCase() === address.toLowerCase(),
            )

            return {
              address,
              chainId: chainId,
              price: price?.price || 0,
            }
          })

          dispatch(updatePrices(formattedPrices))
          return formattedPrices.reduce(
            (acc, cur) => ({
              ...acc,
              [cur.address]: cur.price,
              [isAddressString(cur.address)]: cur.price,
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
    [chainId, dispatch],
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
        [isAddressString(address)]: tokenPrices[key] || 0,
      }
    }, {})
  }, [tokenList, chainId, tokenPrices])

  return { data, loading, fetchPrices, refetch }
}

export const useTokenPrices = (
  addresses: Array<string>,
  chainId?: ChainId,
): {
  [address: string]: number
} => {
  const { data } = useTokenPricesWithLoading(addresses, chainId)
  return data
}
