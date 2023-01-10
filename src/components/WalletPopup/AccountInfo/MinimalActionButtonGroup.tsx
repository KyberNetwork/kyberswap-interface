import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { ReactComponent as SendIcon } from 'assets/svg/send_icon.svg'
import { ButtonLight } from 'components/Button'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'

const MinimalActionButton = styled(ButtonLight)`
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  padding: 0;
`

type Props = {
  className?: string
} & ClickHandlerProps
const MinimalActionButtonGroup: React.FC<Props> = ({ onClickBuy, onClickReceive, onClickSend, className }) => {
  return (
    <Flex
      className={className}
      sx={{
        gap: '4px',
      }}
    >
      <MinimalActionButton onClick={onClickBuy}>
        <DollarIcon width={'24px'} height={'24px'} />
      </MinimalActionButton>
      <MinimalActionButton onClick={onClickReceive}>
        <SendIcon width={'14px'} height={'14px'} style={{ transform: 'rotate(180deg)' }} />
      </MinimalActionButton>
      <MinimalActionButton onClick={onClickSend}>
        <SendIcon width={'14px'} height={'14px'} />
      </MinimalActionButton>
    </Flex>
  )
}

export default styled(MinimalActionButtonGroup)``
