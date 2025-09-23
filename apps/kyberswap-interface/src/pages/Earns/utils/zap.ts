import { Web3Provider } from '@ethersproject/providers'

import { APP_PATHS } from 'constants/index'
import { CoreProtocol, EarnDex, NFT_MANAGER_CONTRACT, protocolGroupNameToExchangeMapping } from 'pages/Earns/constants'
import { getTokenId, isForkFrom } from 'pages/Earns/utils'

export const navigateToPositionAfterZap = async (
  library: Web3Provider,
  txHash: string,
  chainId: number,
  dex: EarnDex,
  poolId: string,
  navigateFunc: (url: string) => void,
  defaultTokenId?: number,
) => {
  let url
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)
  const isUniV4 = isForkFrom(dex, CoreProtocol.UniswapV4)

  const exchange = protocolGroupNameToExchangeMapping[dex]

  if (isUniv2) {
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolId)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', exchange) + '?forceLoading=true'
  } else {
    const tokenId = defaultTokenId || (await getTokenId(library, txHash, isUniV4))
    if (!tokenId) {
      navigateFunc(APP_PATHS.EARN_POSITIONS)
      return
    }
    const nftContractObj = NFT_MANAGER_CONTRACT[dex]
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
