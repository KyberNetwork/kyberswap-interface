import { Trans } from '@lingui/macro'

import { ButtonLight } from 'components/Button'
import SendIcon from 'components/Icons/SendIcon'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'
import { cn } from 'utils/cn'

type Props = {
  className?: string
} & ClickHandlerProps
const ActionButtonGroup: React.FC<Props> = ({ onClickReceive, onClickSend, className, disabledSend }) => {
  return (
    <div data-action="full" className={cn('flex gap-1', className)}>
      <ButtonLight onClick={onClickReceive} className="!h-10 flex-1">
        <SendIcon style={{ transform: 'rotate(180deg)' }} />
        <span className="ml-[7px]">
          <Trans>Receive</Trans>
        </span>
      </ButtonLight>
      <ButtonLight onClick={onClickSend} disabled={disabledSend} className="!h-10 flex-1">
        <SendIcon />
        <span className="ml-[7px]">
          <Trans>Send</Trans>
        </span>
      </ButtonLight>
    </div>
  )
}

export default ActionButtonGroup
