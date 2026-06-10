import { Trans } from '@lingui/macro'
import React, { useMemo } from 'react'

import SlippageControl from 'components/SlippageControl'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import PinButton from 'components/swapv2/SwapSettingsPanel/PinButton'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY, PAIR_CATEGORY } from 'constants/index'
import { usePairCategory } from 'state/swap/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'

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

      <SlippageControl rawSlippage={rawSlippage} setRawSlippage={setRawSlippage} options={options} />
    </div>
  )
}

export default SlippageSetting
