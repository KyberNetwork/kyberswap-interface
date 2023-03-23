import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'

const ButtonTextt = styled.div`
  font-size: 16px;
  font-weight: 500;
`
const ActionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
`

export default function ActionButtons({
  disableButtonSave,
  isLoading,
  onSave,
  onUnsubscribeAll,
  isTelegramTab,
  subscribeAtLeast1Topic,
}: {
  disableButtonSave: boolean
  subscribeAtLeast1Topic: boolean
  isTelegramTab: boolean
  isLoading: boolean
  onSave: () => void
  onUnsubscribeAll: () => void
}) {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  return (
    <ActionWrapper>
      {!account ? (
        <ButtonConfirmed confirmed onClick={toggleWalletModal}>
          <ButtonTextt>
            <Trans>Connect Wallet</Trans>
          </ButtonTextt>
        </ButtonConfirmed>
      ) : (
        <ButtonPrimary disabled={disableButtonSave} borderRadius="46px" height="44px" onClick={onSave}>
          <ButtonTextt>
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
          </ButtonTextt>
        </ButtonPrimary>
      )}
      <Text
        style={{
          cursor: subscribeAtLeast1Topic ? 'pointer' : 'not-allowed',
          color: theme.subText,
          fontWeight: '500',
          fontSize: '14px',
        }}
        onClick={onUnsubscribeAll}
      >
        <Trans>Opt out from all future email</Trans>
      </Text>
    </ActionWrapper>
  )
}
