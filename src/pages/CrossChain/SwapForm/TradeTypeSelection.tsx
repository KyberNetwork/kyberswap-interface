import { Trans, t } from '@lingui/macro'
import { Clock } from 'react-feather'
import { Text } from 'rebass/styled-components'

import { ReactComponent as ThunderIcon } from 'assets/svg/thunder_icon.svg'
import { MouseoverTooltip } from 'components/Tooltip'
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
        <MouseoverTooltip text={t`Will cost more gas fees`} width="fit-content">
          <ThunderIcon />
          <Text marginLeft="4px">
            <Trans>Express</Trans>
          </Text>
        </MouseoverTooltip>
      </ButtonReturnType>
    </GroupButtonReturnTypes>
  )
}

export default TradeTypeSelection
