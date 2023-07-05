import { Trans } from '@lingui/macro'
import { useDispatch } from 'react-redux'

import { ButtonOutlined } from 'components/Button'
import { SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { selectChains } from 'state/myEarnings/actions'

const CurrentChainButton = () => {
  const dispatch = useDispatch()
  const { mixpanelHandler } = useMixpanel()
  const { chainId } = useActiveWeb3React()
  const isValidNetwork = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.includes(chainId)

  const handleClickCurrentChain = () => {
    if (!isValidNetwork) {
      return
    }

    mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_CURRENT_CHAIN_BUTTON)
    dispatch(selectChains([chainId]))
  }

  return (
    <ButtonOutlined
      onClick={handleClickCurrentChain}
      disabled={!isValidNetwork}
      padding="0 16px"
      style={{
        height: '36px',
        flex: ' 0 0 fit-content',
      }}
    >
      <Trans>Current Chain</Trans>
    </ButtonOutlined>
  )
}

export default CurrentChainButton
