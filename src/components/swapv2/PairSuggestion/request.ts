import { ChainId } from '@kyberswap/ks-sdk-core'
import Axios from 'axios'
const SUGGEST_PAIR_API = process.env.REACT_APP_TYPE_AND_SWAP_URL || ''

export type SuggestionPairData = {
  tokenIn: string
  tokenInSymbol: string
  tokenInImgUrl: string
  tokenOut: string
  tokenOutSymbol: string
  tokenOutImgUrl: string
  tokenInName: string
  tokenOutName: string
}

export function reqGetSuggestionPair(
  chainId: ChainId | undefined,
  keyword: string,
  wallet: string | null | undefined,
): Promise<{ favoritePairs: SuggestionPairData[]; suggestedPairs: SuggestionPairData[]; amount: string }> {
  const data = new Array(5).fill({
    tokenIn: '0xA2120b9e674d3fC3875f415A7DF52e382F141225',
    tokenInSymbol: 'ATA',
    tokenInName: 'Ataaaa',
    tokenInImgUrl: 'https://raw.githubusercontent.com/KyberNetwork/dmm-interface/main/src/assets/images/KNC.svg',
    tokenOut: '0x0Eb3a705fc54725037CC9e008bDede697f62F335',
    tokenOutSymbol: 'ATOM',
    tokenOutImgUrl: 'https://raw.githubusercontent.com/KyberNetwork/dmm-interface/main/src/assets/images/KNC.svg',
    tokenOutName: 'ATOMmmm',
  } as SuggestionPairData)
  return Promise.resolve({
    amount: '10',
    favoritePairs: data.slice(0, 3),
    suggestedPairs: data.slice(0, 5),
  })
  return Axios.get(SUGGEST_PAIR_API, { params: { chainId, keyword, wallet } }).then(({ data }) => data.data)
}

export function reqRemoveFavoritePair(
  item: SuggestionPairData,
  wallet: string | null | undefined,
  chainId: ChainId | undefined,
): Promise<any> {
  return Axios.delete(SUGGEST_PAIR_API, {
    data: { wallet, chainId, tokenIn: item.tokenIn, tokenOut: item.tokenOut },
  })
}

export function reqAddFavoritePair(
  item: SuggestionPairData,
  wallet: string | null | undefined,
  chainId: ChainId | undefined,
): Promise<any> {
  return Axios.post(SUGGEST_PAIR_API, {
    data: { wallet, chainId, tokenIn: item.tokenIn, tokenOut: item.tokenOut },
  })
}
