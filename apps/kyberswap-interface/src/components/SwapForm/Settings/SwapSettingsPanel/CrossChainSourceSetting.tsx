import { Trans, t } from '@lingui/macro'
import { useMemo } from 'react'
import { ChevronRight } from 'react-feather'

import { SettingsAction, SettingsLabel, SettingsRow } from 'components/TransactionSettings/components'
import { CrossChainSwapFactory } from 'pages/Swap/crossChain/factory'
import { type CrossChainQuoteMode } from 'state/crossChainSwap'
import { useAppSelector } from 'state/hooks'

const EMPTY_SOURCES: string[] = []

const CrossChainSourceSetting = ({
  onClick,
  quoteMode: mode,
}: {
  onClick: () => void
  quoteMode?: CrossChainQuoteMode
}) => {
  const quoteMode = mode ?? 'stream'
  const sources = useMemo(() => CrossChainSwapFactory.getSelectableSources(quoteMode), [quoteMode])
  const sourceNames = useMemo(() => sources.map(item => item.getName()), [sources])
  const storedExcludedSources = useAppSelector(
    state =>
      (quoteMode === 'direct'
        ? state.crossChainSwap.kyberCrossExcludedSources
        : state.crossChainSwap.excludedSources) || EMPTY_SOURCES,
  )
  const excludedSources = useMemo(
    () => storedExcludedSources.filter(source => sourceNames.includes(source)),
    [sourceNames, storedExcludedSources],
  )
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

export default CrossChainSourceSetting
