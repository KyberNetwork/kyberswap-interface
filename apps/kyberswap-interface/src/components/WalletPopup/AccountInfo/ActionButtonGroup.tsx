import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import SendIcon from 'components/Icons/SendIcon'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'

const ActionButton = styled(ButtonLight)`
  flex: 1 1 0;
  height: 40px;
`

type Props = {
  className?: string
} & ClickHandlerProps
const ActionButtonGroup: React.FC<Props> = ({ onClickReceive, onClickSend, className, disabledSend }) => {
  return (
    <Flex
      className={className}
      sx={{
        gap: '4px',
      }}
    >
      <ActionButton onClick={onClickReceive}>
        <SendIcon style={{ transform: 'rotate(180deg)' }} />
        <Text as="span" marginLeft="7px">
          <Trans>Receive</Trans>
        </Text>
      </ActionButton>
      <ActionButton onClick={onClickSend} disabled={disabledSend}>
        <SendIcon />
        <Text as="span" marginLeft="7px">
          <Trans>Send</Trans>
        </Text>
      </ActionButton>
    </Flex>
  )
}

export default styled(ActionButtonGroup)``
