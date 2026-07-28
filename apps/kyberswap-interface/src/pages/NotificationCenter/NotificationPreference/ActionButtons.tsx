import { Trans } from '@lingui/macro'
import { Save } from 'react-feather'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { XCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'

const BTN_CLASS = 'h-9 w-[120px] rounded-[46px] max-sm:w-[45%]'

export default function ActionButtons({
  disableButtonSave,
  isLoading,
  onSave,
  onUnsubscribeAll,
  subscribeAtLeast1Topic,
  tooltipSave,
}: {
  disableButtonSave: boolean
  subscribeAtLeast1Topic: boolean
  isLoading: boolean
  onSave: () => void
  onUnsubscribeAll: () => void
  tooltipSave: string
}) {
  return (
    <div className="flex flex-row items-center gap-5 max-sm:mt-1 max-sm:w-full max-sm:justify-around">
      <ButtonOutlined className={BTN_CLASS} onClick={onUnsubscribeAll} disabled={!subscribeAtLeast1Topic}>
        <XCircle size={'14px'} />
        &nbsp;
        <Trans>Opt-out</Trans>
      </ButtonOutlined>

      <ButtonPrimary className={BTN_CLASS} disabled={disableButtonSave} onClick={onSave}>
        <Save size={14} />
        &nbsp;
        <MouseoverTooltip text={tooltipSave}>
          <span className="text-sm font-medium">
            {(() => {
              if (isLoading) {
                return (
                  <Row>
                    <Loader />
                    &nbsp;
                    <Trans>Saving ...</Trans>
                  </Row>
                )
              }
              return <Trans>Save</Trans>
            })()}
          </span>
        </MouseoverTooltip>
      </ButtonPrimary>
    </div>
  )
}
