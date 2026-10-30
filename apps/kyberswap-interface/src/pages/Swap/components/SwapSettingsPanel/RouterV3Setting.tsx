import { Trans } from '@lingui/macro'
import routeApi from 'services/route'

import { SettingsLabel, SettingsRow, SettingsToggle } from 'components/TransactionSettings/components'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { setRouterV3Test } from 'state/swap/actions'
import { isInSafeApp } from 'utils/safeApp'

export const RouterV3Setting = () => {
  const dispatch = useAppDispatch()
  const enabled = useAppSelector(state => state.swap.routerV3Test)

  // Safe uses its own client and fee configuration for both quote and build.
  if (isInSafeApp) return null

  const toggle = () => {
    dispatch(setRouterV3Test(!enabled))
    dispatch(routeApi.util.resetApiState())
  }

  return (
    <SettingsRow>
      <SettingsLabel tooltip={<Trans>Test Router V3 on Ethereum, BSC, Base and Robinhood.</Trans>}>
        <Trans>Router V3</Trans>
      </SettingsLabel>
      <SettingsToggle isActive={enabled} toggle={toggle} />
    </SettingsRow>
  )
}
