import ethereumLogo from 'assets/networks/ethereum.svg'
import { ETHER_ADDRESS } from 'constants/index'

export default {
  nativeAddress: ETHER_ADDRESS.toLowerCase(),
  farmingSupported: true,
  smartExitSupported: false,
  univ4StateViewContract: '0x7ffe42c4a5deea5b0fec41c94c136cf115597227',
  logo: ethereumLogo,
}
