import { Trans } from '@lingui/macro'
import { CheckCircle } from 'react-feather'
import { Flex, Text } from 'rebass'
import { DustSwapRouteApiResponse } from 'services/dustSwap'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import useDustExecute from '../hooks/useDustExecute'

const Wrapper = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const Summary = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${({ theme }) => theme.subText};
`

const Strong = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  text-align: center;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.red1};
  font-size: 13px;
  text-align: center;
`

const PathBadge = styled.span<{ atomic?: boolean }>`
  display: inline-block;
  margin-left: 8px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme, atomic }) => (atomic ? theme.primary : theme.buttonGray)};
  color: ${({ theme, atomic }) => (atomic ? theme.background : theme.subText)};
`

type Props = {
  isOpen: boolean
  onDismiss: () => void
  route: DustSwapRouteApiResponse | undefined
  onSuccess: () => void
}

const usd = (v?: string) => {
  if (!v) return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  return formatDisplayNumber(n, { style: 'currency', significantDigits: 4 })
}

const ConfirmModal = ({ isOpen, onDismiss, route, onSuccess }: Props) => {
  const { chainId } = useActiveWeb3React()
  const { inputs, outputToken, slippage } = useDustLiquidationState()
  const { execute, status, error, txHash, path, approvalProgress, reset } = useDustExecute({ route })

  const details = route?.data?.zapDetails
  const inputCount = inputs.filter(i => i.amount && Number(i.amount) > 0).length

  const handleClose = () => {
    if (status === 'success') onSuccess()
    if (status === 'idle' || status === 'success' || status === 'error') {
      reset()
      onDismiss()
    }
  }

  const renderBody = () => {
    if (status === 'building') {
      return (
        <StatusBox>
          <Loader />
          <Text>
            <Trans>Preparing transaction…</Trans>
          </Text>
        </StatusBox>
      )
    }
    if (status === 'approving') {
      return (
        <StatusBox>
          <Loader />
          <Text>
            <Trans>
              Approving tokens ({approvalProgress?.current ?? 0}/{approvalProgress?.total ?? 0})…
            </Trans>
          </Text>
        </StatusBox>
      )
    }
    if (status === 'submitting') {
      return (
        <StatusBox>
          <Loader />
          <Text>
            <Trans>Confirm in your wallet…</Trans>
          </Text>
          {path && <PathBadge atomic={path === 'atomic'}>{path === 'atomic' ? 'EIP-5792' : 'Sequential'}</PathBadge>}
        </StatusBox>
      )
    }
    if (status === 'pending') {
      return (
        <StatusBox>
          <Loader />
          <Text>
            <Trans>Transaction pending…</Trans>
          </Text>
          {txHash && (
            <ExternalLink href={getEtherscanLink(chainId, txHash, 'transaction')}>
              <Trans>View on explorer</Trans>
            </ExternalLink>
          )}
        </StatusBox>
      )
    }
    if (status === 'success') {
      return (
        <StatusBox>
          <CheckCircle size={40} color="#31CB9E" />
          <Text fontWeight={500}>
            <Trans>Liquidation complete</Trans>
          </Text>
          {txHash && (
            <ExternalLink href={getEtherscanLink(chainId, txHash, 'transaction')}>
              <Trans>View on explorer</Trans>
            </ExternalLink>
          )}
        </StatusBox>
      )
    }

    return (
      <>
        <Summary>
          <Row>
            <span>
              <Trans>Tokens in</Trans>
            </span>
            <Strong>{inputCount}</Strong>
          </Row>
          <Row>
            <span>
              <Trans>Total input</Trans>
            </span>
            <Strong>{usd(details?.initialAmountUsd)}</Strong>
          </Row>
          <Row>
            <span>
              <Trans>You receive</Trans>
            </span>
            <Strong>
              {outputToken?.symbol} ≈ {usd(details?.finalAmountUsd)}
            </Strong>
          </Row>
          <Row>
            <span>
              <Trans>Slippage</Trans>
            </span>
            <Strong>{(slippage / 100).toFixed(2)}%</Strong>
          </Row>
        </Summary>
        {error && <ErrorText>{error}</ErrorText>}
      </>
    )
  }

  const isWorking = status === 'building' || status === 'approving' || status === 'submitting' || status === 'pending'

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} maxWidth={460}>
      <Wrapper>
        <Flex justifyContent="space-between" alignItems="center">
          <Title>
            <Trans>Confirm Liquidation</Trans>
          </Title>
        </Flex>

        {renderBody()}

        {!isWorking && status !== 'success' && (
          <Flex sx={{ gap: '12px' }}>
            <ButtonOutlined onClick={handleClose}>
              <Trans>Cancel</Trans>
            </ButtonOutlined>
            <ButtonPrimary onClick={execute} disabled={!route?.data}>
              {status === 'error' ? <Trans>Retry</Trans> : <Trans>Confirm</Trans>}
            </ButtonPrimary>
          </Flex>
        )}

        {status === 'success' && (
          <ButtonPrimary onClick={handleClose}>
            <Trans>Done</Trans>
          </ButtonPrimary>
        )}
      </Wrapper>
    </Modal>
  )
}

export default ConfirmModal
