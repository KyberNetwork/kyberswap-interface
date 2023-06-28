import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import styled, { useTheme } from 'styled-components'

import { DAI, STABLE_COINS_ADDRESS, USDC, USDT } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { Field } from 'state/swap/actions'

const getNetworkStringWidget = (chainId: ChainId | undefined) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return 'ether'
    case ChainId.BSCMAINNET:
      return 'bnb'
    case ChainId.MATIC:
      return 'polygon'
    case ChainId.CRONOS:
      return 'cronos'
    case ChainId.AVAXMAINNET:
      return 'avalanche'
    case ChainId.FANTOM:
      return 'fantom'
    case ChainId.ARBITRUM:
      return 'arbitrum'
    case ChainId.VELAS:
      return 'velas'
    case ChainId.AURORA:
      return 'aurora'
    case ChainId.OASIS:
      return 'oasis'
    case ChainId.OPTIMISM:
      return 'optimism'
    default:
      return ''
  }
}

const TOKEN_PAIRS_ADDRESS_MAPPING: {
  [key: string]: string
} = {
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': '0xd75ea151a61d06868e31f8988d28dfe5e9df57b4',
  '0x6b175474e89094c44da98b954eedeac495271d0f': '0x74c99f3f5331676f6aec2756e1f39b4fc029a83e',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': '0x74c99f3f5331676f6aec2756e1f39b4fc029a83e',
  '0x1c954e8fe737f99f68fa1ccda3e51ebdb291948c': 'nodata',
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': '0xa374094527e1673a86de625aa59517c5de346d32',
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3': '0xd99c7f6c65857ac913a8f880a4cb84032ab2fc5b',
  '0xd586e7f844cea2f87f50152665bcbc2c279d8d70': '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
  '0xc7198437980c041c805a1edcba50c1ce5db95118': '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
  '0x19860ccb0a68fd4213ab9d8266f7bbf05a8dde98': '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e': '0xadc8ad9d3d62b1af72e5ce0ec767465f313513dd',
  '0x049d68029688eabf473097a2fc38ef61633a3c7a': '0xadc8ad9d3d62b1af72e5ce0ec767465f313513dd',
  '0x41e3df7f716ab5af28c1497b354d79342923196a': '0xadc8ad9d3d62b1af72e5ce0ec767465f313513dd',
  '0xf2001b145b43032aaf5ee2884e456ccd805f677d': '0xa68466208f1a3eb21650320d2520ee8eba5ba623',
  '0x66e428c3f67a68878562e79a0234c1f83c208770': '0xa68466208f1a3eb21650320d2520ee8eba5ba623',
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
  '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': '0x0f0fc5a5029e3d155708356b422d22cc29f8b3d4',
  '0xd501281565bf7789224523144fe5d98e8b28f267': '0x64ed9711667c9e8923bee32260a55a9b8dbc99d3',
  '0x63a72806098Bd3D9520cC43356dD78afe5D386D9': '0x5944f135e4f1e3fa2e5550d4b5170783868cc4fe',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': '0xd99c7f6c65857ac913a8f880a4cb84032ab2fc5b',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36', // BNB_USD
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': '0xce1923d2242bba540f1d56c8e23b1fbeae2596dc', // ETH_USD on polygon
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': '0x905dfcd5649217c42684f23958568e533c711aa3', // ETH_USD Arbitrum
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607': '0x1a981daa7967c66c3356ad044979bc82e4a478b9', // ETH_USD Optimism
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16', // BNB_BUSD
  '0x853ea32391aaa14c112c645fd20ba389ab25c5e0': '0x5d79a43e6b9d8e3ecca26f91afe34634248773c8', // USX on AVAX
  '0x261c94f2d3cccae76f86f6c8f2c93785dd6ce022': 'nodata', // ATH on BSC
}

// const LOCALSTORAGE_CHECKED_PAIRS = 'proChartCheckedPairs'
const DEXTOOLS_API = 'https://pancake-subgraph-proxy.kyberswap.com/dextools'

const fetcherDextools = (url: string) => {
  return fetch(`${DEXTOOLS_API}/${url}`)
    .then(res => res.json())
    .catch(error => console.log(error))
}

export const searchTokenPair = (address: string) => {
  if (TOKEN_PAIRS_ADDRESS_MAPPING[address.toLowerCase()]) {
    return new Promise(resolve => {
      resolve([{ id: TOKEN_PAIRS_ADDRESS_MAPPING[address.toLowerCase()] }])
    })
  }

  return fetcherDextools(`/shared/search/pair?query=${address}`)
}

const Iframe = styled.iframe`
  border: 1px solid #1c1c1c;
  border-radius: 8px;

  .header-pair {
    display: none;
  }
`

const isNativeToken = (chainId: ChainId | undefined, currency: Currency | undefined) => {
  if (!currency || !chainId) {
    return false
  }
  return currency.isNative || WETH[chainId].address.toLowerCase() === currency.address.toLowerCase()
}

const isUSDToken = (chainId: ChainId | undefined, currency: Currency | undefined) => {
  if (isNativeToken(chainId, currency) || !chainId || currency?.isNative) {
    return false
  }
  const usdTokenAddresses = [
    USDT[chainId].address.toLowerCase(),
    USDC[chainId].address.toLowerCase(),
    DAI[chainId].address.toLowerCase(),
    '0xe9e7cea3dedca5984780bafc599bd69add087d56', //BUSD
    '0xcd7509b76281223f5b7d3ad5d47f8d7aa5c2b9bf', //USDV Velas
    '0xdb28719f7f938507dbfe4f0eae55668903d34a15', //USDT_t BTTC
    '0xe887512ab8bc60bcc9224e1c3b5be68e26048b8b', //USDT_e BTTC
    '0x19860ccb0a68fd4213ab9d8266f7bbf05a8dde98', //BUSD.e
    '0x4fbf0429599460d327bd5f55625e30e4fc066095', //TDS on AVAX
    ...STABLE_COINS_ADDRESS[chainId].map(a => a.toLowerCase()),
  ]

  if (currency?.address && usdTokenAddresses.includes(currency.address.toLowerCase())) {
    return true
  }
  return false
}

export const checkPairHasDextoolsData = async (
  currencies: { [field in Field]?: Currency },
  chainId: ChainId | undefined,
): Promise<{ pairAddress: string }> => {
  const [currencyA, currencyB] = Object.values(currencies)
  const res = { pairAddress: '' }
  if (!currencyA || !currencyB) return Promise.resolve(res)
  if (
    (isNativeToken(chainId, currencyA) && isNativeToken(chainId, currencyB)) ||
    (isUSDToken(chainId, currencyA) && isUSDToken(chainId, currencyB))
  ) {
    return Promise.resolve(res)
  }
  // const cPstr = localStorage.getItem(LOCALSTORAGE_CHECKED_PAIRS)
  // const checkedPairs: { [key: string]: { ver: number; pairAddress: string; time: number } } = cPstr
  //   ? JSON.parse(cPstr)
  //   : {}
  // const symbolA = currencyA.isNative ? NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name : currencyA.symbol
  // const symbolB = currencyB.isNative ? NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name : currencyB.symbol
  // const key: string = [symbolA, symbolB, chainId].sort().join('')
  // const checkedPair = checkedPairs[key]
  // if (
  //   checkedPair &&
  //   checkedPair.ver &&
  //   checkedPair.pairAddress &&
  //   checkedPair.time > new Date().getTime() - dayTs // Cache expire after 1 day
  // ) {
  //   return Promise.resolve({ ver: checkedPair.ver, pairAddress: checkedPair.pairAddress })
  // }
  /// ETH pair
  if (isNativeToken(chainId, currencyA) || isNativeToken(chainId, currencyB)) {
    // const token = (isNativeToken(chainId, currencyA) ? currencyB : currencyA) as Token
    // if (token?.address) {
    //   const data1: { id: string }[] = await searchTokenPair(token.address, chainId)
    //   if (data1.length > 0 && data1[0].id) {
    //     // const ver = (await getHistoryCandleStatus(data1[0].id, chainId)) || 0

    //     // const ts = Math.floor(new Date().getTime() / monthTs) * monthTs
    //     // const { data } = await getCandlesApi(chainId, data1[0].id, ver, ts, 'month')
    //     // if (data?.candles?.length) {
    //     //   res.ver = ver
    //     //   res.pairAddress = data1[0].id
    //     //   updateLocalstorageCheckedPair(key, res)
    //     return Promise.resolve({ pairAddress: data1[0].id })
    //   }
    // }
    return Promise.reject()
  } else {
    /// USD pair
    if (isUSDToken(chainId, currencyA) || isUSDToken(chainId, currencyB)) {
      const token = (isUSDToken(chainId, currencyA) ? currencyB : currencyA) as Token
      if (token?.address) {
        const data1 = await searchTokenPair(token.address)
        if (data1.length > 0 && data1[0].id) {
          // const ver = await getHistoryCandleStatus(data1[0].id, chainId)
          // if (ver) {
          //   const ts = Math.floor(new Date().getTime() / monthTs) * monthTs
          //   const { data } = await getCandlesApi(chainId, data1[0].id, ver, ts, 'month', '15m', 'usd')
          //   if (data?.candles?.length) {
          //     res.ver = ver
          //     res.pairAddress = data1[0].id
          //     updateLocalstorageCheckedPair(key, res)
          //     return Promise.resolve(res)
          //   }
          // }
          return Promise.resolve({ pairAddress: data1[0].id })
        }
      }
    }
  }
  // updateLocalstorageCheckedPair(key, res)
  return Promise.resolve(res)
}

export default function DextoolsWidget({ pairAddress }: { pairAddress?: string }) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  useEffect(() => {
    fetch(
      'https://api.dextools.io/v1/token?chain=ether&address=0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202&page=0&pageSize=10',
      {
        headers: {
          'X-API-Key': 'e866e717297d333c84d05ec2d0e84b0c',
        },
      },
    ).then(res => console.log('🚀 ~ file: index.tsx:212 ~ useEffect ~ res:', res))
  }, [])
  return (
    <Iframe
      id="dextools-widget"
      title="DEXTools Trading Chart"
      width="100%"
      height="100%"
      src={`https://www.dextools.io/widgets/en/${getNetworkStringWidget(chainId)}/pe-light/${pairAddress}?theme=${
        theme.darkMode ? 'dark' : 'light'
      }&chartType=1&chartResolution=60&drawingToolbars=true`}
    />
  )
}
