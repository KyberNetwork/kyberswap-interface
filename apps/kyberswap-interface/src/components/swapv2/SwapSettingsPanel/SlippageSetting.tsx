import { Trans, t } from '@lingui/macro'
import React, { useMemo } from 'react'

import SlippageControl from 'components/SlippageControl'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import PinButton from 'components/swapv2/SwapSettingsPanel/PinButton'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY, PAIR_CATEGORY } from 'constants/index'
import { usePairCategory } from 'state/swap/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { SLIPPAGE_STATUS, SLIPPAGE_WARNING_MESSAGES, checkRangeSlippage } from 'utils/slippage'

type Props = {
  shouldShowPinButton?: boolean
}

const SlippageSetting: React.FC<Props> = ({ shouldShowPinButton = true }) => {
  const { rawSlippage, setRawSlippage, isSlippageControlPinned, togglePinSlippage } = useSlippageSettingByPage()

  const pairCategory = usePairCategory()

  const options = useMemo(
    () => (pairCategory === PAIR_CATEGORY.HIGH_VOLATILITY ? DEFAULT_SLIPPAGES_HIGH_VOTALITY : DEFAULT_SLIPPAGES),
    [pairCategory],
  )

  const slippageStatus = checkRangeSlippage(rawSlippage, pairCategory)
  const isWarning = slippageStatus !== SLIPPAGE_STATUS.NORMAL
  const msg = SLIPPAGE_WARNING_MESSAGES[slippageStatus]?.[pairCategory] || ''

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center">
        <TextDashed fontSize={12} fontWeight={400} className="text-subText">
          <MouseoverTooltip
            text={
              <span>
                <Trans>
                  During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                  <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                    here ↗
                  </ExternalLink>
                  .
                </Trans>
              </span>
            }
            placement="right"
          >
            <Trans>Max Slippage</Trans>
          </MouseoverTooltip>
        </TextDashed>

        {shouldShowPinButton && <PinButton isActive={isSlippageControlPinned} onClick={togglePinSlippage} />}
      </div>

      <SlippageControl
        rawSlippage={rawSlippage}
        setRawSlippage={setRawSlippage}
        isWarning={isWarning}
        options={options}
      />

      {isWarning && (
        <div
          data-warning={true}
          data-error={false}
          className="text-xs font-normal leading-4 data-[error=true]:text-red1 data-[warning=true]:text-warning"
        >
          {t`Your slippage ${msg}`}
        </div>
      )}
    </div>
  )
}

export default SlippageSetting
