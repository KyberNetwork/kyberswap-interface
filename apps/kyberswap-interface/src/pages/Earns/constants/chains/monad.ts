import monadIcon from 'assets/networks/monad.svg'
import { ETHER_ADDRESS } from 'constants/index'

export default {
  nativeAddress: ETHER_ADDRESS.toLowerCase(),
  farmingSupported: true,
  univ4StateViewContract: '0x77395f3b2e73ae90843717371294fa97cc419d64',
  smartExitSupported: true,
  logo: monadIcon,
}
