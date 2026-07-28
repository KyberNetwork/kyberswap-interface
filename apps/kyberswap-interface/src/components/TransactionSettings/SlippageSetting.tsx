import { Trans } from '@lingui/macro'
import { useMemo } from 'react'

import SlippageControl from 'components/SlippageControl'
import { HStack, Stack } from 'components/Stack'
import { PinButton } from 'components/TransactionSettings/PinButton'
import { SettingsLabel } from 'components/TransactionSettings/components'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOLATILITY, PAIR_CATEGORY } from 'constants/trade'
import { usePairCategory } from 'state/swap/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'

type Props = {
  shouldShowPinButton?: boolean
}

export const SlippageSetting = ({ shouldShowPinButton = true }: Props) => {
  const { rawSlippage, setRawSlippage, isSlippageControlPinned, togglePinSlippage } = useSlippageSettingByPage()

  const pairCategory = usePairCategory()

  const options = useMemo(
    () => (pairCategory === PAIR_CATEGORY.HIGH_VOLATILITY ? DEFAULT_SLIPPAGES_HIGH_VOLATILITY : DEFAULT_SLIPPAGES),
    [pairCategory],
  )

  return (
    <Stack className="gap-1">
      <HStack className="items-center gap-2">
        <SettingsLabel
          tooltip={
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
        >
          <Trans>Max Slippage</Trans>
        </SettingsLabel>

        {shouldShowPinButton && <PinButton isActive={isSlippageControlPinned} onClick={togglePinSlippage} />}
      </HStack>

      <SlippageControl rawSlippage={rawSlippage} setRawSlippage={setRawSlippage} options={options} />
    </Stack>
  )
}
