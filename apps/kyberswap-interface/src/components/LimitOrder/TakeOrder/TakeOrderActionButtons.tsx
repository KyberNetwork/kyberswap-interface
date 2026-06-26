import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { HStack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'

type Props = {
  canSubmit: boolean
  primaryActionMessage: ReactNode
  requiresWrap: boolean
  shouldWarnMarketDiff: boolean
  onSubmit: () => void
  onUseSwapInstead: () => void
}

const ActionWrapper = ({ children }: { children: ReactNode }) => (
  <HStack className="gap-3 max-sm:flex-col">{children}</HStack>
)

const TakeOrderActionButtons = ({
  canSubmit,
  primaryActionMessage,
  requiresWrap,
  shouldWarnMarketDiff,
  onSubmit,
  onUseSwapInstead,
}: Props) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const shouldConnectWallet = !account

  if (shouldConnectWallet) {
    return (
      <ActionWrapper>
        <ButtonPrimary onClick={toggleWalletModal} className="flex-1">
          <Trans>Connect wallet</Trans>
        </ButtonPrimary>
      </ActionWrapper>
    )
  }

  if (primaryActionMessage) {
    return (
      <ActionWrapper>
        <ButtonPrimary disabled className="flex-1">
          {primaryActionMessage}
        </ButtonPrimary>
      </ActionWrapper>
    )
  }

  if (shouldWarnMarketDiff) {
    return (
      <ActionWrapper>
        <ButtonPrimary onClick={onUseSwapInstead} className="flex-1">
          <Trans>Use Swap Instead</Trans>
        </ButtonPrimary>
        <ButtonOutlined
          className={cn('flex-1', canSubmit && '!border-red hover:!bg-red-10')}
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          <Trans>Fill order anyway</Trans>
        </ButtonOutlined>
      </ActionWrapper>
    )
  }

  return (
    <ActionWrapper>
      <ButtonOutlined onClick={onUseSwapInstead} className="flex-1 !border-border-primary">
        <Trans>Use Swap Instead</Trans>
      </ButtonOutlined>
      <ButtonPrimary altDisabledStyle onClick={onSubmit} disabled={!canSubmit} className="flex-1">
        {requiresWrap ? <Trans>Wrap & Fill this order</Trans> : <Trans>Fill this order</Trans>}
      </ButtonPrimary>
    </ActionWrapper>
  )
}

export default TakeOrderActionButtons
