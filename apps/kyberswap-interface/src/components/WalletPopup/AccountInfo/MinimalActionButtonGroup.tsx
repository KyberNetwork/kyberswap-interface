import { ButtonLight } from 'components/Button'
import SendIcon from 'components/Icons/SendIcon'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'
import { cn } from 'utils/cn'

type Props = {
  className?: string
} & ClickHandlerProps
const MinimalActionButtonGroup: React.FC<Props> = ({ onClickReceive, onClickSend, className, disabledSend }) => {
  return (
    <div data-action="minimal" className={cn('flex h-full items-center gap-1', className)}>
      <ButtonLight onClick={onClickReceive} className="!h-9 !w-9 !flex-[0_0_36px] !p-0">
        <SendIcon size={14} style={{ transform: 'rotate(180deg)' }} />
      </ButtonLight>
      <ButtonLight onClick={onClickSend} disabled={disabledSend} className="!h-9 !w-9 !flex-[0_0_36px] !p-0">
        <SendIcon size={14} />
      </ButtonLight>
    </div>
  )
}

export default MinimalActionButtonGroup
