import { createSlice } from '@reduxjs/toolkit'
import { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters'
import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

// Add a loading state to track fetch status
export interface CrossChainSwapState {
  transactions: NormalizedTxResponse[]
  nearTokens: NearToken[]
  isLoadingNearTokens: boolean
}

export interface NearToken {
  assetId: string
  decimals: number
  blockchain: string
  symbol: string
  price: number
  priceUpdatedAt: number
  contractAddress: string
  logo: string
}

const slice = createSlice({
  name: 'crossChainSwap',
  initialState: {
    transactions: [] as NormalizedTxResponse[],
    nearTokens: [] as NearToken[],
    isLoadingNearTokens: false,
  } as CrossChainSwapState,
  reducers: {
    updateTransactions: (state, { payload }: { payload: NormalizedTxResponse[] }) => {
      state.transactions = payload
    },
    updateNearTokens: (state, { payload }: { payload: NearToken[] }) => {
      state.nearTokens = payload
      state.isLoadingNearTokens = false
    },
    setLoadingNearTokens: (state, { payload }: { payload: boolean }) => {
      state.isLoadingNearTokens = payload
    },
  },
})

export const { updateTransactions, updateNearTokens, setLoadingNearTokens } = slice.actions
export default slice.reducer

export const useCrossChainTransactions = (): [
  NormalizedTxResponse[],
  (transactions: NormalizedTxResponse[]) => void,
] => {
  const transactions = useAppSelector(state => state.crossChainSwap.transactions || []) || []
  const dispatch = useAppDispatch()
  const setTransactions = (transactions: NormalizedTxResponse[]) => {
    dispatch(updateTransactions(transactions))
  }
  return [transactions, setTransactions]
}

// A flag to ensure we only have one in-flight request
let isNearTokensFetchInProgress = false

// Helper function to get a logo URL for a token
const getTokenLogoUrl = (token: NearToken) => {
  const { symbol, contractAddress } = token

  // For major tokens without contract addresses or as fallbacks
  switch (symbol) {
    case 'ETH':
      return 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    case 'BTC':
    case 'wBTC':
      return 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
    case 'USDC':
      return 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    case 'USDT':
      return 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    case 'DAI':
      return 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    case 'SOL':
      return 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
    case 'NEAR':
    case 'wNEAR':
      return 'https://assets.coingecko.com/coins/images/10365/small/near.jpg'
    case 'BNB':
      return 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
    case 'DOGE':
      return 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png'
    case 'XRP':
      return 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
    case 'TRX':
      return 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png'
    case 'FRAX':
      return 'https://assets.coingecko.com/coins/images/13422/small/FRAX_icon.png'
    case 'LINK':
      return 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
    case 'UNI':
      return 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg'
    case 'AAVE':
      return 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png'
    case 'SHIB':
      return 'https://assets.coingecko.com/coins/images/11939/small/shiba.png'
    case 'PEPE':
      return 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg'
    case 'REF':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/11809.png'
    case 'AURORA':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png'
    case 'BLACKDRAGON':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/29627.png'
    // Add more cases as needed
    default:
      // Fallback to a generic token icon
      return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x${contractAddress}/logo.png`
  }
}

export const useNearTokens = () => {
  const { nearTokens, isLoadingNearTokens } = useAppSelector(state => state.crossChainSwap)
  const dispatch = useAppDispatch()
  const hasTokens = useMemo(() => nearTokens?.length > 0, [nearTokens?.length])

  useEffect(() => {
    // Only fetch if we don't have tokens AND we're not already loading tokens
    // AND there's not already a fetch in progress
    if (hasTokens || isLoadingNearTokens || isNearTokensFetchInProgress) return

    // Set the module-level flag to prevent other components from starting a fetch
    isNearTokensFetchInProgress = true

    // Set loading state in Redux so other components can see we're loading
    dispatch(setLoadingNearTokens(true))

    fetch(`https://1click.chaindefuser.com/v0/tokens`)
      .then(res => res.json())
      .then(res => {
        const wNear = res.find((token: NearToken) => token.contractAddress === 'wrap.near')

        const native: NearToken = wNear
          ? {
              ...wNear,
              symbol: 'NEAR',
              contractAddress: '',
              assetId: 'near',
              logo: getTokenLogoUrl(wNear),
            }
          : {
              assetId: 'near',
              decimals: 24,
              blockchain: 'near',
              symbol: 'NEAR',
              price: 0,
              priceUpdatedAt: 0,
              contractAddress: '',
              logo: getTokenLogoUrl(wNear),
            }

        dispatch(
          updateNearTokens([
            native,
            ...(res?.map((item: NearToken) => {
              return {
                ...item,
                logo: getTokenLogoUrl(item),
              }
            }) || []),
          ]),
        )
      })
      .catch(error => {
        console.error('Failed to fetch near tokens:', error)
        // Reset loading state on error
        dispatch(setLoadingNearTokens(false))
      })
      .finally(() => {
        // Reset the in-flight flag
        isNearTokensFetchInProgress = false
      })
  }, [hasTokens, isLoadingNearTokens, dispatch])

  return {
    nearTokens: nearTokens || [],
    isLoadingNearTokens,
  }
}
