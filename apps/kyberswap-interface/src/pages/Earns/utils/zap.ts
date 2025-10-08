import { Web3Provider } from '@ethersproject/providers'

import { APP_PATHS } from 'constants/index'
import { CoreProtocol, Exchange, NFT_MANAGER_CONTRACT } from 'pages/Earns/constants'
import { getTokenId, isForkFrom } from 'pages/Earns/utils'

export const navigateToPositionAfterZap = async (
  library: Web3Provider,
  txHash: string,
  chainId: number,
  exchange: Exchange,
  poolId: string,
  navigateFunc: (url: string) => void,
  defaultTokenId?: number,
) => {
  let url
  const isUniv2 = isForkFrom(exchange, CoreProtocol.UniswapV2)

  if (isUniv2) {
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolId)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', exchange) + '?forceLoading=true'
  } else {
    const tokenId = defaultTokenId || (await getTokenId(library, txHash, exchange))
    if (!tokenId) {
      navigateFunc(APP_PATHS.EARN_POSITIONS)
      return
    }
    const nftContractObj = NFT_MANAGER_CONTRACT[exchange]
    const nftContract =
      typeof nftContractObj === 'string'
        ? nftContractObj
        : nftContractObj[chainId as unknown as keyof typeof nftContractObj]
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', `${nftContract}-${tokenId}`)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', exchange) + '?forceLoading=true'
  }

  navigateFunc(url)
}
