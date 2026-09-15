import arcIcon from 'assets/networks/arc.svg'
import { ETHER_ADDRESS } from 'constants/index'

export default {
  // Arc's native asset is USDC, which the app represents by its built-in ERC-20 interface rather
  // than the sentinel, so nothing here matches `nativeAddress` and no native-token path ever runs.
  nativeAddress: ETHER_ADDRESS.toLowerCase(),
  univ4StateViewContract: '0xf3334192d15450cdd385c8b70e03f9a6bd9e673b',
  smartExitSupported: false,
  logo: arcIcon,
}
