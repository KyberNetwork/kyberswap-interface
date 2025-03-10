import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'

import { MouseoverTooltip } from 'components/Tooltip'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'

function TokenInfoIcon({ onClick }: { currencies: { [field in Field]?: Currency }; onClick?: () => void }) {
  const theme = useTheme()

  return (
    <StyledActionButtonSwapForm onClick={onClick}>
      <MouseoverTooltip text={t`Token Info`} placement="top" width="fit-content" disableTooltip={isMobile}>
        <Info color={theme.subText} size={20} />
      </MouseoverTooltip>
    </StyledActionButtonSwapForm>
  )
}

export default TokenInfoIcon
