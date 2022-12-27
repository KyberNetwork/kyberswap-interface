import SwapFormV2 from 'components/swapv2/SwapForm'
import SwapFormV3 from 'components/swapv3/SwapForm'
import { CHAINS_SUPPORT_NEW_META_AGGREGATOR_APIS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

const SwapForm = () => {
  const { chainId } = useActiveWeb3React()

  if (CHAINS_SUPPORT_NEW_META_AGGREGATOR_APIS.includes(chainId)) {
    return <SwapFormV3 />
  }

  return <SwapFormV2 />
}

export default SwapForm
