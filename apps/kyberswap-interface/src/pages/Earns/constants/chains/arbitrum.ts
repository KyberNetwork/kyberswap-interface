import arbitrumLogo from 'assets/networks/arbitrum.svg'
import { ETHER_ADDRESS } from 'constants/index'

export default {
  nativeAddress: ETHER_ADDRESS.toLowerCase(),
  farmingSupported: false,
  smartExitSupported: false,
  univ4StateViewContract: '0x76fd297e2d437cd7f76d50f01afe6160f86e9990',
  logo: arbitrumLogo,
}
