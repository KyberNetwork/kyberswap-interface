import { Trans } from '@lingui/macro'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'

const BtnLight = styled(ButtonLight)`
  padding: 8px 12px;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px;
  `};
`

export const ConnectWalletButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  onClick,
  style,
  ...others
}) => {
  return (
    <BtnLight style={{ flex: 1, height: '38px', padding: '8px 16px' }} onClick={onClick} {...others}>
      <Trans>Connect</Trans>
    </BtnLight>
  )
}
