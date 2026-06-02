import { Trans } from '@lingui/macro'
import { Dispatch, FC, SetStateAction } from 'react'
import { useSearchParams } from 'react-router-dom'

import Toggle from 'components/Toggle'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDegenModeManager } from 'state/user/hooks'

type Props = {
  showConfirmation: boolean
  setShowConfirmation: Dispatch<SetStateAction<boolean>>
}
const DegenModeSetting: FC<Props> = ({ showConfirmation, setShowConfirmation }) => {
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()
  const { trackingHandler } = useTracking()

  const handleToggleDegenMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      trackingHandler(TRACKING_EVENT_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'off',
      })
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  const [searchParams] = useSearchParams()
  const enableDegenMode = searchParams.get('enableDegenMode') === 'true'

  return (
    <>
      <div
        data-highlight={enableDegenMode}
        className="-m-2 flex justify-between rounded-lg p-2 data-[highlight=true]:animate-highlight"
      >
        <div className="flex w-fit items-center">
          <TextDashed fontSize={12} fontWeight={400} className="text-subText">
            <MouseoverTooltip
              text={
                <Trans>
                  Turn this on to make trades with very high price impact or to set very high slippage tolerance. This
                  can result in bad rates and loss of funds. Be cautious.
                </Trans>
              }
              placement="right"
            >
              <Trans>Degen Mode</Trans>
            </MouseoverTooltip>
          </TextDashed>
        </div>
        <Toggle
          id="toggle-expert-mode-button"
          isActive={isDegenMode}
          toggle={handleToggleDegenMode}
          className="bg-buttonBlack"
        />
      </div>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}

export default DegenModeSetting
