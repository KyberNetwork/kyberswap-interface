import { Trans } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronRight } from 'react-feather'

import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'
import { cn } from 'utils/cn'

type Props = {
  onClick: () => void
}

const LiquiditySourcesSetting: React.FC<Props> = ({ onClick }) => {
  const allDexes = useAllDexes()
  const [excludeDexes] = useExcludeDexes()

  if (!allDexes?.length) {
    return null
  }

  const numberOfDEXes = allDexes?.length
  const selectedDexes = allDexes.filter(item => !excludeDexes.includes(item.id))

  const groupClass = cn('flex items-center text-subText', isMobile ? 'text-sm' : 'text-xs')

  return (
    <div className="flex cursor-pointer items-center justify-between" onClick={onClick}>
      <div className={groupClass}>
        <TextDashed fontSize={12} fontWeight={400} className="text-subText">
          <MouseoverTooltip
            text={<Trans>Your trade is routed through one or more of these liquidity sources.</Trans>}
            placement="right"
          >
            <Trans>Liquidity Sources</Trans>
          </MouseoverTooltip>
        </TextDashed>
      </div>

      <div className={groupClass}>
        <span className="font-normal leading-4 text-text">
          <Trans>
            {selectedDexes.length || numberOfDEXes} out of {numberOfDEXes} selected
          </Trans>
        </span>
        <ChevronRight size={20} className="text-subText" />
      </div>
    </div>
  )
}

export default LiquiditySourcesSetting
