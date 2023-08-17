import { Trans, t } from '@lingui/macro'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { MouseoverTooltip } from 'components/Tooltip'
import { Dots } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager } from 'state/user/hooks'
import { checkShouldDisableByPriceImpact } from 'utils/priceImpact'
import { checkPriceImpact } from 'utils/prices'

const CustomPrimaryButton = styled(ButtonPrimary).attrs({
  id: 'swap-button',
})<{ $minimal?: boolean }>`
  border: none;
  font-weight: 500;
  flex: 1;
  &:disabled {
    border: none;
  }
`
export const SwapButtonWithPriceImpact = ({
  isProcessingSwap,
  minimal,
  showLoading,
  onClick,
  priceImpact,
  isApproved,
  route,
  disabled,
  showNoteGetRoute,
  disabledText,
  text,
  showTooltipPriceImpact = true,
}: {
  isProcessingSwap: boolean
  minimal: boolean
  showLoading: boolean
  onClick: () => void
  priceImpact: number | undefined
  isApproved: boolean
  route: any
  disabled?: boolean
  showNoteGetRoute?: boolean
  disabledText?: string
  text?: string
  showTooltipPriceImpact?: boolean
}) => {
  const theme = useTheme()
  const [isDegenMode] = useDegenModeManager()
  const priceImpactResult = checkPriceImpact(priceImpact)

  if (isProcessingSwap) {
    return (
      <CustomPrimaryButton disabled $minimal={minimal}>
        <Dots>
          <Trans>Processing</Trans>
        </Dots>
      </CustomPrimaryButton>
    )
  }

  if (showLoading) {
    return (
      <CustomPrimaryButton disabled $minimal={minimal}>
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      </CustomPrimaryButton>
    )
  }

  const shouldDisableByPriceImpact = checkShouldDisableByPriceImpact(isDegenMode, priceImpact)
  const shouldDisable = !route || !isApproved || shouldDisableByPriceImpact || disabled

  if ((priceImpactResult.isVeryHigh || priceImpactResult.isInvalid) && isDegenMode) {
    return (
      <CustomPrimaryButton
        onClick={onClick}
        disabled={shouldDisable}
        $minimal={minimal}
        style={shouldDisable ? undefined : { background: theme.red }}
      >
        <Trans>Swap Anyway</Trans>
      </CustomPrimaryButton>
    )
  }

  return (
    <CustomPrimaryButton
      disabled={shouldDisable}
      onClick={onClick}
      $minimal={minimal}
      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
    >
      {shouldDisableByPriceImpact && showTooltipPriceImpact ? (
        <MouseoverTooltip
          text={
            <Trans>
              To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled for this trade.
              If you still wish to continue, you can turn on Degen Mode from Settings
            </Trans>
          }
        >
          <Info size={14} />
        </MouseoverTooltip>
      ) : showNoteGetRoute && showTooltipPriceImpact ? (
        <MouseoverTooltip
          text={
            <Trans>
              There was an issue while trying to find a price for these tokens. Please try again. Otherwise, you may
              select some other tokens to swap
            </Trans>
          }
        >
          <Info size={14} />
        </MouseoverTooltip>
      ) : null}
      <Text>{shouldDisable ? disabledText || t`Swap Disabled` : text || t`Swap`}</Text>
    </CustomPrimaryButton>
  )
}
export default SwapButtonWithPriceImpact
