import { Trans, t } from '@lingui/macro'
import { ChevronRight } from 'react-feather'

import { SettingsAction, SettingsLabel, SettingsRow } from 'components/TransactionSettings/components'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { useAppSelector } from 'state/hooks'

export const CrossChainSourceSetting = ({ onClick }: { onClick: () => void }) => {
  const sources = CrossChainSwapFactory.getAllAdapters()
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources || [])
  const selectedSources = sources.filter(item => !excludedSources.includes(item.getName()))

  return (
    <SettingsRow>
      <SettingsLabel tooltip={t`Your trade is routed through one of these cross-chain sources.`}>
        <Trans>Cross-Chain Routing Sources</Trans>
      </SettingsLabel>

      <SettingsAction onClick={onClick}>
        <span>
          <Trans>
            {selectedSources.length || sources.length} out of {sources.length} selected
          </Trans>
        </span>
        <ChevronRight size={14} />
      </SettingsAction>
    </SettingsRow>
  )
}
