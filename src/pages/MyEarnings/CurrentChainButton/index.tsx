import { Trans } from '@lingui/macro'
import { useDispatch } from 'react-redux'
import { Flex } from 'rebass'

import { ButtonOutlined } from 'components/Button'
import { SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { selectChains } from 'state/myEarnings/actions'

const CurrentChainButton = () => {
  const dispatch = useDispatch()
  const { chainId } = useActiveWeb3React()
  const isValidNetwork = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.includes(chainId)

  const handleClickCurrentChain = () => {
    if (!isValidNetwork) {
      return
    }

    dispatch(selectChains([chainId]))
  }

  return (
    <Flex width="fit-content">
      <ButtonOutlined
        onClick={handleClickCurrentChain}
        disabled={!isValidNetwork}
        padding="0 8px"
        style={{
          height: '36px',
        }}
      >
        <Trans>Current Chain</Trans>
      </ButtonOutlined>
    </Flex>
  )
}

export default CurrentChainButton
