import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'

import { MouseoverTooltip } from 'components/Tooltip'
import { SecurityLevel, useSwapTokensSecurityLevel } from 'components/swapv2/TokenInfo/useTokenSecurityLevel'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { Field } from 'state/swap/actions'
import { cn } from 'utils/cn'

type TokenInfoIconProps = {
  currencies: { [field in Field]?: Currency }
  onClick?: () => void
  size?: number
}

const TokenInfoIcon = ({ currencies, onClick, size }: TokenInfoIconProps) => {
  const securityLevel = useSwapTokensSecurityLevel(currencies)

  const tooltipText =
    securityLevel === SecurityLevel.RISKY
      ? t`Risky items detected on these tokens. Check Token Info before trading`
      : securityLevel === SecurityLevel.WARNING
      ? t`Attention items detected on these tokens. Check Token Info before trading`
      : t`Token Info`

  return (
    <StyledActionButtonSwapForm onClick={onClick}>
      <MouseoverTooltip text={tooltipText} placement="top" width="fit-content" disableTooltip={isMobile}>
        <span className="relative inline-flex leading-none">
          <Info
            className={cn(
              securityLevel === SecurityLevel.RISKY
                ? 'text-red'
                : securityLevel === SecurityLevel.WARNING
                ? 'text-warning'
                : 'text-subText',
            )}
            size={size || 20}
          />
          {securityLevel !== SecurityLevel.NONE && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 size-1.5 rounded-full',
                securityLevel === SecurityLevel.RISKY ? 'bg-red' : 'bg-warning',
              )}
            />
          )}
        </span>
      </MouseoverTooltip>
    </StyledActionButtonSwapForm>
  )
}

export default TokenInfoIcon
