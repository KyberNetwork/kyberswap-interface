import baseLogo from 'assets/networks/base.svg'
import { ETHER_ADDRESS } from 'constants/index'

export default {
  nativeAddress: ETHER_ADDRESS.toLowerCase(),
  farmingSupported: true,
  smartExitSupported: true,
  univ4StateViewContract: '0xa3c0c9b65bad0b08107aa264b0f3db444b867a71',
  logo: baseLogo,
}
