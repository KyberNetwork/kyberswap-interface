import { Trans, t } from '@lingui/macro'
import { ChevronRight } from 'react-feather'

import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { useAppSelector } from 'state/hooks'

export const CrossChainSourceSetting: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const sources = CrossChainSwapFactory.getAllAdapters()
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources || [])
  const selectedSources = sources.filter(item => !excludedSources.includes(item.getName()))

  return (
    <div className="flex cursor-pointer items-center justify-between text-sm" onClick={onClick}>
      <div className="flex">
        <TextDashed fontSize={12} fontWeight={400} className="text-subText">
          <MouseoverTooltip text={t`Your trade is routed through one of these cross-chain sources.`} placement="right">
            <Trans>Cross-Chain Routing Sources</Trans>
          </MouseoverTooltip>
        </TextDashed>
      </div>

      <div className="flex">
        <span>
          <Trans>
            {selectedSources.length || sources.length} out of {sources.length} selected
          </Trans>
        </span>
        <ChevronRight size={20} className="text-subText" />
      </div>
    </div>
  )
}
