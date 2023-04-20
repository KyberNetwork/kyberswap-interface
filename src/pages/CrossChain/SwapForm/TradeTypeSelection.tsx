import { Trans } from '@lingui/macro'
import { Clock } from 'react-feather'
import { Text } from 'rebass/styled-components'

import { ReactComponent as ThunderIcon } from 'assets/svg/thunder_icon.svg'
import { ButtonReturnType, GroupButtonReturnTypes } from 'components/swapv2/styleds'
import { useCrossChainSetting } from 'state/user/hooks'

const TradeTypeSelection: React.FC = () => {
  const {
    setting: { enableExpressExecution },
    setExpressExecutionMode,
  } = useCrossChainSetting()

  return (
    <GroupButtonReturnTypes>
      <ButtonReturnType onClick={() => setExpressExecutionMode(false)} active={!enableExpressExecution} role="button">
        <Clock size={16} />
        <Text marginLeft="4px">
          <Trans>Regular</Trans>
        </Text>
      </ButtonReturnType>
      <ButtonReturnType onClick={() => setExpressExecutionMode(true)} active={enableExpressExecution} role="button">
        <ThunderIcon />
        <Text marginLeft="4px">
          <Trans>Express</Trans>
        </Text>
      </ButtonReturnType>
    </GroupButtonReturnTypes>
  )
}

export default TradeTypeSelection
