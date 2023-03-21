import { ChainId } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PRICE_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

const getAddress = (address: string, isEVM: boolean) => (isEVM ? address.toLowerCase() : address)

export const useTokenPricesWithLoading = (
  addresses: Array<string>,
): {
  data: { [address: string]: number }
  loading: boolean
  fetchPrices: (value: string[]) => Promise<{ [key: string]: number }>
} => {
  const tokenPrices = useAppSelector(state => state.tokenPrices)
  const dispatch = useAppDispatch()
  const { chainId, isEVM } = useActiveWeb3React()
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
        const prices = res?.data?.prices || res

        if (prices?.length) {
          const formattedPrices = list.map(address => {
            const price = prices.find(
              (p: { address: string; marketPrice: number; price: number }) => getAddress(p.address, isEVM) === address,
            )

            return {
              address,
              chainId: chainId,
              price: price?.marketPrice || price?.price || 0,
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
          }
        }
        return {}
      } catch (e) {
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
    }, {} as { [address: string]: number })
  }, [tokenList, chainId, tokenPrices])

  return { data, loading, fetchPrices }
}

export const useTokenPrices = (
  addresses: Array<string>,
): {
  [address: string]: number
} => {
  const { data } = useTokenPricesWithLoading(addresses)
  return data
}
