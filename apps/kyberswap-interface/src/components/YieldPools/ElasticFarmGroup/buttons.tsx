import { Trans } from '@lingui/macro'

import { ButtonLight } from 'components/Button'

export const ConnectWalletButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  onClick,
  style,
  ...others
}) => {
  return (
    <ButtonLight
      style={{ flex: 1, height: '38px', padding: '8px 16px', width: 'fit-content', ...style }}
      onClick={onClick}
      {...others}
    >
      <Trans>Connect</Trans>
    </ButtonLight>
  )
}
