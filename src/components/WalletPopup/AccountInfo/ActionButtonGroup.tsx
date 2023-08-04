import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { ButtonLight } from 'components/Button'
import SendIcon from 'components/Icons/SendIcon'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'
import useTheme from 'hooks/useTheme'

const ActionButton = styled(ButtonLight)`
  flex: 0 1 105px;
  width: 105px;
  height: 40px;
`

type Props = {
  className?: string
} & ClickHandlerProps
const ActionButtonGroup: React.FC<Props> = ({ onClickBuy, onClickReceive, onClickSend, className, disabledSend }) => {
  const theme = useTheme()
  return (
    <Flex
      className={className}
      sx={{
        justifyContent: 'space-between',
        gap: '4px',
      }}
    >
      <ActionButton onClick={onClickBuy}>
        <DollarIcon color={theme.primary} />
        <Text as="span" marginLeft="7px">
          <Trans>Buy</Trans>
        </Text>
      </ActionButton>
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
