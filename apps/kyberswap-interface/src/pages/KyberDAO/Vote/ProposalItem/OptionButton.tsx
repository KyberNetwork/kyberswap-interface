import { t } from '@lingui/macro'
import { CheckSquare, Square } from 'react-feather'

import RadioButtonChecked from 'components/Icons/RadioButtonChecked'
import RadioButtonUnchecked from 'components/Icons/RadioButtonUnchecked'
import { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { HARDCODED_OPTION_TITLE } from 'pages/KyberDAO/constants'
import { cn } from 'utils/cn'

const STRIPE_OVERLAY =
  "after:absolute after:inset-0 after:bg-[image:linear-gradient(-45deg,rgba(0,0,0,0.1)_28%,transparent_28%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_78%,transparent_78%,transparent)] after:bg-[length:25px_25px] after:[animation:ks-stripe-move_1.5s_linear_infinite] after:content-['']"

export default function OptionButton({
  checked,
  percent = 40,
  title,
  type = 'Finished',
  onOptionClick,
  isCheckBox,
  disabled,
  proposalId,
  id,
}: {
  checked?: boolean
  percent?: number
  title?: string
  type?: 'Finished' | 'Active' | 'Choosing' | 'Pending'
  onOptionClick?: () => void
  isCheckBox: boolean
  disabled?: boolean
  proposalId: number
  id: number
}) {
  const parsedPercent = parseFloat(percent.toFixed(2) || '0')
  const hardCodedTitle = HARDCODED_OPTION_TITLE[proposalId]?.[id]
  return (
    <div
      onClick={() => !disabled && onOptionClick?.()}
      className={cn(
        'relative flex min-h-9 w-full select-none items-center justify-between overflow-hidden rounded bg-buttonBlack p-2.5',
        type === 'Pending' && 'text-subText',
        !disabled && 'cursor-pointer hover:brightness-110',
      )}
    >
      <div className="z-[4] w-full">
        <RowBetween className="z-[1] items-center">
          <MouseoverTooltip
            text={type === 'Pending' && t`Cannot vote at this moment`}
            placement="top"
            width="fit-content"
          >
            <RowFit className="gap-[5px] overflow-hidden break-words text-xs">
              <div className="w-[18px] [&>svg]:block">
                {isCheckBox ? (
                  checked ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )
                ) : checked ? (
                  <RadioButtonChecked />
                ) : (
                  <RadioButtonUnchecked />
                )}{' '}
              </div>
              <span>{`${id}. ${hardCodedTitle || title}`}</span>
            </RowFit>
          </MouseoverTooltip>
          <span className="px-1 text-xs">{parsedPercent}%</span>
        </RowBetween>
      </div>

      {type === 'Active' && (
        <div className="absolute inset-y-0 left-0 z-0 rounded bg-primary" style={{ width: `${percent || 0}%` }} />
      )}
      {type === 'Choosing' && (
        <div className={cn('absolute inset-y-0 left-0 z-0 w-full rounded bg-darkerGreen', STRIPE_OVERLAY)} />
      )}
      {type === 'Finished' && (
        <div className="absolute inset-y-0 left-0 z-0 rounded bg-primary-20" style={{ width: `${percent || 0}%` }} />
      )}
    </div>
  )
}
