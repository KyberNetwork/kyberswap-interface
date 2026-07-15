import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO as SCHEMA_NETWORKS_INFO, ChainId as SchemaChainId } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTokenPrices } from 'services/tokenCatalog'

import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

export enum PriceType {
  Average = 'Average',
}

const chunkList = (list: string[], chunkSize: number) => {
  const chunks: string[][] = []
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize))
  }
  return chunks
}

const CHUNK_SIZE = 100
const NATIVE_TOKEN_PRICE_KEY = NATIVE_TOKEN_ADDRESS.toLowerCase()

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
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const tokenPrices = useAppSelector(state => state.tokenPrices)
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const [loading, setLoading] = useState(true)
  const addressKeys = [...addresses]
    .sort()
    .map(x => x.toLowerCase())
    .join(',')

  const wrappedNativeAddress = useMemo(
    () => SCHEMA_NETWORKS_INFO[chainId as unknown as SchemaChainId]?.wrappedToken.address?.toLowerCase(),
    [chainId],
  )

  const tokenList = useMemo(() => {
    const list = addressKeys.split(',').filter(Boolean)

    if (list.includes(NATIVE_TOKEN_PRICE_KEY) && wrappedNativeAddress) {
      list.push(wrappedNativeAddress)
    }

    return Array.from(new Set(list))
  }, [addressKeys, wrappedNativeAddress])

  const unknownPriceList = useMemo(() => {
    return tokenList.filter(item => tokenPrices[`${item}_${chainId}`] === undefined)
  }, [tokenList, chainId, tokenPrices])

  const fetchPrices = useCallback(
    async (list: string[]) => {
      const normalizedList = Array.from(new Set(list.filter(Boolean).map(address => address.toLowerCase()))).sort()

      if (!chainId || normalizedList.length === 0) {
        setLoading(false)
        return {}
      }

      try {
        setLoading(true)
        const chunks = chunkList(normalizedList, CHUNK_SIZE)
        const responses = await Promise.all(
          chunks.map(chunk =>
            queryClient.fetchQuery({
              queryKey: ['tokenPrices', chainId, chunk],
              queryFn: () => fetchTokenPrices({ [chainId]: chunk }),
              retry: false,
            }),
          ),
        )

        const prices = responses.reduce<Record<string, number>>((acc, response) => {
          Object.entries(response?.data?.[chainId] || {}).forEach(([address, price]) => {
            acc[address.toLowerCase()] =
              priceType === PriceType.Average ? (price.PriceBuy + price.PriceSell) / 2 : price.PriceBuy
          })
          return acc
        }, {})

        const formattedPrices = normalizedList.map(address => ({
          address,
          chainId,
          price: prices[address] || 0,
        }))

        if (formattedPrices?.length) {
          dispatch(updatePrices(formattedPrices))
          return formattedPrices.reduce<Record<string, number>>((acc, cur) => {
            acc[cur.address] = cur.price
            acc[isAddressString(cur.address)] = cur.price
            return acc
          }, {})
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
    [chainId, dispatch, priceType, queryClient],
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
    return tokenList.reduce<Record<string, number>>((acc, address) => {
      const key = `${address}_${chainId}`
      const wrappedNativeKey = `${wrappedNativeAddress}_${chainId}`
      const price =
        address === NATIVE_TOKEN_PRICE_KEY && wrappedNativeAddress
          ? tokenPrices[key] || tokenPrices[wrappedNativeKey] || 0
          : tokenPrices[key] || 0

      acc[address] = price
      acc[isAddressString(address)] = price
      return acc
    }, {})
  }, [tokenList, chainId, tokenPrices, wrappedNativeAddress])

  // `data` is rebuilt with a fresh identity whenever the Redux tokenPrices slice changes — which is
  // on every price poll anywhere in the app, even for tokens this caller never asked about. Cache it
  // by a value signature over the requested prices so the reference only changes when a requested
  // token's resolved price actually changes (mirrors the balance path's balanceResultCached).
  const dataSignature = tokenList.map(address => `${address}:${data[address] ?? 0}`).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataCached = useMemo(() => data, [dataSignature])

  return { data: dataCached, loading, fetchPrices, refetch }
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
