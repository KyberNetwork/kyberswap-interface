import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'

import { MouseoverTooltip } from 'components/Tooltip'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'

function TokenInfoIcon({
  onClick,
  size,
}: {
  currencies: { [field in Field]?: Currency }
  onClick?: () => void
  size?: number
}) {
  const theme = useTheme()

  return (
    <StyledActionButtonSwapForm
      onClick={onClick}
      style={{ width: size ? size * 1.5 + 'px' : undefined, height: size ? size * 1.5 + 'px' : undefined }}
    >
      <MouseoverTooltip text={t`Token Info`} placement="top" width="fit-content" disableTooltip={isMobile}>
        <Info color={theme.subText} size={size || 20} />
      </MouseoverTooltip>
    </StyledActionButtonSwapForm>
  )
}

export default TokenInfoIcon
