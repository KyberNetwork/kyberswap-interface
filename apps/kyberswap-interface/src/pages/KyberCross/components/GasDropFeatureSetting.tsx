import { Trans, t } from '@lingui/macro'

import { SettingsLabel, SettingsRow, SettingsToggle } from 'components/TransactionSettings/components'
import { updateGasDropFeatureEnabled, useGasDropFeatureEnabled } from 'state/crossChainSwap'
import { useAppDispatch } from 'state/hooks'

export const GasDropFeatureSetting = () => {
  const enabled = useGasDropFeatureEnabled()
  const dispatch = useAppDispatch()

  return (
    <SettingsRow>
      <SettingsLabel
        tooltip={t`Show Gas Drop controls to receive native gas on the destination chain. Available only in KyberCross mode.`}
      >
        <Trans>Gas Drop</Trans>
      </SettingsLabel>
      <SettingsToggle isActive={enabled} toggle={() => dispatch(updateGasDropFeatureEnabled(!enabled))} />
    </SettingsRow>
  )
}
