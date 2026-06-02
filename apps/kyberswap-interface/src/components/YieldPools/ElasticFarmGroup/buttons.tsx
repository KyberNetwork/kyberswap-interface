import { Trans } from '@lingui/macro'

import { ButtonLight } from 'components/Button'

export const ConnectWalletButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  onClick,
  style,
  ...others
}) => {
  return (
    <ButtonLight className="h-[38px] w-fit flex-1 px-4 py-2" style={style} onClick={onClick} {...others}>
      <Trans>Connect</Trans>
    </ButtonLight>
  )
}
