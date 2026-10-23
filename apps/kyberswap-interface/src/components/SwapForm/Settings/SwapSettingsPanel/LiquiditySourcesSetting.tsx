import { Trans } from '@lingui/macro'
import { ChevronRight } from 'react-feather'

import { SettingsAction, SettingsLabel, SettingsRow } from 'components/TransactionSettings/components'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'

type Props = {
  onClick: () => void
}

export const LiquiditySourcesSetting = ({ onClick }: Props) => {
  const allDexes = useAllDexes()
  const [excludeDexes] = useExcludeDexes()

  if (!allDexes?.length) {
    return null
  }

  const numberOfDEXes = allDexes?.length
  const selectedDexes = allDexes.filter(item => !excludeDexes.includes(item.id))

  return (
    <SettingsRow>
      <SettingsLabel tooltip={<Trans>Your trade is routed through one or more of these liquidity sources.</Trans>}>
        <Trans>Liquidity Sources</Trans>
      </SettingsLabel>

      <SettingsAction onClick={onClick}>
        <span>
          <Trans>
            {selectedDexes.length || numberOfDEXes} out of {numberOfDEXes} selected
          </Trans>
        </span>
        <ChevronRight size={14} />
      </SettingsAction>
    </SettingsRow>
  )
}
