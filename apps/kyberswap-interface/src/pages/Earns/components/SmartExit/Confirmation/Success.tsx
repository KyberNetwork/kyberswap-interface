import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

export default function Success({
  onDismiss,
  onCloseSmartExit,
}: {
  onDismiss: () => void
  onCloseSmartExit: () => void
}) {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <>
      <div className="flex items-center justify-between">
        <div />
        <X onClick={onCloseSmartExit} />
      </div>

      <div className="flex items-center justify-center gap-2 text-xl font-medium">
        <CheckCircle color={theme.primary} size="20px" />

        <span>
          <Trans>Condition saved</Trans>
        </span>
      </div>

      <p className="mt-6 text-sm text-subText">
        <Trans>Your Smart Exit condition has been created successfully.</Trans>
      </p>

      <div className="mt-6 flex gap-3">
        <ButtonOutlined onClick={onDismiss} flex={1}>
          <Trans>Cancel</Trans>
        </ButtonOutlined>
        <ButtonPrimary
          flex={1}
          onClick={() => {
            onCloseSmartExit()
            navigate(APP_PATHS.EARN_SMART_EXIT)
          }}
        >
          <Trans>View All Condition(s)</Trans>
        </ButtonPrimary>
      </div>
    </>
  )
}
