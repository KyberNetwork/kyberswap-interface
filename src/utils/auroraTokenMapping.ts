import { ZERO_ADDRESS } from 'constants/index'
import { isAddress } from 'utils'

export const getAuroraTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`
  }

  if (!uri) {
    uri = `https://vvs.finance/images/tokens/${isAddress(address)}.svg`
  }

  return uri
}
