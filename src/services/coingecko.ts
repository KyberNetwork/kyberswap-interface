import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { NETWORKS_INFO } from 'constants/networks'

const coingeckoApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: baseQueryOauth({
    baseUrl: '',
  }),
  endpoints: builder => ({
    getMarketTokenInfo: builder.query<any, { chainId: ChainId; address: string; coingeckoAPI: string }>({
      query: ({ chainId, address, coingeckoAPI }) => ({
        url:
          address.toLowerCase() === WETH[chainId].address.toLowerCase()
            ? `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNativeTokenId}`
            : `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNetworkId}/contract/${address}`,
      }),
    }),
    getSecurityTokenInfo: builder.query<any, { chainId: ChainId; address: string }>({
      query: ({ chainId, address }) => ({
        url: `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`,
      }),
      transformResponse: () => ({
        anti_whale_modifiable: '1',
        buy_tax: '0.12',
        can_take_back_ownership: '0',
        cannot_buy: '0',
        cannot_sell_all: '0',
        creator_address: '0x85f6be9460291e86e0fb49b07d0a83cc5f7206cd',
        creator_balance: '0',
        creator_percent: '0.000000',
        external_call: '0',
        hidden_owner: '1',
        holder_count: '2518',
        honeypot_with_same_creator: '0',
        is_anti_whale: '1',
        is_blacklisted: '0',
        is_honeypot: '0',
        is_in_dex: '1',
        is_mintable: '0',
        is_open_source: '1',
        is_proxy: '0',
        is_whitelisted: '0',
        lp_holder_count: '26',
        lp_total_supply: '382659.912778063983039008',
        owner_address: '0x85f6be9460291e86e0fb49b07d0a83cc5f7206cd',
        owner_balance: '0',
        owner_change_balance: '0',
        owner_percent: '0.000000',
        personal_slippage_modifiable: '0',
        selfdestruct: '0',
        sell_tax: '0.12',
        slippage_modifiable: '1',
        token_name: 'Inuko Coin',
        token_symbol: 'INUKO',
        total_supply: '10000000',
        trading_cooldown: '0',
        transfer_pausable: '0',
      }),
    }),
  }),
})

// todo memo
// todo tracking
// todo rename this file ???
// todo (not for now) move basic chart api to this file
export const { useGetMarketTokenInfoQuery, useGetSecurityTokenInfoQuery } = coingeckoApi

export default coingeckoApi
