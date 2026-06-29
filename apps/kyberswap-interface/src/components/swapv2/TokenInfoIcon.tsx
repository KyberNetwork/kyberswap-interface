import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'

import { MouseoverTooltip } from 'components/Tooltip'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { Field } from 'state/swap/actions'

type TokenInfoIconProps = {
  currencies: { [field in Field]?: Currency }
  onClick?: () => void
  size?: number
}

const TokenInfoIcon = ({ onClick, size }: TokenInfoIconProps) => {
  return (
    <StyledActionButtonSwapForm onClick={onClick}>
      <MouseoverTooltip text={t`Token Info`} placement="top" width="fit-content" disableTooltip={isMobile}>
        <Info className="text-subText" size={size || 20} />
      </MouseoverTooltip>
    </StyledActionButtonSwapForm>
  )
}

export default TokenInfoIcon
