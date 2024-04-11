import { Trans } from '@lingui/macro'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { darken } from 'polished'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import { useCloseModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  & > * {
    width: 100%;
  }
`

const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`

const LoadingMessage = styled.div<{ hasError?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  border-radius: 16px;
  color: ${({ theme, hasError }) => (hasError ? theme.red1 : 'inherit')};
  border: 1px solid ${({ theme, hasError }) => (hasError ? theme.red1 : theme.text4)};
  width: 100%;
  & > * {
    padding: 1rem;
  }
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
  display: flex;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size:14px;
  `}
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.primary};
  background-color: rgba(49, 203, 158, 0.2);
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;
  min-width: 70px;
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.1, theme.bg5)};
  }
`

const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  width: 100%;
`

export default function PendingView() {
  const { activationState, tryActivation } = useActivationState()

  const { chainId } = useActiveWeb3React()
  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  if (activationState.status === ActivationStatus.IDLE) return null

  const { name } = activationState.connection.getProviderInfo()

  return (
    <PendingSection>
      <LoadingMessage hasError={activationState.status === ActivationStatus.ERROR}>
        <LoadingWrapper>
          {activationState.status === ActivationStatus.ERROR ? (
            <ErrorGroup>
              <div>
                <Trans>Error connecting to {name}.</Trans>
              </div>
              <ErrorButton
                onClick={() =>
                  tryActivation(
                    activationState.connection,
                    () => {
                      closeWalletModal()
                    },
                    chainId,
                  )
                }
              >
                <Trans>Try Again</Trans>
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              <Trans>Initializing with {name}...</Trans>
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
    </PendingSection>
  )
}
