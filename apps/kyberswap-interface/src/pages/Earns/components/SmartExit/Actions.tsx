import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { MEDIA_WIDTHS } from 'theme'

export default function Actions({
  onDismiss,
  onPreview,
  disabled,
  feeLoading,
  positionLoading,
}: {
  onDismiss: () => void
  onPreview: () => void
  disabled: boolean
  feeLoading: boolean
  positionLoading: boolean
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <div className={`mt-5 flex justify-center gap-5 ${upToSmall ? 'pb-5' : 'pb-0'}`}>
      <ButtonOutlined onClick={onDismiss} width="188px">
        <span className="text-sm leading-5">
          <Trans>Cancel</Trans>
        </span>
      </ButtonOutlined>
      <ButtonPrimary width="188px" disabled={disabled} onClick={onPreview}>
        <span className="text-sm leading-5">
          {positionLoading ? (
            <Trans>Loading position...</Trans>
          ) : feeLoading ? (
            <Trans>Estimating fee...</Trans>
          ) : (
            <Trans>Preview</Trans>
          )}
        </span>
      </ButtonPrimary>
    </div>
  )
}
