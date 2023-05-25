import { Trans } from '@lingui/macro'
import { Save } from 'react-feather'
import styled, { css } from 'styled-components'

import { ButtonConfirmed, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { XCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'

const ButtonText = styled.div`
  font-size: 14px;
  font-weight: 500;
`

const shareStyle = css`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    justify-content: space-around;
`};
`
const ActionWrapper = styled.div<{ isHorizontal: boolean }>`
  display: flex;
  gap: 20px;
  flex-direction: row;
  align-items: center;
  ${({ isHorizontal }) => !isHorizontal && shareStyle};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${shareStyle}
`};
`

const shareStyleBtn = (isHorizontal: boolean) => css`
  width: ${!isHorizontal ? '45%' : '120px'};
  height: 36px;
  border-radius: 46px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 45%;
`};
`
const ButtonUnSub = styled(ButtonOutlined)<{ isHorizontal: boolean }>`
  ${({ isHorizontal }) => shareStyleBtn(isHorizontal)}
`
const ButtonSave = styled(ButtonPrimary)<{ isHorizontal: boolean }>`
  ${({ isHorizontal }) => shareStyleBtn(isHorizontal)}
`

export default function ActionButtons({
  disableButtonSave,
  isLoading,
  onSave,
  onUnsubscribeAll,
  isTelegramTab,
  subscribeAtLeast1Topic,
  isHorizontal,
}: {
  disableButtonSave: boolean
  subscribeAtLeast1Topic: boolean
  isTelegramTab: boolean
  isLoading: boolean
  onSave: () => void
  onUnsubscribeAll: () => void
  isHorizontal: boolean // todo rename
}) {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const unSubButton = subscribeAtLeast1Topic ? (
    <ButtonUnSub onClick={onUnsubscribeAll} isHorizontal={isHorizontal}>
      <XCircle size={'14px'} />
      &nbsp;
      <Trans>Opt-out</Trans>
    </ButtonUnSub>
  ) : (
    isHorizontal && <div />
  )
  return (
    <ActionWrapper isHorizontal={isHorizontal}>
      {unSubButton}
      {!account ? (
        <ButtonConfirmed confirmed onClick={toggleWalletModal}>
          <ButtonText>
            <Trans>Connect Wallet</Trans>
          </ButtonText>
        </ButtonConfirmed>
      ) : (
        <ButtonSave disabled={disableButtonSave} onClick={onSave} isHorizontal={isHorizontal}>
          <Save size={14} />
          &nbsp;
          <ButtonText>
            {(() => {
              if (isLoading) {
                return (
                  <Row>
                    <Loader />
                    &nbsp;
                    {isTelegramTab ? <Trans>Generating Verification Link ...</Trans> : <Trans>Saving ...</Trans>}
                  </Row>
                )
              }
              return isTelegramTab ? <Trans>Get Started</Trans> : <Trans>Save</Trans>
            })()}
          </ButtonText>
        </ButtonSave>
      )}
    </ActionWrapper>
  )
}
