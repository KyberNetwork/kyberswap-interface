import { ChainId } from '@kyberswap/ks-sdk-core'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { TOKEN_API_URL } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

export enum PriceType {
  Average = 'Average',
  Buy = 'Buy',
  Sell = 'Sell',
}

interface PriceResponse {
  data: { [chainId: string]: { [address: string]: { PriceBuy: number; PriceSell: number } } }
}

export const useTokenPricesWithLoading = (
  addresses: Array<string>,
  customChain?: ChainId,
  priceType?: PriceType,
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

        const prices: { address: string; price: number }[] = Object.keys(r?.data?.[chainId] || {}).map(address => ({
          address,
          price:
            priceType === PriceType.Average
              ? (r.data[chainId][address].PriceBuy + r.data[chainId][address].PriceSell) / 2
              : r.data[chainId][address].PriceBuy,
        }))

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

        return {}
      } catch (e) {
        console.log(e)
        // empty
        return {}
      } finally {
        setLoading(false)
      }
    },
    [chainId, dispatch, priceType],
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
  priceType?: PriceType,
): {
  [address: string]: number
} => {
  const { data } = useTokenPricesWithLoading(addresses, chainId, priceType)
  return data
}
